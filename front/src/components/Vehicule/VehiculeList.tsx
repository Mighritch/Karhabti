import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FaCar, FaMotorcycle, FaTrash, FaSpinner, FaPlus, FaEdit } from 'react-icons/fa';
import VehiculeForm from './VehiculeForm';
import './VehiculeList.css';

interface Vehicule {
  _id: string;
  marque: string;
  modele: string;
  annee: number;
  immatriculation: string;
  images: { url: string; nomFichier: string }[];
  kilometrage?: number;
  categorie?: string;
  typeMoto?: string;
  couleur: string;
  etat: 'neuf' | 'occasion';
  motorisation: string;
  prix?: number;
  createdAt: string;
}

interface VehiculeListProps {
  agenceId: string;
  typeVehicule: 'voiture' | 'moto';
  onClose: () => void;
  onAddClick: () => void;
}

export default function VehiculeList({
  agenceId,
  typeVehicule,
  onClose,
  onAddClick,
}: VehiculeListProps) {
  const { token } = useAuth();
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editVehicule, setEditVehicule] = useState<Vehicule | null>(null);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const fetchVehicules = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = typeVehicule === 'voiture' ? '/vehicules/me/voitures' : '/vehicules/me/motos';
      const res = await api.get(endpoint, {
        params: { agenceId },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setVehicules(res.data.data);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur lors de la récupération des véhicules');
    } finally {
      setLoading(false);
    }
  }, [agenceId, typeVehicule, token]);

  useEffect(() => {
    fetchVehicules();
  }, [fetchVehicules]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce véhicule ?')) return;

    try {
      await api.delete(`/vehicules/${typeVehicule}s/${id}`, {
        params: { agenceId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setVehicules((prev) => prev.filter((v) => v._id !== id));
    } catch (err: unknown) {
      alert((err as Error).message || 'Erreur lors de la suppression');
    }
  };

  const handleEdit = (vehicule: Vehicule) => {
    setEditVehicule(vehicule);
  };

  const handleEditSuccess = () => {
    setEditVehicule(null);
    fetchVehicules();
  };

  const handleEditCancel = () => {
    setEditVehicule(null);
  };

  return (
    <div className="vehicule-list-container">
      <div className="list-header">
        <h2>
          {typeVehicule === 'voiture' ? <FaCar /> : <FaMotorcycle />}
          Véhicules de l'agence
        </h2>
        <div className="header-actions">
          <button className="btn-add-inline" onClick={onAddClick}>
            <FaPlus /> Ajouter
          </button>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>
      </div>

      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Rechercher par marque, modèle, type ou immat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">
          <FaSpinner className="spin" /> Chargement...
        </div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : vehicules.length === 0 ? (
        <div className="empty-state">
          <p>Aucun véhicule trouvé dans cette agence.</p>
          <button className="btn-create-first" onClick={onAddClick}>
            Ajouter mon premier véhicule
          </button>
        </div>
      ) : (
        <div className="vehicule-grid">
          {vehicules
            .filter((v) => {
              const search = searchTerm.toLowerCase();
              const type = v.categorie || v.typeMoto || '';
              return (
                v.marque.toLowerCase().includes(search) ||
                v.modele.toLowerCase().includes(search) ||
                type.toLowerCase().includes(search) ||
                (v.immatriculation && v.immatriculation.toLowerCase().includes(search))
              );
            })
            .map((v) => (
              <div key={v._id} className="vehicule-card">
                <div className="vehicule-image">
                  {v.images && v.images.length > 0 ? (
                    <img src={getImageUrl(v.images[0].url)} alt={`${v.marque} ${v.modele}`} />
                  ) : (
                    <div className="no-image">Pas d'image</div>
                  )}
                </div>

                <div className="vehicule-info">
                  <h3>
                    {v.marque} {v.modele}
                  </h3>

                  <p className="v-meta">
                    <span>
                      Année: <strong>{v.annee}</strong>
                    </span>
                    <span>
                      Immat: <strong>{v.immatriculation || '—'}</strong>
                    </span>
                  </p>

                  <p className="v-meta">
                    <span>
                      KM: <strong>{v.kilometrage?.toLocaleString('fr-TN') || '—'}</strong>
                    </span>
                    <span>
                      Type: <strong>{v.categorie || v.typeMoto || '—'}</strong>
                    </span>
                  </p>

                  <p className="v-meta price-line">
                    <span>
                      Prix: <strong>{v.prix?.toLocaleString('fr-TN') ?? '—'} TND</strong>
                    </span>
                  </p>

                  <p
                    className="v-meta price-context"
                    style={{ fontSize: '0.82rem', color: '#777', marginTop: '-4px' }}
                  >
                    {v.etat === 'neuf' ? '(prix neuf indicatif)' : '(prix occasion marché)'}
                  </p>

                  <div className="card-actions">
                    <button
                      className="btn-edit"
                      style={{ flex: 1 }}
                      onClick={() => handleEdit(v)}
                    >
                      <FaEdit /> Modifier
                    </button>
                    <button
                      className="btn-delete"
                      style={{ flex: 1 }}
                      onClick={() => handleDelete(v._id)}
                    >
                      <FaTrash /> Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {editVehicule && (
        <div className="edit-modal">
          <VehiculeForm
            agenceId={agenceId}
            typeVehicule={typeVehicule}
            onSuccess={handleEditSuccess}
            onCancel={handleEditCancel}
            vehiculeId={editVehicule._id}
            initialData={editVehicule}
          />
        </div>
      )}
    </div>
  );
}