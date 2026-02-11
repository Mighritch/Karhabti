import { useForm, type SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth, type RegisterData } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const schema = yup.object({
  nom: yup.string().required('Nom requis').max(50, 'Maximum 50 caractères'),
  prenom: yup.string().required('Prénom requis').max(50, 'Maximum 50 caractères'),
  dateNaissance: yup.string().required('Date de naissance requise'),
  telephone: yup
    .string()
    .matches(/^\d{8,}$/, 'Numéro invalide (au moins 8 chiffres)')
    .required('Téléphone requis'),
  email: yup.string().email('Email invalide').required('Email requis'),
  mdp: yup.string().min(6, 'Au moins 6 caractères').required('Mot de passe requis'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('mdp')], 'Les mots de passe ne correspondent pas')
    .required('Confirmation requise'),
  role: yup
    .string()
    .oneOf(['user', 'agent', 'admin'], 'Rôle invalide')
    .required('Veuillez choisir un rôle'),
}).required();

type FormInputs = yup.InferType<typeof schema>;

export default function Register() {
  const { register: registerInContext } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInputs>({
    resolver: yupResolver(schema),
    defaultValues: { role: 'user' },
  });

  const onSubmit: SubmitHandler<FormInputs> = async (formData) => {
    try {
      setServerError(null);
      const { confirmPassword: _confirmPassword, ...data } = formData;
      await registerInContext(data as RegisterData);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setServerError(error.response?.data?.message || "Erreur lors de l'inscription");
    }
  };

  return (
    <>
      <h2>Inscription</h2>

      {serverError && <div className="error-message">{serverError}</div>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="nom">Nom</label>
          <input id="nom" placeholder="Votre nom" {...registerField('nom')} />
          {errors.nom && <span className="error">{errors.nom.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="prenom">Prénom</label>
          <input id="prenom" placeholder="Votre prénom" {...registerField('prenom')} />
          {errors.prenom && <span className="error">{errors.prenom.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="dateNaissance">Date de naissance</label>
          <input type="date" id="dateNaissance" {...registerField('dateNaissance')} />
          {errors.dateNaissance && <span className="error">{errors.dateNaissance.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="telephone">Téléphone</label>
          <input
            id="telephone"
            placeholder="Ex: 55123456"
            {...registerField('telephone')}
          />
          {errors.telephone && <span className="error">{errors.telephone.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="exemple@domaine.com"
            {...registerField('email')}
          />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </div>

        <div className="form-group password-group">
          <label htmlFor="mdp">Mot de passe</label>
          <div className="password-wrapper">
            <input
              id="mdp"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 6 caractères"
              {...registerField('mdp')}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer mot de passe' : 'Afficher mot de passe'}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.mdp && <span className="error">{errors.mdp.message}</span>}
        </div>

        <div className="form-group password-group">
          <label htmlFor="confirmPassword">Confirmation</label>
          <div className="password-wrapper">
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirmez le mot de passe"
              {...registerField('confirmPassword')}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? 'Masquer confirmation' : 'Afficher confirmation'}
            >
              {showConfirm ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.confirmPassword && <span className="error">{errors.confirmPassword.message}</span>}
        </div>

        <div className="form-group">
          <label>Je m'inscris en tant que</label>
          <div className="choice-group">
            <div className="choice-item">
              <input
                type="radio"
                id="role-user"
                value="user"
                {...registerField('role')}
              />
              <label htmlFor="role-user" className="choice-label">Utilisateur</label>
            </div>
            <div className="choice-item">
              <input
                type="radio"
                id="role-agent"
                value="agent"
                {...registerField('role')}
              />
              <label htmlFor="role-agent" className="choice-label">Agent</label>
            </div>
            
          </div>
          {errors.role && <span className="error">{errors.role.message}</span>}
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Inscription...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="auth-link">
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </>
  );
}