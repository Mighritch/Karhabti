import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FaBuilding, FaPlus, FaSpinner, FaList } from 'react-icons/fa';
import AgenceForm from './AgenceForm';
import VehiculeForm from '../Vehicule/VehiculeForm';
import VehiculeList from '../Vehicule/VehiculeList';
import './MesAgences.css';

export interface Agence {
  _id: string;
  nom: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  typeAgence: 'vente' | 'location';
  typeVehicule: 'voiture' | 'moto';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function MesAgences() {
  const { user, token } = useAuth();

  const [agences, setAgences] = useState<Agence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showVehiculeForm, setShowVehiculeForm] = useState(false);
  const [showVehiculeList, setShowVehiculeList] = useState(false);
  const [selectedAgence, setSelectedAgence] = useState<Agence | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'agent' || !token) {
      setLoading(false);
      return;
    }

    const fetchMyAgences = async () => {
      try {
        setLoading(true);

        const res = await api.get<{ success: boolean; data: Agence[]; message?: string }>('/agences/me');

        if (res.data?.success) {
          setAgences(res.data.data ?? []);
        } else {
          setAgences([]);
        }
      } catch (err: any) {
        console.error("Erreur lors de GET /agences/me", err);
        setAgences([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyAgences();
  }, [user, token]);

  const openVehiculeForm = (agence: Agence) => {
    setSelectedAgence(agence);
    setShowVehiculeForm(true);
    setShowVehiculeList(false);
  };

  const openVehiculeList = (agence: Agence) => {
    setSelectedAgence(agence);
    setShowVehiculeList(true);
    setShowVehiculeForm(false);
  };

  const handleAgenceCreated = (newAgence: Agence) => {
    setAgences((prev) => [...prev, newAgence]);
    setShowForm(false);
  };

  const allApproved = agences.every((a) => a.status === 'approved');

  if (!user) {
    return <div className="access-denied"><h2>Veuillez vous connecter</h2></div>;
  }

  if (user.role !== 'agent') {
    return <div className="access-denied"><h2>Accès réservé aux agents</h2></div>;
  }

  return (
    <div className="mes-agences-page">
      <div className="page-header">
        <h1><FaBuilding /> Mes Agences</h1>
        {!showForm && allApproved && (
          <button className="btn-create" onClick={() => setShowForm(true)}>
            <FaPlus /> Ajouter une agence
          </button>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <AgenceForm onSuccess={handleAgenceCreated} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <div className="loading"><FaSpinner className="spin" /> Chargement...</div>
      ) : agences.length === 0 ? (
        <div className="no-agence">
          <p>Vous n'avez pas encore créé d'agence.</p>
          <button className="btn-create" onClick={() => setShowForm(true)}><FaPlus /> Créer mon agence</button>
        </div>
      ) : (
        <div className="agences-grid">
          {agences.map((agence) => (
            <div key={agence._id} className={`agence-card shadow-premium ${agence.status}`}>
              <h3>{agence.nom}</h3>
              <div className="card-body">
                <p>
                  <span className="type-badge">{agence.typeAgence === 'vente' ? 'Vente' : 'Location'}</span>
                  <span className="type-badge">{agence.typeVehicule === 'voiture' ? '🚗 Voiture' : '🏍️ Moto'}</span>
                  <span className={`status-badge ${agence.status}`}>{agence.status}</span>
                </p>
                <p><strong>{agence.ville}</strong> • {agence.adresse}</p>
              </div>

              {agence.status === 'approved' && (
                <div className="actions">
                  <button className="btn-list-vehicles" onClick={() => openVehiculeList(agence)}>
                    <FaList /> Voir véhicules
                  </button>
                  <button className="btn-add-vehicle" onClick={() => openVehiculeForm(agence)}>
                    + Ajouter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showVehiculeForm && selectedAgence && (
        <div className="modal-overlay">
          <VehiculeForm
            agenceId={selectedAgence._id}
            typeVehicule={selectedAgence.typeVehicule}
            onSuccess={() => {
              setShowVehiculeForm(false);
              openVehiculeList(selectedAgence);
            }}
            onCancel={() => setShowVehiculeForm(false)}
          />
        </div>
      )}

      {showVehiculeList && selectedAgence && (
        <div className="modal-overlay">
          <VehiculeList
            agenceId={selectedAgence._id}
            typeVehicule={selectedAgence.typeVehicule}
            onClose={() => setShowVehiculeList(false)}
            onAddClick={() => openVehiculeForm(selectedAgence)}
          />
        </div>
      )}
    </div>
  );
}