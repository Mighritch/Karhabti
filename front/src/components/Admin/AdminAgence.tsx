import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FaCheck, FaSpinner, FaBuilding } from 'react-icons/fa';
import './AdminAgences.css';

interface Agence {
  _id: string;
  nom: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  typeAgence: string;
  typeVehicule: string;
  status: 'pending' | 'approved' | 'rejected';
  agent: {
    nom: string;
    prenom: string;
    email: string;
  };
  createdAt: string;
}

export default function AdminAgences() {
  const { user } = useAuth();
  const [allAgences, setAllAgences] = useState<Agence[]>([]);
  const [pendingAgences, setPendingAgences] = useState<Agence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [allRes, pendingRes] = await Promise.all([
          api.get('/agences/all'),
          api.get('/agences/pending')
        ]);

        if (allRes.data.success) setAllAgences(allRes.data.data || []);
        if (pendingRes.data.success) setPendingAgences(pendingRes.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Approuver cette agence ?')) return;

    try {
      const res = await api.put(`/agences/${id}/approve`);
      if (res.data.success) {
        // Rafraîchir les listes
        setPendingAgences(prev => prev.filter(a => a._id !== id));
        setAllAgences(prev =>
          prev.map(a => a._id === id ? { ...a, status: 'approved' } : a)
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l’approbation');
    }
  };

  if (user?.role !== 'admin') {
    return <div className="access-denied">Accès réservé aux administrateurs</div>;
  }

  if (loading) return <div className="loading"><FaSpinner className="spin" /> Chargement...</div>;

  return (
    <div className="admin-agences-page">
      <h1>Gestion des Agences</h1>

      {error && <div className="error-message">{error}</div>}

      <section>
        <h2>Agences en attente d'approbation ({pendingAgences.length})</h2>
        {pendingAgences.length === 0 ? (
          <p>Aucune agence en attente.</p>
        ) : (
          <div className="agences-grid">
            {pendingAgences.map(agence => (
              <div key={agence._id} className="agence-card pending">
                <h3>{agence.nom}</h3>
                <p>{agence.ville} • {agence.adresse}</p>
                <p>{agence.typeAgence} - {agence.typeVehicule}</p>
                <p className="agent-info">
                  Agent : {agence.agent?.prenom} {agence.agent?.nom} ({agence.agent?.email})
                </p>
                <div className="actions">
                  <button className="btn-approve" onClick={() => handleApprove(agence._id)}>
                    <FaCheck /> Approuver
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Toutes les agences ({allAgences.length})</h2>
        <div className="agences-grid">
          {allAgences.map(agence => (
            <div key={agence._id} className={`agence-card ${agence.status}`}>
              <h3>{agence.nom}</h3>
              <p>{agence.ville} • {agence.adresse}</p>
              <p>{agence.typeAgence} - {agence.typeVehicule}</p>
              <p>Statut : <strong>{agence.status}</strong></p>
              <small>Agent : {agence.agent?.prenom} {agence.agent?.nom}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}