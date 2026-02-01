import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  FaBuilding, FaPlus, FaSpinner, FaList, FaEdit, 
  FaTrash, FaCheck, FaTimes, FaCar, FaMotorcycle, FaEye 
} from 'react-icons/fa';
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
  typeAgence: ('vente' | 'location')[];
  typeVehicule: ('voiture' | 'moto')[];
  etatVehicule?: ('neuf' | 'occasion')[];
  status: 'pending' | 'approved' | 'rejected';
  agent?: {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  createdAt: string;
  totalVoitures?: number;
  totalMotos?: number;
  totalVehicules?: number;
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
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'agent' && user.role !== 'admin') || !token) {
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

  const handleStatusChange = async (agenceId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await api.put(`/agences/${agenceId}/approve`, { status });
      if (res.data.success) {
        setAgences((prev) =>
          prev.map((a) => (a._id === agenceId ? { ...a, status } : a))
        );
        toast.success(`Agence ${status === 'approved' ? 'approuvée' : 'rejetée'}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleEdit = (agence: Agence) => {
    setEditingAgence(agence);
    setShowForm(true);
  };

  const handleDelete = async (agenceId: string, agenceNom: string) => {
    toast(
      (t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <span>Confirmer la suppression de "{agenceNom}" ?</span>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn-cancel" onClick={() => toast.dismiss(t.id)}>Annuler</button>
            <button className="btn-delete" onClick={async () => {
              try {
                const res = await api.delete(`/agences/${agenceId}`);
                if (res.data.success) {
                  setAgences((prev) => prev.filter((a) => a._id !== agenceId));
                  toast.success('Agence supprimée avec succès');
                }
              } catch (err: any) {
                toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
              } finally {
                toast.dismiss(t.id);
              }
            }}>
              Supprimer
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  const handleSuccess = (updatedAgence: Agence) => {
    setAgences((prev) =>
      prev.map((a) => (a._id === updatedAgence._id ? updatedAgence : a))
    );
    setShowForm(false);
    setEditingAgence(null);
    toast.success('Agence mise à jour avec succès');
  };

  const handleCreateSuccess = (newAgence: Agence) => {
    setAgences((prev) => [...prev, newAgence]);
    setShowForm(false);
    toast.success('Agence créée avec succès');
  };

  const handleVehiculeSuccess = () => {
    setShowVehiculeForm(false);
    toast.success('Véhicule ajouté avec succès');
  };

  const handleViewProfile = (agence: Agence) => {
    setSelectedAgence(agence);
    setShowProfileModal(true);
  };

  if (loading) {
    return <div className="loading">Chargement de vos agences... <FaSpinner className="spin" /></div>;
  }

  if (!user || (user.role !== 'agent' && user.role !== 'admin')) {
    return <div className="error">Accès non autorisé. Vous devez être agent ou admin.</div>;
  }

  const isAdmin = user.role === 'admin';
  const canCreate = !isAdmin && agences.length === 0;

  return (
    <div className="mes-agences-page">
      <div className="page-header">
        <h1>{isAdmin ? 'Gestion des Agences' : 'Mes Agences'}</h1>
        {canCreate && (
          <button className="btn-create" onClick={() => setShowForm(true)}>
            <FaPlus /> Ajouter une agence
          </button>
        )}
      </div>

      {showForm && (
        <div className="form-container">
          <AgenceForm
            agence={editingAgence}
            onSuccess={editingAgence ? handleSuccess : handleCreateSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingAgence(null);
            }}
          />
        </div>
      )}

      {agences.length === 0 ? (
        <p className="no-agence">
          {isAdmin ? 'Aucune agence enregistrée sur la plateforme.' : 'Vous n’avez pas encore d’agence. Ajoutez-en une !'}
        </p>
      ) : (
        <div className="agences-list">
          {agences.map((agence) => (
            <div key={agence._id} className="agence-card">
              <div className="card-header">
                <FaBuilding className="icon" />
                <h3>{agence.nom}</h3>
                <span className={`status-badge ${agence.status}`}>
                  {agence.status === 'approved' ? 'Approuvée' : agence.status === 'pending' ? 'En attente' : 'Rejetée'}
                </span>
              </div>

              <div className="card-info">
                <p>{agence.ville} • {agence.adresse}</p>
                <p>{agence.telephone} • {agence.email}</p>
              </div>

              {isAdmin && (
                <div className="stats-section">
                  <h4>Statistiques Véhicules</h4>
                  <p><FaCar /> Voitures: {agence.totalVoitures ?? 0}</p>
                  <p><FaMotorcycle /> Motos: {agence.totalMotos ?? 0}</p>
                  <p>Total: {agence.totalVehicules ?? 0}</p>
                </div>
              )}

              <div className="card-actions">
                {isAdmin ? (
                  <>
                    {agence.status === 'pending' && (
                      <>
                        <button
                          className="btn-approve"
                          onClick={() => handleStatusChange(agence._id, 'approved')}
                        >
                          <FaCheck /> Approuver
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleStatusChange(agence._id, 'rejected')}
                        >
                          <FaTimes /> Rejeter
                        </button>
                      </>
                    )}
                    <button
                      className="btn-view-profile"
                      onClick={() => handleViewProfile(agence)}
                    >
                      <FaEye /> Voir profil
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-edit" onClick={() => handleEdit(agence)}>
                      <FaEdit /> Modifier
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(agence._id, agence.nom)}>
                      <FaTrash /> Supprimer
                    </button>
                  </>
                )}
              </div>

              {agence.status === 'approved' && (
                <div className="vehicule-actions">
                  <button
                    className="btn-add-vehicule"
                    onClick={() => {
                      setSelectedAgence(agence);
                      setShowVehiculeForm(true);
                    }}
                  >
                    <FaPlus /> Ajouter un véhicule
                  </button>
                  <button
                    className="btn-list-vehicule"
                    onClick={() => {
                      setSelectedAgence(agence);
                      setShowVehiculeList(true);
                    }}
                  >
                    <FaList /> Voir les véhicules
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showVehiculeForm && selectedAgence && (
        <div className="modal-overlay">
          <div className="modal-content">
            <VehiculeForm
              agenceId={selectedAgence._id}
              typeVehicule={selectedAgence.typeVehicule[0]}
              onSuccess={handleVehiculeSuccess}
              onCancel={() => setShowVehiculeForm(false)}
            />
          </div>
        </div>
      )}

      {showVehiculeList && selectedAgence && (
        <div className="modal-overlay">
          <div className="modal-content">
            <VehiculeList
              agenceId={selectedAgence._id}
              typeVehicule={selectedAgence.typeVehicule[0]}
              onClose={() => setShowVehiculeList(false)}
              onAddClick={() => {
                setShowVehiculeList(false);
                setShowVehiculeForm(true);
              }}
            />
          </div>
        </div>
      )}

      {showProfileModal && selectedAgence && (
        <div className="modal-overlay">
          <div className="modal-content profile-modal">
            <h2>Détails de l'agence : {selectedAgence.nom}</h2>
            <div className="profile-details">
              <div className="detail-item">
                <span className="label">Nom:</span>
                <span className="value">{selectedAgence.nom}</span>
              </div>
              <div className="detail-item">
                <span className="label">Ville:</span>
                <span className="value">{selectedAgence.ville}</span>
              </div>
              <div className="detail-item">
                <span className="label">Adresse:</span>
                <span className="value">{selectedAgence.adresse}</span>
              </div>
              <div className="detail-item">
                <span className="label">Téléphone:</span>
                <span className="value">{selectedAgence.telephone}</span>
              </div>
              <div className="detail-item">
                <span className="label">Email:</span>
                <span className="value">{selectedAgence.email}</span>
              </div>
              <div className="detail-item">
                <span className="label">Type d'agence:</span>
                <span className="value">{selectedAgence.typeAgence.map(t => t === 'vente' ? 'Vente' : 'Location').join(' & ')}</span>
              </div>
              <div className="detail-item">
                <span className="label">Type de véhicules:</span>
                <span className="value">{selectedAgence.typeVehicule.map(v => v === 'voiture' ? '🚗 Voitures' : '🏍️ Motos').join(' & ')}</span>
              </div>
              {selectedAgence.typeAgence.includes('vente') && selectedAgence.etatVehicule && (
                <div className="detail-item">
                  <span className="label">État des véhicules:</span>
                  <span className="value">{selectedAgence.etatVehicule.map(e => e === 'neuf' ? 'Neuf' : 'Occasion').join(' & ')}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="label">Statut:</span>
                <span className={`value status-badge ${selectedAgence.status}`}>
                  {selectedAgence.status === 'approved' ? 'Approuvée' :
                    selectedAgence.status === 'pending' ? 'En attente' : 'Rejetée'}
                </span>
              </div>

              {isAdmin && (
                <div className="stats-section">
                  <h3>Statistiques Véhicules</h3>
                  <div className="detail-item">
                    <span className="label"><FaCar /> Voitures:</span>
                    <span className="value">{selectedAgence.totalVoitures ?? 0}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label"><FaMotorcycle /> Motos:</span>
                    <span className="value">{selectedAgence.totalMotos ?? 0}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Total Véhicules:</span>
                    <span className="value">{selectedAgence.totalVehicules ?? 0}</span>
                  </div>
                </div>
              )}

              {selectedAgence.agent && (
                <div className="agent-info-section">
                  <h3>Agent Responsable</h3>
                  <div className="detail-item">
                    <span className="label">Nom complet:</span>
                    <span className="value">{selectedAgence.agent.prenom} {selectedAgence.agent.nom}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email de l'agent:</span>
                    <span className="value">{selectedAgence.agent.email}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-submit" onClick={() => setShowProfileModal(false)}>Retour</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}