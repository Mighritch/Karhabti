// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { FaCar, FaMotorcycle, FaPlus } from 'react-icons/fa';
import api from '../services/api';
import ProtectedRoute from '../components/ProtectedRoute'; // ou ton HOC de protection
import { useAuth } from '../context/AuthContext';
import AgenceForm from '../components/Agence/AgenceForm';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVoitures: 0,
    totalMotos: 0,
    totalVehicules: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreateSuccess = (newAgence: any) => {
    setShowCreate(false);
    toast.success('Agence créée avec succès');
    navigate('/mes-agences');
  }; 

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const res = await api.get('/vehicules/stats');
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Impossible de charger les stats globales", err);
      } finally {
        setLoading(false);
      }
    };

    // Ne charger les stats que si l'utilisateur est admin
    if (user?.role === 'admin') {
      fetchGlobalStats();
    } else {
      // Aucune requête nécessaire pour les non-admins
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="dashboard-page">
      <h1>Bienvenue sur votre tableau de bord</h1>

      {user?.role === 'agent' && (
        <div className="dashboard-actions">
          <button className="btn-create" onClick={() => setShowCreate(true)}>
            <FaPlus /> Ajouter une agence
          </button>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AgenceForm onSuccess={handleCreateSuccess} onCancel={() => setShowCreate(false)} />
          </div>
        </div>
      )} 

      {user?.role === 'admin' && (
      <div className="stats-overview glass-card">
        <h2>Statistiques de la plateforme</h2>

        {loading ? (
          <p>Chargement des statistiques...</p>
        ) : (
          <div className="stats-grid">
            <div className="stat-item">
              <FaCar className="stat-icon" />
              <div className="stat-content">
                <span className="label">Voitures</span>
                <span className="value">{stats.totalVoitures.toLocaleString('fr-TN')}</span>
              </div>
            </div>

            <div className="stat-item">
              <FaMotorcycle className="stat-icon" />
              <div className="stat-content">
                <span className="label">Motos</span>
                <span className="value">{stats.totalMotos.toLocaleString('fr-TN')}</span>
              </div>
            </div>

            <div className="stat-item total">
              <div className="stat-content">
                <span className="label">Total véhicules</span>
                <span className="value big">{stats.totalVehicules.toLocaleString('fr-TN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Le reste de ton dashboard : mes annonces, mes favoris, etc. */}
    </div>
  );
}