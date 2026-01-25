import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

// ────────────────────────────────────────────────
// Interface pour l'utilisateur connecté
// ────────────────────────────────────────────────
interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'user' | 'agent' | 'admin';
}

// ────────────────────────────────────────────────
// Données attendues pour l'inscription (maintenant avec role)
// ────────────────────────────────────────────────
export interface RegisterData {
  nom: string;
  prenom: string;
  dateNaissance: string;
  telephone: string;
  email: string;
  mdp: string;
  role: 'user' | 'agent' | 'admin';     // ← ajouté et rendu obligatoire
}

// ────────────────────────────────────────────────
// Type du contexte d'authentification
// ────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Chargement automatique de l'utilisateur au montage (si token présent)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Configuration du token pour toutes les requêtes futures
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const res = await api.get('/users/me');
        setUser(res.data.user);
        setToken(token);
      } catch (err) {
        console.error('Erreur lors du chargement utilisateur :', err);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ─── Connexion ───
  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/users/signin', { email, mdp: password });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Erreur de connexion');
    }
  };

  // ─── Inscription ───
  const registerUser = async (data: RegisterData) => {
    try {
      const res = await api.post('/users/signup', data);
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Erreur lors de l’inscription');
    }
  };

  // ─── Déconnexion ───
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register: registerUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook personnalisé
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};