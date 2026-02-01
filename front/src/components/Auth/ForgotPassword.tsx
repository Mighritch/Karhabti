// ForgotPassword.tsx
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

  const onSubmit = (data: { email: string }) => {
    toast.success('Redirection vers réinitialisation directe...');
    // Option 1 : passage par query string (simple)
    navigate(`/reset-password/direct?email=${encodeURIComponent(data.email)}`);

    // Option 2 : stockage sécurisé en sessionStorage (mieux)
    // sessionStorage.setItem('resetEmail', data.email);
    // navigate('/reset-password/direct');
  };

  return (
    <div className="auth-form">
      <h2>Réinitialisation rapide (dev)</h2>
      <p>Entre ton email pour réinitialiser directement ton mot de passe.</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Email</label>
          <input type="email" {...register('email')} placeholder="votre@email.com" />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </div>
        <button type="submit">Continuer</button>
      </form>
      <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
        En production, un email serait envoyé.
      </p>
    </div>
  );
}