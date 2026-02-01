import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';

const schema = yup.object({
  email: yup.string().email('Email invalide').required('L\'email est requis pour identifier votre compte'),
  password: yup.string().min(6, 'Au moins 6 caractères').required('Requis'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas')
    .required('Requis'),
}).required();

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: any) => {
    try {
      // On appelle l'API de réinitialisation directe
      const response = await fetch(`http://localhost:5000/api/users/direct-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password
        }),
      });

      if (response.ok) {
        toast.success('Mot de passe mis à jour avec succès !');
        navigate('/login');
      } else {
        const resData = await response.json();
        toast.error(resData.message || 'Erreur : Utilisateur non trouvé');
      }
    } catch (err) {
      toast.error('Erreur de connexion au serveur');
    }
  };

  return (
    <div className="auth-form">
      <h2>Réinitialiser le mot de passe</h2>
      <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#666' }}>
        Saisissez votre email et votre nouveau mot de passe.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Votre Email</label>
          <input type="email" {...register('email')} placeholder="votre@email.com" />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </div>

        <div className="form-group">
          <label>Nouveau mot de passe</label>
          <input type="password" {...register('password')} />
          {errors.password && <span className="error">{errors.password.message}</span>}
        </div>

        <div className="form-group">
          <label>Confirmer le mot de passe</label>
          <input type="password" {...register('confirmPassword')} />
          {errors.confirmPassword && <span className="error">{errors.confirmPassword.message}</span>}
        </div>

        <button type="submit">Enregistrer les changements</button>
      </form>
    </div>
  );
}