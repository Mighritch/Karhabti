// src/components/Agence/MesAgences.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FaBuilding, FaPlus, FaSpinner, FaList, FaEdit, FaTrash } from 'react-icons/fa';
import AgenceForm from './AgenceForm';
import VehiculeForm from '../Vehicule/VehiculeForm';
import VehiculeList from '../Vehicule/VehiculeList';
import toast from 'react-hot-toast';

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
  const [editingAgence, setEditingAgence] = useState<Agence | null>(null);
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
        const res = await api.get<{ success: boolean; data: Agence[]; message?: string }>('/agences/my-agence');

        if (res.data?.success) {
          setAgences(res.data.data ?? []);
        } else {
          setAgences([]);
        }
      } catch (err: any) {
        console.error("Erreur lors de GET /agences/my-agence", err);
        setAgences([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyAgences();
  }, [user, token]);

  const handleEdit = (agence: Agence) => {
    setEditingAgence(agence);
    setShowForm(true);
  };

  const handleDelete = async (agenceId: string, agenceNom: string) => {
    toast(
      (t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '320px' }}>
          <span>
            Confirmer la suppression de <strong>{agenceNom}</strong> ?
          </span>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#444',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const res = await api.delete(`/agences/${agenceId}`);
                  if (res.data.success) {
                    setAgences((prev) => prev.filter((a) => a._id !== agenceId));
                    toast.success(`L'agence "${agenceNom}" a été supprimée`, {
                      icon: '🗑️',
                      duration: 4000,
                    });
                  }
                } catch (err: any) {
                  toast.error(err.response?.data?.message || 'Erreur lors de la suppression', {
                    duration: 5000,
                  });
                }
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Supprimer
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: 'top-center',
        style: {
          background: '#222',
          color: '#fff',
          borderRadius: '8px',
          padding: '16px',
        },
      }
    );
  };

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

  const handleAgenceCreatedOrUpdated = (agence: Agence) => {
    if (editingAgence) {
      setAgences((prev) =>
        prev.map((a) => (a._id === agence._id ? agence : a))
      );
      setEditingAgence(null);
    } else {
      setAgences((prev) => [...prev, agence]);
    }
    setShowForm(false);
  };

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
        <button
          className="btn-create"
          onClick={() => {
            setEditingAgence(null);
            setShowForm(true);
          }}
        >
          <FaPlus /> Nouvelle agence
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <FaSpinner className="spin" /> Chargement...
        </div>
      ) : agences.length === 0 ? (
        <div className="no-agence">
          <p>Vous n'avez pas encore créé d'agence.</p>
          <button className="btn-create" onClick={() => setShowForm(true)}>
            <FaPlus /> Créer mon agence
          </button>
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
                  <span className={`status-badge ${agence.status}`}>
                    {agence.status === 'approved' ? 'Approuvée' :
                     agence.status === 'pending' ? 'En attente' : 'Rejetée'}
                  </span>
                </p>
                <p><strong>{agence.ville}</strong> • {agence.adresse}</p>
              </div>

              <div className="actions">
                {agence.status === 'approved' && (
                  <>
                    <button className="btn-list-vehicles" onClick={() => openVehiculeList(agence)}>
                      <FaList /> Véhicules
                    </button>
                    <button className="btn-add-vehicle" onClick={() => openVehiculeForm(agence)}>
                      + Ajouter véhicule
                    </button>
                  </>
                )}

                <button
                  className="btn-edit"
                  onClick={() => handleEdit(agence)}
                  title="Modifier cette agence"
                >
                  <FaEdit /> Modifier
                </button>

                <button
                  className="btn-delete"
                  onClick={() => handleDelete(agence._id, agence.nom)}
                  title="Supprimer cette agence"
                >
                  <FaTrash /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <AgenceForm
            agence={editingAgence}
            onSuccess={handleAgenceCreatedOrUpdated}
            onCancel={() => {
              setShowForm(false);
              setEditingAgence(null);
            }}
          />
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