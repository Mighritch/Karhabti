// src/components/Auth/Login.tsx
import { useForm, type SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';

const schema = yup.object({
  email: yup.string().email('Email invalide').required('Email requis'),
  mdp: yup.string().min(6, 'Au moins 6 caractères').required('Mot de passe requis'),
}).required();

type FormData = yup.InferType<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setServerError(null);
      await login(data.email, data.mdp);           // ← on passe mdp
      navigate('/dashboard');
    } catch (err: any) {
      setServerError(err.message || 'Identifiants incorrects');
    }
  };

  return (
    <>
      <h2>Connexion</h2>

      {serverError && <div className="error-message">{serverError}</div>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="exemple@domaine.com"
            {...register('email')}
          />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </div>

        <div className="form-group password-group">
          <label htmlFor="mdp">Mot de passe</label>
          <div className="password-wrapper">
            <input
              id="mdp"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"           // ← important pour les gestionnaires de mots de passe
              placeholder="••••••••"
              {...register('mdp')}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer' : 'Afficher'}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.mdp && <span className="error">{errors.mdp.message}</span>}

          <div className="forgot-link-container">
            <Link to="/forgot-password">Mot de passe oublié ?</Link>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting}>
          <FiLogIn style={{ marginRight: '0.6rem' }} />
          {isSubmitting ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="auth-link">
        Pas de compte ? <Link to="/register">Créer un compte</Link>
      </p>
    </>
  );
}