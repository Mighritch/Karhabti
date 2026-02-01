import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const schema = yup.object({
  email: yup.string().email('Email invalide').required('Email requis'),
}).required();

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: { email: string }) => {
    // Au lieu d'envoyer un mail, on redirige vers ResetPassword avec un token factice "direct"
    // ou on pourrait simplement naviguer vers /reset-password/bypass
    toast.success('Redirection vers la réinitialisation...');
    navigate(`/reset-password/direct-access?email=${encodeURIComponent(data.email)}`);
  };

  return (
    <div className="auth-form">
      <h2>Réinitialisation directe</h2>
      <p>Entrez votre email pour changer votre mot de passe immédiatement.</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            {...register('email')} 
            placeholder="votre@email.com" 
          />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </div>
        <button type="submit">Continuer</button>
      </form>
    </div>
  );
}