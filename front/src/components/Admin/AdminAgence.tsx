import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  FaCheck, FaTimes, FaSpinner, 
  FaCar, FaMotorcycle, FaEye 
} from 'react-icons/fa';
import { AxiosError } from 'axios';
import VehiculeList from '../Vehicule/VehiculeList';
import './AdminAgences.css';

interface Agence {
  _id: string;
  nom: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  typeAgence: ('vente' | 'location')[];
  typeVehicule: ('voiture' | 'moto')[];
  status: 'pending' | 'approved' | 'rejected';
  agent: {
    nom: string;
    prenom: string;
    email: string;
  };
  createdAt: string;
  totalVoitures?: number;
  totalMotos?: number;
  totalVehicules?: number;
}

export default function AdminAgences() {
  const { user } = useAuth();
  
  const [allAgences, setAllAgences] = useState<Agence[]>([]);
  const [pendingAgences, setPendingAgences] = useState<Agence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedAgence, setSelectedAgence] = useState<Agence | null>(null);
  const [showVehicules, setShowVehicules] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        const res = await api.get('/agences/my-agence');
        
        if (res.data?.success) {
          const agencesData = res.data.data || [];
          setAllAgences(agencesData);
          setPendingAgences(agencesData.filter((a: Agence) => a.status === 'pending'));
        }
      } catch (err: unknown) {
        console.error(err);
        const axiosErr = err as AxiosError;
        setError(axiosErr.response?.data?.message || 'Erreur lors du chargement des agences');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleStatusChange = async (agenceId: string, status: 'approved' | 'rejected') => {
    if (!window.confirm(`Confirmer : ${status === 'approved' ? 'approuver' : 'rejeter'} cette agence ?`)) {
      return;
    }

    try {
      const res = await api.put(`/agences/${agenceId}/approve`, { status });
      
      if (res.data.success) {
        setAllAgences(prev =>
          prev.map(a => a._id === agenceId ? { ...a, status } : a)
        );
        setPendingAgences(prev => prev.filter(a => a._id !== agenceId));
      }
    } catch (err: unknown) {
      const axiosErr = err as AxiosError;
      alert(axiosErr.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  const viewVehicles = (agence: Agence) => {
    setSelectedAgence(agence);
    setShowVehicules(true);
  };

  if (user?.role !== 'admin') {
    return <div className="access-denied">Accès réservé aux administrateurs</div>;
  }

  if (loading) {
    return (
      <div className="loading">
        <FaSpinner className="spin" /> Chargement des agences...
      </div>
    );
  }

  return (
    <div className="admin-agences-page">
      <h1>Gestion des Agences</h1>

      {error && <div className="error-message">{error}</div>}

      <section className="pending-section">
        <h2>Agences en attente ({pendingAgences.length})</h2>
        
        {pendingAgences.length === 0 ? (
          <p className="empty">Aucune agence en attente d'approbation.</p>
        ) : (
          <div className="agences-grid">
            {pendingAgences.map(agence => (
              <div key={agence._id} className={`agence-card ${agence.status}`}>
                <div className="agence-header">
                  <h3>{agence.nom}</h3>
                  <span className={`status-badge ${agence.status}`}>
                    {agence.status === 'pending' ? 'En attente' :
                     agence.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                  </span>
                </div>
                
                <p className="location">{agence.ville} • {agence.adresse}</p>
                <p className="types">
                  {agence.typeAgence.join(' & ')} • {agence.typeVehicule.join(' & ')}
                </p>
                
                <div className="agent-info">
                  Agent : {agence.agent?.prenom} {agence.agent?.nom} 
                  <small>({agence.agent?.email})</small>
                </div>

                <div className="agence-stats">
                  <div><FaCar /> {agence.totalVoitures ?? 0} voitures</div>
                  <div><FaMotorcycle /> {agence.totalMotos ?? 0} motos</div>
                  <div className="total"><strong>Total : {agence.totalVehicules ?? 0}</strong></div>
                </div>

                <div className="actions">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="all-agences-section">
        <h2>Toutes les agences ({allAgences.length})</h2>
        
        {allAgences.length === 0 ? (
          <p className="empty">Aucune agence enregistrée.</p>
        ) : (
          <div className="agences-grid">
            {allAgences.map(agence => (
              <div key={agence._id} className={`agence-card ${agence.status}`}>
                <div className="agence-header">
                  <h3>{agence.nom}</h3>
                  <span className={`status-badge ${agence.status}`}>
                    {agence.status === 'pending' ? 'En attente' :
                     agence.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                  </span>
                </div>
                
                <p className="location">{agence.ville} • {agence.adresse}</p>
                <p className="types">
                  {agence.typeAgence.join(' & ')} • {agence.typeVehicule.join(' & ')}
                </p>
                
                <div className="agent-info">
                  Agent : {agence.agent?.prenom} {agence.agent?.nom} 
                  <small>({agence.agent?.email})</small>
                </div>

                <div className="agence-stats">
                  <div><FaCar /> {agence.totalVoitures ?? 0} voitures</div>
                  <div><FaMotorcycle /> {agence.totalMotos ?? 0} motos</div>
                  <div className="total"><strong>Total : {agence.totalVehicules ?? 0}</strong></div>
                </div>

                <div className="actions">
                  <button 
                    className="btn-view-vehicles"
                    onClick={() => viewVehicles(agence)}
                    disabled={agence.totalVehicules === 0}
                  >
                    <FaEye /> Voir les véhicules ({agence.totalVehicules ?? 0})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showVehicules && selectedAgence && (
        <div className="vehicules-modal-overlay">
          <div className="vehicules-modal">
            <div className="modal-header">
              <h2>
                Véhicules de : {selectedAgence.nom}
                <small> ({selectedAgence.totalVehicules ?? 0} au total)</small>
              </h2>
              <button className="btn-close-modal" onClick={() => setShowVehicules(false)}>
                ×
              </button>
            </div>

            <VehiculeList
              agenceId={selectedAgence._id}
              typeVehicule="voiture"
              onClose={() => setShowVehicules(false)}
              onAddClick={() => {}}
              isAdminView={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}