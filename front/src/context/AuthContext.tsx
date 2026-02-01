// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  dateNaissance?: string;
  role: 'user' | 'agent' | 'admin';
  isPremium?: boolean;
}

export interface RegisterData {
  nom: string;
  prenom: string;
  dateNaissance: string;
  telephone: string;
  email: string;
  mdp: string;
  role: 'user' | 'agent' | 'admin';
}

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

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          setLoading(false);
          return;
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        const res = await api.get('/users/me');
        setUser(res.data.user);
        setToken(storedToken);
      } catch (err) {
        console.error("Erreur lors du chargement de l'utilisateur :", err);
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

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/users/signin', {
        email,
        mdp: password, // mapping correct
      });

      const { token, user } = res.data;

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
    } catch (err: any) {
      throw new Error(
        err.response?.data?.message ||
        err.message ||
        'Erreur de connexion – vérifiez email/mot de passe'
      );
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await api.post('/users/signup', data);
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
    } catch (err: any) {
      throw new Error(
        err.response?.data?.message ||
        'Erreur lors de l’inscription'
      );
    }
  };

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
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};