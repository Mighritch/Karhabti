import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FaSpinner } from 'react-icons/fa';
import './AgenceForm.css';
import type { Agence } from './MesAgences';

interface AgenceFormProps {
  agence?: Agence | null;
  onSuccess: (agence: Agence) => void;
  onCancel: () => void;
}

export default function AgenceForm({ agence, onSuccess, onCancel }: AgenceFormProps) {
  const { token } = useAuth();
  const isEditMode = !!agence;

  const [formData, setFormData] = useState({
    nom: agence?.nom || '',
    ville: agence?.ville || '',
    adresse: agence?.adresse || '',
    telephone: agence?.telephone || '',
    email: agence?.email || '',
    typeAgence: (agence?.typeAgence || 'vente') as 'vente' | 'location',
    typeVehicule: (agence?.typeVehicule || 'voiture') as 'voiture' | 'moto',
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
        typeAgence: agence.typeAgence || 'vente',
        typeVehicule: agence.typeVehicule || 'voiture',
      });
    }
  }, [agence]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;
    setSubmitting(true);
    setError(null);

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
            typeAgence: 'vente',
            typeVehicule: 'voiture',
          });
        }
      } else {
        setError('Réponse invalide du serveur');
      }
    } catch (err: any) {
      console.error('Erreur opération agence:', err);
      let message = 'Une erreur est survenue';

      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.response?.data?.errors) {
        message = err.response.data.errors.map((e: any) => e.msg).join(' • ');
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
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
                type="radio"
                id="type-vente"
                name="typeAgence"
                value="vente"
                checked={formData.typeAgence === 'vente'}
                onChange={handleChange}
              />
              <label htmlFor="type-vente">Vente</label>
            </div>
            <div className="choice-item">
              <input
                type="radio"
                id="type-location"
                name="typeAgence"
                value="location"
                checked={formData.typeAgence === 'location'}
                onChange={handleChange}
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
                type="radio"
                id="vehicule-voiture"
                name="typeVehicule"
                value="voiture"
                checked={formData.typeVehicule === 'voiture'}
                onChange={handleChange}
              />
              <label htmlFor="vehicule-voiture">Voiture</label>
            </div>
            <div className="choice-item">
              <input
                type="radio"
                id="vehicule-moto"
                name="typeVehicule"
                value="moto"
                checked={formData.typeVehicule === 'moto'}
                onChange={handleChange}
              />
              <label htmlFor="vehicule-moto">Moto</label>
            </div>
          </div>
        </div>
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