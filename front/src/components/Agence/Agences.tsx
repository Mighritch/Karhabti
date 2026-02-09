// src/components/Agence/Agences.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaMapMarkerAlt } from 'react-icons/fa';
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
  // On ajoute status pour être plus complet (même si normalement filtré côté backend)
  status?: 'pending' | 'approved' | 'rejected';
}

export default function Agences() {
  const { user, token } = useAuth();

  const [agences, setAgences] = useState<Agence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    console.log('══════ DEBUG - Agences page chargée ══════');
    console.log('Utilisateur connecté ?', !!user);
    console.log('Rôle :', user?.role || 'visiteur');
    console.log('Token présent ?', !!token);

    const fetchAgences = async () => {
      try {
        setError(null);
        console.log('→ Début requête vers /api/agences/public');

        const config = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};

        const response = await axios.get('/api/agences/public', config);

        console.log('→ Réponse reçue - status HTTP :', response.status);
        console.log('Réponse complète :', response.data);

        if (response.data?.success === true) {
          const dataReceived = response.data.data || [];
          console.log('Nombre d’agences reçues :', dataReceived.length);
          console.log('Première agence (si existe) :', dataReceived[0] || 'aucune');

          setAgences(dataReceived);
        } else {
          console.warn('La réponse n’a pas success: true', response.data);
          setError('Format de réponse inattendu');
        }
      } catch (err: any) {
        console.error('!!! ERREUR lors de la récupération des agences !!!');
        console.error('Message :', err.message);

        if (err.response) {
          console.error('Status serveur :', err.response.status);
          console.error('Détail erreur :', err.response.data);
          setError(
            err.response.data?.message ||
              `Erreur ${err.response.status} du serveur`
          );
        } else if (err.request) {
          console.error('Pas de réponse reçue → problème réseau/proxy/CORS');
          setError('Impossible de contacter le serveur');
        } else {
          console.error('Erreur de configuration axios');
          setError('Erreur inattendue');
        }
      } finally {
        console.log('→ Fin chargement');
        setLoading(false);
      }
    };

    fetchAgences();

    // Nettoyage (optionnel)
    return () => {
      console.log('Composant Agences démonté');
    };
  }, [token, user?.role]); // Dépendance sur role pour recharger si connexion change

  const handleAgenceCreated = (newAgence: Agence) => {
    setAgences((prev) => [...prev, newAgence]);
    setShowCreateForm(false);
  };

  // ────────────────────────────────────────────────
  // Rendu
  // ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="loading" style={{ textAlign: 'center', padding: '4rem' }}>
        <div>Chargement des agences...</div>
        <small>(regardez la console développeur)</small>
      </div>
    );
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

      {/* Bloc de debug visible */}
      <div
        style={{
          background: '#1e1e2e',
          color: '#a5d6ff',
          padding: '16px',
          borderRadius: '8px',
          margin: '16px 0',
          fontFamily: 'monospace',
          fontSize: '13px',
          border: '1px solid #444'
        }}
      >
        <strong>Debug info (supprimez ce bloc plus tard) :</strong><br />
        Agences dans le state : {agences.length}<br />
        Erreur : {error || 'aucune'}<br />
        Utilisateur : {user ? `${user.prenom || ''} ${user.nom || ''} (${user.role})` : 'non connecté'}
      </div>

      {error ? (
        <div style={{ color: '#ff6b6b', padding: '1rem', background: 'rgba(255,107,107,0.1)', borderRadius: '8px' }}>
          <strong>Erreur :</strong> {error}
          <br />
          <small>Vérifiez la console pour plus de détails</small>
        </div>
      ) : agences.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>
          Aucune agence trouvée pour le moment.
          <br />
          <small>(Vérifiez que des agences existent avec status: "approved")</small>
        </p>
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

              <div style={{ marginTop: '8px' }}>
                <a
                  className="btn-map"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${agence.adresse}, ${agence.ville}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaMapMarkerAlt /> Voir sur la carte
                </a>
              </div>

              {/* Debug par carte */}
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#888',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              >
                ID: {agence._id.substring(0, 8)}...
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}