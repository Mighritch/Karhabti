// src/components/Profile/Profile.tsx
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  // Fonction pour extraire uniquement la date (YYYY-MM-DD)
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non renseignée';
    
    // On prend tout ce qui est avant le "T" (ou on garde tel quel si pas de T)
    return dateString.split('T')[0] || dateString;
  };

  return (
    <div className="glass-card" style={{ maxWidth: '620px', margin: '2.5rem auto' }}>
      <h2>Votre Profil</h2>

      <div className="profile-info">
        <p><strong>Nom complet :</strong> {user.prenom} {user.nom}</p>
        <p><strong>Email :</strong> {user.email}</p>
        
        {user.telephone && (
          <p><strong>Téléphone :</strong> {user.telephone}</p>
        )}
        
        <p>
          <strong>Date de naissance :</strong>{' '}
          {formatDate(user.dateNaissance)}
        </p>
        
        <p>
          <strong>Rôle :</strong>{' '}
          <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
        </p>
      </div>

      
    </div>
  );
}