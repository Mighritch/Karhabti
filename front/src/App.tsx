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
import SearchResults from './components/SearchResults';
import VehiculesNeufs from './components/Vehicule/VehiculesNeufs';
import VehiculesOccasions from './components/Vehicule/VehiculesOccasions';
import Panier from './pages/Panier';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
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
              <Route path="/login" element={<CenteredAuth><Login /></CenteredAuth>} />
              <Route path="/register" element={<CenteredAuth><Register /></CenteredAuth>} />
              <Route path="/forgot-password" element={<CenteredAuth><ForgotPassword /></CenteredAuth>} />
              <Route path="/reset-password/:token" element={<CenteredAuth><ResetPassword /></CenteredAuth>} />

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin/agences" element={<AdminAgences />} />
              </Route>

              <Route path="/" element={<HomeHero />} />
              <Route path="/agences" element={<Agences />} />
              <Route path="/vehicules-neufs" element={<VehiculesNeufs />} />
              <Route path="/vehicules-occasions" element={<VehiculesOccasions />} />
              <Route path="/panier" element={<Panier />} />
              <Route path="/mes-agences" element={<MesAgences />} />
              <Route path="/search" element={<SearchResults />} />
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

function HomeHero() {
  const { user } = useAuth();

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