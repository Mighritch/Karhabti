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
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import Dashboard from  './pages/Dashboard';
import { Toaster } from 'react-hot-toast';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter 
        future={{ 
          v7_relativeSplatPath: true     // ← supprime le warning
          // Tu peux aussi ajouter d'autres flags si tu les utilises :
          // v7_startTransition: true,
          // v7_fetcherPersist: true,
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
                <Route path="/dashboard" element={<div className="protected-placeholder">Tableau de bord (protégé)</div>} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin/agences" element={<AdminAgences />} />
              </Route>

              {/* Routes publiques */}
              <Route path="/" element={<div className="home-placeholder">Page d'accueil publique</div>} />
              <Route path="/agences" element={<Agences />} />
              <Route path="/mes-agences" element={<MesAgences />} />
              // src/App.tsx

<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

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

export default App;