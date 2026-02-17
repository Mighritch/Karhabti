// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
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

interface AuthResponse {
  success?: boolean;
  token?: string;
  user?: User;
  message?: string;
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
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        const res = await api.get<{ user: User }>('/users/me');
        setUser(res.data.user);
        setToken(storedToken);
      } catch (err) {
        console.error('Erreur chargement utilisateur :', err);
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
      const res = await api.post<AuthResponse>('/users/signin', {
        email: email.trim().toLowerCase(),
        mdp: password,
      });

      const { success, token, user, message } = res.data;

      if (!success || !token || !user) {
        throw new Error(message || 'Réponse invalide du serveur');
      }

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
    } catch (error: unknown) {
      let msg = 'Identifiants incorrects ou serveur indisponible';

      if (error instanceof Error && 'response' in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { message?: string } };
        };
        const { status, data } = axiosError.response || {};

        if (status === 401) {
          msg = data?.message || 'Email ou mot de passe incorrect';
        } else if (status === 400) {
          msg = data?.message || 'Données invalides';
        } else if (status && status >= 500) {
          msg = 'Erreur serveur – réessayez plus tard';
        } else {
          msg = data?.message || error.message;
        }
      }

      throw new Error(msg);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await api.post<{ token: string; user: User }>('/users/signup', {
        ...data,
        email: data.email.trim().toLowerCase(),
      });

      const { token, user } = res.data;

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
    } catch (error: unknown) {
      let msg = 'Erreur lors de l’inscription';

      if (
        error instanceof Error &&
        'response' in error &&
        (error as any).response?.data?.message
      ) {
        msg = (error as any).response.data.message;
      }

      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};