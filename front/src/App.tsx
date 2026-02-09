// src/App.tsx (modified)
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Header from './components/Header';
import Profile from './components/Profile/Profile';
import Agences from './components/Agence/Agences';
import MesAgences from './components/Agence/MesAgences';
import AdminAgences from './components/Admin/AdminAgence';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import SearchResults from './components/SearchResults'; // New import
import { Toaster } from 'react-hot-toast';
import { useState } from 'react'; // For search state
import { useNavigate } from 'react-router-dom'; // For navigation
import { useAuth } from './context/AuthContext'; // Auth context to check role

import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_relativeSplatPath: true,
        }}
      >
        <div className="app-layout">
          <Header />

          <main className="main-content">
            <Routes>
              {/* Pages d'authentification centrées */}
              <Route path="/login" element={<CenteredAuth><Login /></CenteredAuth>} />
              <Route path="/register" element={<CenteredAuth><Register /></CenteredAuth>} />
              <Route path="/forgot-password" element={<CenteredAuth><ForgotPassword /></CenteredAuth>} />
              <Route path="/reset-password/:token" element={<CenteredAuth><ResetPassword /></CenteredAuth>} />

              {/* Routes protégées */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin/agences" element={<AdminAgences />} />
              </Route>

              {/* Routes publiques */}
              <Route path="/" element={<HomeHero />} />
              <Route path="/agences" element={<Agences />} />
              <Route path="/mes-agences" element={<MesAgences />} />
              <Route path="/search" element={<SearchResults />} /> {/* New route */}

              <Route path="/vehicules-neufs"     element={<div className="placeholder-page">Véhicules Neufs – Page en construction</div>} />
              <Route path="/vehicules-occasion"  element={<div className="placeholder-page">Véhicules d'Occasion – Page en construction</div>} />
              <Route path="/vehicules-location"  element={<div className="placeholder-page">Véhicules en Location – Page en construction</div>} />

              {/* 404 */}
              <Route path="*" element={<div className="not-found">404 — Page non trouvée</div>} />
            </Routes>
          </main>
        </div>

        <Toaster
          position="top-center"
          toastOptions={{ duration: 4000 }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

function CenteredAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page-wrapper">
      <div className="auth-card glass-card">
        {children}
      </div>
    </div>
  );
}

// ─── Hero Section d'accueil avec titre accrocheur ────────────────────────────
function HomeHero() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">
          Louez et achetez la voiture de vos rêves <span className="highlight">en quelques clics</span>
        </h1>
        
        <p className="hero-subtitle">
          Des centaines de véhicules partout en Tunisie — particuliers & agences<br />
          Réservation simple, prix transparents, assurance incluse.
        </p>

        {/* New search bar */}
        <form onSubmit={handleSearch} className="search-bar-container" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
          <input
            type="text"
            placeholder="Rechercher par marque, modèle, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{ marginBottom: '1rem' }}
          />
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Rechercher
          </button>
        </form>

        {(!user || user.role !== 'user') && (
          <div className="hero-cta">
            <a href="/agences" className="btn-primary">
              Voir toutes les agences
            </a>
            <a href="/register" className="btn-secondary">
              Créer mon compte gratuit
            </a>
          </div>
        )}

        <div className="hero-trust">
          <div className="trust-item">✓ +500 véhicules disponibles</div>
          <div className="trust-item">✓ Paiement 100% sécurisé</div>
          <div className="trust-item">✓ Annulation gratuite 24h avant</div>
        </div>
      </div>
    </div>
  );
}

export default App;