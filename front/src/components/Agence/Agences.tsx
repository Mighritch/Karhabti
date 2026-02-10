// src/components/Agence/Agences.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaMapMarkerAlt, FaEye } from 'react-icons/fa';
import AgenceForm from './AgenceForm';
import './Agences.css';

interface Agence {
  _id: string;
  nom: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  typeAgence: 'vente' | 'location';
  typeVehicule: 'voiture' | 'moto';
  etatVehicule?: string;           // peut être "neuf", "occasion", "tous", etc.
  status?: 'pending' | 'approved' | 'rejected';
}

export default function Agences() {
  const { user, token } = useAuth();

  const [agences, setAgences] = useState<Agence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAgence, setSelectedAgence] = useState<Agence | null>(null);

  useEffect(() => {
    const fetchAgences = async () => {
      try {
        setError(null);
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await axios.get('/api/agences/public', config);

        if (response.data?.success === true) {
          setAgences(response.data.data || []);
        } else {
          setError('Format de réponse inattendu');
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
          err.response ? `Erreur ${err.response.status}` : 
          'Impossible de contacter le serveur'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAgences();
  }, [token]);

  const handleAgenceCreated = (newAgence: Agence) => {
    setAgences((prev) => [...prev, newAgence]);
    setShowCreateForm(false);
  };

  const closeModal = () => setSelectedAgence(null);

  if (loading) return <div className="loading">Chargement des agences...</div>;

  const isAgent = user?.role === 'agent';

  return (
    <div className="agences-page">
      <div className="page-header">
        <h1>Nos agences</h1>
        {isAgent && !showCreateForm && (
          <button className="btn-create" onClick={() => setShowCreateForm(true)}>
            <FaPlus /> Ajouter mon agence
          </button>
        )}
      </div>

      {showCreateForm && isAgent && (
        <AgenceForm
          onSuccess={handleAgenceCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {error && (
        <div className="error-message">
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {agences.length === 0 && !error ? (
        <p className="no-data">Aucune agence trouvée pour le moment.</p>
      ) : (
        <div className="agences-grid">
          {agences.map((agence) => (
            <div key={agence._id} className="agence-card">
              <h3>{agence.nom}</h3>
              <p>{agence.ville} • {agence.adresse}</p>
              <p>
                <strong>Type d'agence :</strong> {agence.typeAgence}
              </p>
              <p>
                <strong>Type de véhicule :</strong> {agence.typeVehicule}
              </p>
              {agence.etatVehicule && (
                <p>
                  <strong>État des véhicules :</strong> {agence.etatVehicule}
                </p>
              )}
              <small>
                Contact : {agence.telephone} • {agence.email}
              </small>

              <div className="card-actions">
                <a
                  className="btn-map"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${agence.adresse}, ${agence.ville}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaMapMarkerAlt /> Carte
                </a>
                <button
                  className="btn-details"
                  onClick={() => setSelectedAgence(agence)}
                >
                  <FaEye /> Détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal détails */}
      {selectedAgence && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
            <h2>{selectedAgence.nom}</h2>

            <div className="detail-row">
              <span className="detail-label">Ville :</span>
              <span>{selectedAgence.ville}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Adresse :</span>
              <span>{selectedAgence.adresse}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Téléphone :</span>
              <span>{selectedAgence.telephone}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email :</span>
              <span>{selectedAgence.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Type d'agence :</span>
              <span className="value">{selectedAgence.typeAgence}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Type de véhicule :</span>
              <span className="value">{selectedAgence.typeVehicule}</span>
            </div>
            {selectedAgence.etatVehicule && (
              <div className="detail-row">
                <span className="detail-label">État des véhicules :</span>
                <span className="value">{selectedAgence.etatVehicule}</span>
              </div>
            )}

            <button className="btn-close" onClick={closeModal}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}