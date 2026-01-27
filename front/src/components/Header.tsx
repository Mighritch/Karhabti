import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut, FiUser, FiSettings, FiStar, FiMenu, FiX } from 'react-icons/fi';
import { FaCar, FaBuilding } from 'react-icons/fa';
import { useState } from 'react';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path: string) =>
    location.pathname.startsWith(path) ? 'active' : '';

  return (
    <header className="main-header">
      <div className="header-container">
        <Link to="/" className="logo" onClick={closeMenu}>
          <FaCar
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
          aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {isMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
        </button>

        <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
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
                  to="/mes-agences"
                  className={`nav-link admin-agences-link ${isActive('/mes-agences')}`}
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
                className={`nav-link login-link ${location.pathname === '/login' ? 'active' : ''}`}
              >
                <FiUser className="nav-icon" />
                Connexion
              </Link>

              <Link
                to="/register"
                className={`nav-link register-link ${location.pathname === '/register' ? 'active' : ''}`}
              >
                <FiStar className="nav-icon" />
                S'inscrire
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}