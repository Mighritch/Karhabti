import { useState } from 'react';
import api from '../../services/api';          // ← important : utiliser l'instance centralisée
import { useAuth } from '../../context/AuthContext';
import { FaSpinner } from 'react-icons/fa';
import './AgenceForm.css';
import type { Agence } from './MesAgences';


interface AgenceFormProps {
  onSuccess: (newAgence: Agence) => void;
  onCancel: () => void;
}

export default function AgenceForm({ onSuccess, onCancel }: AgenceFormProps) {
  const { token, user } = useAuth();   // ← on récupère aussi user pour debug

  const [formData, setFormData] = useState({
    nom: '',
    ville: '',
    adresse: '',
    telephone: '',
    email: '',
    typeAgence: 'vente' as 'vente' | 'location',
    typeVehicule: 'voiture' as 'voiture' | 'moto',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const effectiveToken = token || localStorage.getItem('token');

    if (!effectiveToken) {
      setError("Vous devez être connecté pour créer une agence.");
      return;
    }

    if (user?.role !== 'agent') {
      setError("Seuls les agents peuvent créer une agence.");
      return;
    }

    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      console.log("→ Données envoyées :", formData);

      const res = await api.post<{ success: boolean; data: Agence }>(
        '/agences',
        formData
      );

      console.log("→ Réponse :", res.data);

      if (res.data?.success && res.data.data) {
        onSuccess(res.data.data);
        setFormData({
          nom: '',
          ville: '',
          adresse: '',
          telephone: '',
          email: '',
          typeAgence: 'vente',
          typeVehicule: 'voiture',
        });
      } else {
        setError("Réponse serveur invalide");
      }
    } catch (err: any) {
      console.error("Erreur création agence :", err);

      let message = 'Erreur lors de la création';

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
      <h3>Créer une nouvelle agence</h3>

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
            placeholder="ex: Hammamet"
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
            placeholder="Rue Taieb El Azzabi, Hammamet..."
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
            placeholder="ex: 22854987"
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
            placeholder="ex: staraauto@gmail.com"
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
              <label htmlFor="type-vente" className="choice-label">Vente</label>
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
              <label htmlFor="type-location" className="choice-label">Location</label>
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
              <label htmlFor="vehicule-voiture" className="choice-label">Voiture</label>
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
              <label htmlFor="vehicule-moto" className="choice-label">Moto</label>
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel} disabled={submitting}>
          Annuler
        </button>

        <button type="submit" className="btn-submit" disabled={submitting}>
          {submitting ? (
            <>
              <FaSpinner className="spin" /> Création en cours...
            </>
          ) : (
            'Créer l’agence'
          )}
        </button>
      </div>
    </form>
  );
}