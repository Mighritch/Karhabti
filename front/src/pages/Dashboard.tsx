import { useState, useEffect } from 'react';
import { FaCar, FaMotorcycle, FaPlus, FaBell } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AgenceForm from '../components/Agence/AgenceForm';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';

let socket: Socket | null = null;

interface Notification {
  type: string;
  commandeId: string;
  numeroCommande: string;
  total: number;
  client: {
    nom: string;
    telephone: string;
    email?: string;
  };
  items: Array<{
    marque: string;
    modele: string;
    prix: number;
    etat: string;
  }>;
  date: string;
  message?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVoitures: 0,
    totalMotos: 0,
    totalVehicules: 0
  });

  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?._id || user.role !== 'agent') return;

    socket = io('http://localhost:5000');

    socket.on('connect', () => {
      socket?.emit('join', user._id);
    });

    socket.on('notification', (notif: Notification) => {
      if (notif.type === 'nouvelle_commande') {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);

        toast.success(`🛎️ Nouvelle commande reçue ! #${notif.numeroCommande}`, {
          duration: 8000,
          position: 'top-right',
        });
      }
    });

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [user]);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const res = await api.get('/vehicules/stats');
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') fetchGlobalStats();
    else setLoading(false);
  }, [user]);

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
    if (!showNotifications) {
      setUnreadCount(0);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreate(false);
    toast.success('Agence créée avec succès');
    navigate('/mes-agences');
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Tableau de bord</h1>
        <p>Bienvenue, {user?.prenom || user?.nom || 'Utilisateur'}</p>

        {user?.role === 'agent' && (
          <div
            className={`notification-bell ${showNotifications ? 'active' : ''}`}
            onClick={toggleNotifications}
          >
            <FaBell size={24} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>
        )}
      </div>

      {user?.role === 'agent' && showNotifications && (
        <div className="notifications-panel glass-card">
          <h3>
            <FaBell /> Dernières commandes ({notifications.length})
          </h3>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p className="no-notif">Aucune notification pour le moment.</p>
            ) : (
              notifications.slice(0, 5).map((notif, index) => (
                <div key={index} className="notification-item">
                  <div className="notif-header">
                    <strong>Commande #{notif.numeroCommande}</strong>
                    <span className="notif-date">
                      {new Date(notif.date).toLocaleTimeString('fr-TN')}
                    </span>
                  </div>

                  <p>
                    Client : <strong>{notif.client.nom}</strong> • {notif.client.telephone}
                  </p>

                  <p>
                    {notif.items.length} véhicule(s) • Total{' '}
                    <strong>{notif.total.toLocaleString('fr-TN')} TND</strong>
                  </p>

                  <button
                    className="btn-small"
                    onClick={() => navigate('/mes-commandes')}
                  >
                    Voir les détails
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {user?.role === 'agent' && (
        <div className="dashboard-actions">
          <button className="btn-create" onClick={() => setShowCreate(true)}>
            <FaPlus /> Ajouter une agence
          </button>

          <button
            className="btn-secondary"
            onClick={() => navigate('/mes-commandes')}
          >
            <FaBell /> Voir mes commandes
          </button>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AgenceForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="stats-overview glass-card">
          <h2>Statistiques Globales</h2>

          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="stats-grid">
              <div className="stat-item">
                <FaCar className="stat-icon" />
                <span>{stats.totalVoitures.toLocaleString('fr-TN')} Voitures</span>
              </div>

              <div className="stat-item">
                <FaMotorcycle className="stat-icon" />
                <span>{stats.totalMotos.toLocaleString('fr-TN')} Motos</span>
              </div>

              <div className="stat-item total">
                <span>
                  {stats.totalVehicules.toLocaleString('fr-TN')} Véhicules
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {user?.role === 'agent' && (
        <div className="agent-section">
          <h2>Mes Annonces & Commandes</h2>
          <p>Tu pourras bientôt voir tes véhicules ici.</p>
        </div>
      )}
    </div>
  );
}