// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { FaCar, FaMotorcycle } from 'react-icons/fa';
import api from '../services/api';
import ProtectedRoute from '../components/ProtectedRoute'; // ou ton HOC de protection

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVoitures: 0,
    totalMotos: 0,
    totalVehicules: 0
  });
  const [loading, setLoading] = useState(true);

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

    fetchGlobalStats();
  }, []);

  return (
    <div className="dashboard-page">
      <h1>Bienvenue sur votre tableau de bord</h1>

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

      {/* Le reste de ton dashboard : mes annonces, mes favoris, etc. */}
    </div>
  );
}