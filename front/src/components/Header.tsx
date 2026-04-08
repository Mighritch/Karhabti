import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut, FiUser, FiSettings, FiStar, FiMenu, FiX, FiShoppingCart, FiBell } from 'react-icons/fi';
import { FaBuilding, FaCar, FaClock } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import './Header.css';

let socket: Socket | null = null;

interface Notification {
  type: string;
  numeroCommande: string;
  total?: number;
  client?: { nom: string };
  date: string;
}

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?._id || user.role !== 'agent') return;

    socket = io('http://localhost:5000');

    socket.on('connect', () => {
      socket?.emit('join', user._id);
    });

    socket.on('notification', (notif: Notification) => {
      if (notif.type === 'nouvelle_commande') {
        setNotifications(prev => [{ ...notif, date: new Date().toISOString() }, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        toast.success(`🛎️ Nouvelle commande : #${notif.numeroCommande}`, {
          position: 'top-right',
        });
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      socket?.disconnect();
      socket = null;
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setUnreadCount(0);
    }
  };

  const isActive = (path: string) =>
    location.pathname.startsWith(path) ? 'active' : '';

  const isAgentOrAdmin = user && (user.role === 'agent' || user.role === 'admin');
  const showPublicLinks = !user || !isAgentOrAdmin;

  return (
    <header className="main-header">
      <div className="header-container">
        <Link to="/" className="logo" onClick={closeMenu}>
          <FaBuilding className="logo-icon"
            style={{
              marginRight: '0.8rem',
              color: '#646cff',
              fontSize: '1.8rem',
              filter: 'drop-shadow(0 0 8px rgba(100, 108, 255, 0.5))',
            }}
          />
          <h1>Karhabti</h1>
          <span className="premium-badge">Premium</span>
        </Link>

        <button
          className="menu-toggle"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {isMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
        </button>

        <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
          {showPublicLinks && (
            <div className="main-nav-links">
              <Link
                to="/agences"
                className={`nav-link ${isActive('/agences')}`}
                onClick={closeMenu}
              >
                <FaBuilding className="nav-icon" />
                <span>Agences</span>
              </Link>

              <Link
                to="/vehicules-neufs"
                className={`nav-link ${isActive('/vehicules-neufs')}`}
                onClick={closeMenu}
              >
                <FaCar className="nav-icon" />
                <span>Véhicules Neufs</span>
              </Link>

              <Link
                to="/vehicules-occasions"
                className={`nav-link ${isActive('/vehicules-occasions')}`}
                onClick={closeMenu}
              >
                <FaCar className="nav-icon" />
                <span>Véhicules Occasions</span>
              </Link>
            </div>
          )}

          <div className="actions-section">
            {user?.role === 'agent' && (
              <div className="notification-container" ref={dropdownRef}>
                <div 
                  className={`notification-wrapper ${unreadCount > 0 ? 'has-unread' : ''}`}
                  onClick={toggleNotifications}
                  title="Notifications"
                >
                  <FiBell size={24} className="bell-icon" />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </div>

                {showNotifications && (
                  <div className="header-notifications-dropdown">
                    <div className="dropdown-header">
                      <span>Notifications</span>
                      {notifications.length > 0 && (
                        <button onClick={() => setNotifications([])}>Effacer</button>
                      )}
                    </div>
                    <div className="dropdown-list">
                      {notifications.length === 0 ? (
                        <div className="empty-notif">Aucune nouvelle commande</div>
                      ) : (
                        notifications.map((n, i) => (
                          <div 
                            key={i} 
                            className="notif-item"
                            onClick={() => {
                              navigate('/mes-commandes');
                              setShowNotifications(false);
                              closeMenu();
                            }}
                          >
                            <div className="notif-icon"><FiShoppingCart /></div>
                            <div className="notif-content">
                              <p>Commande <strong>#{n.numeroCommande}</strong></p>
                              <small>{n.client?.nom} • {n.total} TND</small>
                              <span className="notif-time">
                                <FaClock /> {new Date(n.date).toLocaleTimeString('fr-TN')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <Link to="/mes-commandes" className="view-all" onClick={() => { setShowNotifications(false); closeMenu(); }}>
                      Voir toutes les commandes
                    </Link>
                  </div>
                )}
              </div>
            )}

            <Link
              to="/panier"
              className={`cart-link ${isActive('/panier')}`}
              onClick={closeMenu}
              title="Mon Panier"
            >
              <div className="cart-icon-wrapper">
                <FiShoppingCart size={24} />
              </div>
            </Link>

            {user && Object.keys(user).length > 0 ? (
              <div className="user-section">
                <div className="user-name" onClick={closeMenu}>
                  <FiUser className="user-icon" />
                  <span className="name-text">
                    {user.prenom || 'Utilisateur'} {user.nom || ''}
                  </span>
                  {user.isPremium && <FiStar className="premium-star" />}
                </div>

                {user.role === 'agent' && (
                  <Link
                    to="/mes-agences"
                    className={`nav-link agence-link ${isActive('/mes-agences')}`}
                    onClick={closeMenu}
                  >
                    <FaBuilding className="nav-icon" />
                    <span>Mes Agences</span>
                  </Link>
                )}

                {user.role === 'admin' && (
                  <Link
                    to="/admin/agences"
                    className={`nav-link admin-agences-link ${isActive('/admin/agences')}`}
                    onClick={closeMenu}
                  >
                    <FaBuilding className="nav-icon" />
                    <span>Gestion Agences</span>
                  </Link>
                )}

                <Link
                  to="/profile"
                  className={`nav-link profile-link ${isActive('/profile')}`}
                  onClick={closeMenu}
                >
                  <FiSettings className="nav-icon" />
                  <span>Mon Profil</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="logout-btn"
                  aria-label="Se déconnecter"
                >
                  <FiLogOut className="nav-icon" />
                  <span>Déconnexion</span>
                </button>
              </div>
            ) : (
              <div className="auth-links" onClick={closeMenu}>
                <Link
                  to="/login"
                  className={`nav-link login-link ${
                    location.pathname === '/login' ? 'active' : ''
                  }`}
                >
                  <FiUser className="nav-icon" />
                  Connexion
                </Link>

                <Link
                  to="/register"
                  className={`nav-link register-link ${
                    location.pathname === '/register' ? 'active' : ''
                  }`}
                >
                  <FiStar className="nav-icon" />
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}