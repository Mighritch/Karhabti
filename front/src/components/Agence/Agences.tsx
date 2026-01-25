// src/components/Agence/Agences.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaPlus } from 'react-icons/fa';
import AgenceForm from './AgenceForm';
import './Agences.css';

interface Agence {
  _id: string;
  nom: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  typeAgence: 'vente' | 'location';
  typeVehicule: 'voiture' | 'moto';
}

export default function Agences() {
  const { user, token } = useAuth();

  const [agences, setAgences] = useState<Agence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Charger toutes les agences (publiques ou avec auth si connecté)
  useEffect(() => {
    const fetchAgences = async () => {
      try {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const res = await axios.get<{ success: boolean; data: Agence[] }>('/api/agences', config);

        if (res.data?.success) {
          setAgences(res.data.data || []);
        }
      } catch (err) {
        console.error('Erreur chargement agences:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgences();
  }, [token]);

  const handleAgenceCreated = (newAgence: Agence) => {
    setAgences(prev => [...prev, newAgence]);
    setShowCreateForm(false);
  };

  if (loading) {
    return <div className="loading">Chargement des agences...</div>;
  }

  const isAgent = user?.role === 'agent';

  return (
    <div className="agences-page">
      <div className="page-header">
        <h1>Nos agences</h1>

        {isAgent && !showCreateForm && (
          <button
            className="btn-create"
            onClick={() => setShowCreateForm(true)}
          >
            <FaPlus /> Ajouter mon agence
          </button>
        )}
      </div>

      {showCreateForm && isAgent && (
        <AgenceForm
          onSuccess={handleAgenceCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {agences.length === 0 ? (
        <p>Aucune agence trouvée pour le moment.</p>
      ) : (
        <div className="agences-grid">
          {agences.map(agence => (
            <div key={agence._id} className="agence-card">
              <h3>{agence.nom}</h3>
              <p>{agence.ville} • {agence.adresse}</p>
              <p>{agence.typeAgence === 'vente' ? 'Vente' : 'Location'}</p>
              <p>{agence.typeVehicule === 'voiture' ? 'Voitures' : 'Motos'}</p>
              <small>Contact : {agence.telephone} • {agence.email}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}