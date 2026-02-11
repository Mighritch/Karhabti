// src/components/Auth/ResetPassword.tsx
import { useForm, type SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const schema = yup.object({
  email: yup.string().email('Email invalide').required('Email requis'),
  password: yup.string().min(6, 'Au moins 6 caractères').required('Requis'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas')
    .required('Confirmation requise'),
}).required();

type FormInputs = yup.InferType<typeof schema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const prefilledEmail = searchParams.get('email') || '';

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormInputs>({
    resolver: yupResolver(schema),
    defaultValues: { email: prefilledEmail },
  });

  useEffect(() => {
    if (prefilledEmail) setValue('email', prefilledEmail);
  }, [prefilledEmail, setValue]);

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    try {
      const res = await fetch('http://localhost:5000/api/users/direct-reset', {   // ← bonne URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,           // ← backend attend "password" ici
        }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success('Mot de passe modifié avec succès !');
        navigate('/login');
      } else {
        toast.error(result.message || 'Erreur lors de la réinitialisation');
      }
    } catch (err) {
      toast.error('Erreur réseau ou serveur');
    }
  };

  return (
    <div className="auth-form">
      <h2>Réinitialiser le mot de passe</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            autoComplete="email"
            {...register('email')}
            disabled={!!prefilledEmail}
          />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </div>

        <div className="form-group">
          <label>Nouveau mot de passe</label>
          <input
            type="password"
            autoComplete="new-password"           // ← recommandé pour reset
            {...register('password')}
          />
          {errors.password && <span className="error">{errors.password.message}</span>}
        </div>

        <div className="form-group">
          <label>Confirmation</label>
          <input
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <span className="error">{errors.confirmPassword.message}</span>}
        </div>

        <button type="submit">Enregistrer</button>
      </form>
    </div>
  );
}