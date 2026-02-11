import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FaSpinner } from 'react-icons/fa';
import './AgenceForm.css';
import type { Agence } from './MesAgences';
import type { SubmitHandler } from 'react-hook-form';

interface AgenceFormProps {
  agence?: Agence | null;
  onSuccess: (agence: Agence) => void;
  onCancel: () => void;
}

interface AgenceFormData {
  nom: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  typeAgence: ('vente' | 'location')[];
  typeVehicule: ('voiture' | 'moto')[];
  etatVehicule: ('neuf' | 'occasion')[];
}

export default function AgenceForm({ agence, onSuccess, onCancel }: AgenceFormProps) {
  const isEditMode = !!agence;

  const [formData, setFormData] = useState<AgenceFormData>({
    nom: agence?.nom || '',
    ville: agence?.ville || '',
    adresse: agence?.adresse || '',
    telephone: agence?.telephone || '',
    email: agence?.email || '',
    typeAgence: (agence?.typeAgence || ['vente']) as ('vente' | 'location')[],
    typeVehicule: (agence?.typeVehicule || ['voiture']) as ('voiture' | 'moto')[],
    etatVehicule: (agence?.etatVehicule || ['neuf']) as ('neuf' | 'occasion')[],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agence) {
      setFormData({
        nom: agence.nom || '',
        ville: agence.ville || '',
        adresse: agence.adresse || '',
        telephone: agence.telephone || '',
        email: agence.email || '',
        typeAgence: agence.typeAgence || ['vente'],
        typeVehicule: agence.typeVehicule || ['voiture'],
        etatVehicule: agence.etatVehicule || ['neuf'],
      });
    }
  }, [agence]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: keyof AgenceFormData, value: string) => {
    setFormData((prev) => {
      const key = name as keyof AgenceFormData;
      const currentValues = (prev[key] as unknown as string[]) || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      // Ensure at least one is selected for required fields
      if (newValues.length === 0 && (name === 'typeAgence' || name === 'typeVehicule')) {
        return prev;
      }

      return { ...prev, [key]: newValues } as AgenceFormData;
    });
  };

  const handleSubmit: SubmitHandler<AgenceFormData> = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const extractErrorMessage = (err: unknown) => {
      if (typeof err === 'object' && err !== null) {
        const e = err as { response?: { data?: { message?: string; errors?: { msg?: string }[] } }; message?: string };
        if (e.response?.data?.message) return e.response.data.message;
        if (Array.isArray(e.response?.data?.errors)) return e.response!.data!.errors!.map(x => x.msg || '').filter(Boolean).join(' • ');
        if (typeof e.message === 'string') return e.message;
      }
      return 'Une erreur est survenue';
    };

    try {
      let res;
      if (isEditMode && agence) {
        res = await api.put(`/agences/${agence._id}`, formData);
      } else {
        res = await api.post('/agences', formData);
      }

      if (res.data?.success && res.data.data) {
        onSuccess(res.data.data);
        if (!isEditMode) {
          setFormData({
            nom: '',
            ville: '',
            adresse: '',
            telephone: '',
            email: '',
            typeAgence: ['vente'],
            typeVehicule: ['voiture'],
            etatVehicule: ['neuf'],
          });
        }
      } else {
        setError('Réponse invalide du serveur');
      }
    } catch (err: unknown) {
      console.error('Erreur opération agence:', err);
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="agence-form glass-card" noValidate>
      <h3>{isEditMode ? 'Modifier l’agence' : 'Créer une nouvelle agence'}</h3>

      {error && <div className="form-error">{error}</div>}

      <div className="form-grid">
        <div className="form-group">
          <label>Nom de l'agence *</label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            placeholder="ex: Star Auto"
          />
        </div>

        <div className="form-group">
          <label>Ville *</label>
          <input
            type="text"
            name="ville"
            value={formData.ville}
            onChange={handleChange}
            required
            placeholder="ex: Tunis"
          />
        </div>

        <div className="form-group full-width">
          <label>Adresse complète *</label>
          <input
            type="text"
            name="adresse"
            value={formData.adresse}
            onChange={handleChange}
            required
            placeholder="Rue exemple, Tunis..."
          />
        </div>

        <div className="form-group">
          <label>Téléphone *</label>
          <input
            type="tel"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            required
            placeholder="ex: 98765432"
          />
        </div>

        <div className="form-group">
          <label>Email professionnel *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="ex: contact@agence.tn"
          />
        </div>

        <div className="form-group">
          <label>Type d'activité *</label>
          <div className="choice-group">
            <div className="choice-item">
              <input
                type="checkbox"
                id="type-vente"
                checked={formData.typeAgence.includes('vente')}
                onChange={() => handleCheckboxChange('typeAgence', 'vente')}
              />
              <label htmlFor="type-vente">Vente</label>
            </div>
            <div className="choice-item">
              <input
                type="checkbox"
                id="type-location"
                checked={formData.typeAgence.includes('location')}
                onChange={() => handleCheckboxChange('typeAgence', 'location')}
              />
              <label htmlFor="type-location">Location</label>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Type de véhicule *</label>
          <div className="choice-group">
            <div className="choice-item">
              <input
                type="checkbox"
                id="vehicule-voiture"
                checked={formData.typeVehicule.includes('voiture')}
                onChange={() => handleCheckboxChange('typeVehicule', 'voiture')}
              />
              <label htmlFor="vehicule-voiture">Voiture</label>
            </div>
            <div className="choice-item">
              <input
                type="checkbox"
                id="vehicule-moto"
                checked={formData.typeVehicule.includes('moto')}
                onChange={() => handleCheckboxChange('typeVehicule', 'moto')}
              />
              <label htmlFor="vehicule-moto">Moto</label>
            </div>
          </div>
        </div>

        {formData.typeAgence.includes('vente') && (
          <div className="form-group">
            <label>État des véhicules *</label>
            <div className="choice-group">
              <div className="choice-item">
                <input
                  type="checkbox"
                  id="etat-neuf"
                  checked={formData.etatVehicule.includes('neuf')}
                  onChange={() => handleCheckboxChange('etatVehicule', 'neuf')}
                />
                <label htmlFor="etat-neuf">Neuf</label>
              </div>
              <div className="choice-item">
                <input
                  type="checkbox"
                  id="etat-occasion"
                  checked={formData.etatVehicule.includes('occasion')}
                  onChange={() => handleCheckboxChange('etatVehicule', 'occasion')}
                />
                <label htmlFor="etat-occasion">Occasion</label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-cancel"
          onClick={onCancel}
          disabled={submitting}
        >
          Annuler
        </button>

        <button type="submit" className="btn-submit" disabled={submitting}>
          {submitting ? (
            <>
              <FaSpinner className="spin" /> En cours...
            </>
          ) : isEditMode ? (
            'Enregistrer les modifications'
          ) : (
            'Créer l’agence'
          )}
        </button>
      </div>
    </form>
  );
}