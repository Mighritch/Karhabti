// src/components/Agence/MesAgences.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';          // ← utiliser api
import { FaBuilding, FaPlus, FaSpinner } from 'react-icons/fa';
import AgenceForm from './AgenceForm';
import './MesAgences.css';

interface Agence {
  _id: string;
  nom: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  typeAgence: 'vente' | 'location';
  typeVehicule: 'voiture' | 'moto';
  createdAt: string;
}

export default function MesAgences() {
  const { user, token } = useAuth();

  const [agences, setAgences] = useState<Agence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'agent' || !token) {
      setLoading(false);
      return;
    }

    const fetchMyAgences = async () => {
      try {
        setLoading(true);
        const res = await api.get<{ success: boolean; data: Agence[] }>('/agences/me');

        if (res.data?.success) {
          setAgences(res.data.data || []);
        }
      } catch (err: any) {
        console.error('Erreur chargement mes agences:', err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyAgences();
  }, [user, token]);

  if (!user) {
    return (
      <div className="access-denied">
        <h2>Veuillez vous connecter</h2>
        <p>Vous devez être connecté pour accéder à cette page.</p>
      </div>
    );
  }

  if (user.role !== 'agent') {
    return (
      <div className="access-denied">
        <h2>Accès réservé aux agents</h2>
        <p>Cette section est réservée aux utilisateurs avec le rôle "agent".</p>
      </div>
    );
  }

  const handleAgenceCreated = (newAgence: Agence) => {
    setAgences((prev) => [...prev, newAgence]);
    setShowForm(false);
  };

  return (
    <div className="mes-agences-page">
      <div className="page-header">
        <h1><FaBuilding /> Mes Agences</h1>

        {!showForm && (
          <button className="btn-create" onClick={() => setShowForm(true)}>
            <FaPlus /> Ajouter une agence
          </button>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <AgenceForm
            onSuccess={handleAgenceCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="loading">
          <FaSpinner className="spin" /> Chargement...
        </div>
      ) : agences.length === 0 ? (
        <p>Vous n'avez pas encore créé d'agence.</p>
      ) : (
        <div className="agences-grid">
          {agences.map((agence) => (
            <div key={agence._id} className="agence-card">
              <h3>{agence.nom}</h3>
              <p>
                {agence.ville} • {agence.adresse}
              </p>
              <p>{agence.typeAgence === 'vente' ? 'Vente' : 'Location'}</p>
              <p>{agence.typeVehicule === 'voiture' ? 'Voitures' : 'Motos'}</p>
              <small>
                Contact : {agence.telephone} • {agence.email}
              </small>
              <div className="actions">
                <button className="btn-edit" disabled>
                  Modifier (bientôt disponible)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}