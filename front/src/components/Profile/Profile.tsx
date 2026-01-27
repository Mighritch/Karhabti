import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Profile.css';
import { FaBuilding, FaUser, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agence, setAgence] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAgenceInfo = async () => {
      if (user?.role === 'agent') {
        try {
          setLoading(true);
          const res = await api.get('/agences/my-agence');
          if (res.data?.success && res.data.data.length > 0) {
            setAgence(res.data.data[0]);
          }
        } catch (err) {
          console.error("Erreur chargement infos agence", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAgenceInfo();
  }, [user]);

  if (!user) return null;
  if (loading) return <div className="loading">Chargement...</div>;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non renseignée';
    return dateString.split('T')[0] || dateString;
  };

  return (
    <div className="profile-container" style={{ maxWidth: '800px', margin: '2.5rem auto' }}>
      <button className="btn-back" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#646cff', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>
        <FaArrowLeft /> Retour
      </button>

      <div className="glass-card">
        <h2><FaUser style={{ marginRight: '10px' }} /> Votre Profil</h2>
        <div className="profile-info">
          <p><strong>Nom complet :</strong> {user.prenom} {user.nom}</p>
          <p><strong>Email :</strong> {user.email}</p>
          {user.telephone && <p><strong>Téléphone :</strong> {user.telephone}</p>}
          <p><strong>Date de naissance :</strong> {formatDate(user.dateNaissance)}</p>
          <p><strong>Rôle :</strong> <span className="role-badge">{user.role}</span></p>
        </div>
      </div>

      {user.role === 'agent' && agence && (
        <div className="glass-card" style={{ marginTop: '2rem' }}>
          <h2><FaBuilding style={{ marginRight: '10px' }} /> Votre Agence</h2>
          <div className="profile-info">
            <p><strong>Nom :</strong> {agence.nom}</p>
            <p><strong>Ville :</strong> {agence.ville}</p>
            <p><strong>Adresse :</strong> {agence.adresse}</p>
            <p><strong>Type :</strong> {agence.typeAgence === 'vente' ? 'Vente' : 'Location'}</p>
            <p><strong>Véhicules :</strong> {agence.typeVehicule === 'voiture' ? '🚗 Voitures' : '🏍️ Motos'}</p>
            <p><strong>Status :</strong>
              <span className={`status-badge ${agence.status}`} style={{ marginLeft: '10px' }}>
                {agence.status === 'approved' ? 'Approuvée' : (agence.status === 'pending' ? 'En attente' : 'Rejetée')}
              </span>
            </p>
          </div>
        </div>
      )}

      {user.role === 'admin' && (
        <div className="admin-quick-links" style={{ marginTop: '2rem' }}>
          <p>En tant qu'administrateur, vous pouvez gérer toutes les agences et les utilisateurs depuis le tableau de bord.</p>
        </div>
      )}
    </div>
  );
}
