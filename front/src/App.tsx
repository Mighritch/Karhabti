// App.tsx
// src/App.tsx
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

import { Toaster } from 'react-hot-toast';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Header />

          <main className="main-content">
            <Routes>
              {/* Pages d'authentification centrées */}
              <Route path="/login" element={<CenteredAuth><Login /></CenteredAuth>} />
              <Route path="/register" element={<CenteredAuth><Register /></CenteredAuth>} />

              {/* Routes protégées */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<div className="protected-placeholder">Tableau de bord (protégé)</div>} />
                <Route path="/profile" element={<Profile />} />
                
                {/* Route admin intégrée */}
                <Route path="/admin/agences" element={<AdminAgences />} />
              </Route>

              {/* Routes publiques ou spécifiques aux rôles */}
              <Route path="/" element={<div className="home-placeholder">Page d'accueil publique</div>} />
              
              <Route path="/agences" element={<Agences />} />
              
              <Route path="/mes-agences" element={<MesAgences />} />

              {/* Catch-all */}
              <Route path="*" element={<div className="not-found">404 — Page non trouvée</div>} />
            </Routes>
          </main>
        </div>

        {/* Notification toaster global */}
        <Toaster 
          position="top-center" 
          toastOptions={{ 
            duration: 4000,
            // Vous pouvez ajouter d'autres options si besoin :
            // style: { ... },
            // success: { style: { ... } },
          }} 
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

/**
 * Composant de mise en page pour l'authentification
 */
function CenteredAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page-wrapper">
      <div className="auth-card glass-card">
        {children}
      </div>
    </div>
  );
}

export default App;