// src/components/Header.tsx
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="main-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>Karhabti</h1>
        </Link>

        <nav className="header-nav">
          {user ? (
            <div className="user-section">
              <span className="user-name">
                <FiUser /> {user.prenom} {user.nom}
              </span>

              <Link
                to="/profile"
                className={`nav-link profile-link ${
                  location.pathname === '/profile' ? 'active' : ''
                }`}
              >
                <FiSettings style={{ marginRight: '0.4rem' }} />
                Profil
              </Link>

              <button onClick={handleLogout} className="logout-btn">
                <FiLogOut /> Déconnexion
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link
                to="/login"
                className={`nav-link login-link ${
                  location.pathname === '/login' ? 'active' : ''
                }`}
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className={`nav-link register-link ${
                  location.pathname === '/register' ? 'active' : ''
                }`}
              >
                S'inscrire
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}