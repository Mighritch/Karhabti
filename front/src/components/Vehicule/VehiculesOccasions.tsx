// src/components/VehiculesOccasions.tsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FaCar, FaSpinner, FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './VehiculeList.css';

interface Vehicule {
  _id: string;
  marque: string;
  modele: string;
  annee: number;
  immatriculation?: string;
  images: { url: string; nomFichier: string }[];
  kilometrage?: number;
  categorie?: string;
  typeMoto?: string;
  couleur: string;
  etat: 'neuf' | 'occasion';
  motorisation: string;
  prix?: number;
  createdAt: string;
  agence: { nom: string };
}

export default function VehiculesOccasions() {
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    const fetchOccasionsAVendre = async () => {
      try {
        setLoading(true);
        const res = await api.get('/vehicules/occasions-a-vendre');
        if (res.data.success) {
          const all = [...(res.data.voitures || []), ...(res.data.motos || [])];
          setVehicules(all);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des véhicules d\'occasion');
      } finally {
        setLoading(false);
      }
    };

    fetchOccasionsAVendre();
  }, []);

  const filteredVehicules = vehicules.filter(v => {
    const term = searchTerm.toLowerCase();
    return (
      v.marque.toLowerCase().includes(term) ||
      v.modele.toLowerCase().includes(term) ||
      (v.categorie || v.typeMoto || '').toLowerCase().includes(term) ||
      (v.immatriculation || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="vehicule-list-container" style={{ margin: '2rem auto', maxWidth: '1300px' }}>
      <div className="list-header">
        <h2>
          <FaCar style={{ marginRight: '12px', color: '#fbbf24' }} />
          Véhicules Occasions à Vendre
          <span className="badge occasion">OCCASION</span>
        </h2>
      </div>

      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Filtrer par marque, modèle, type..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">
          <FaSpinner className="spin" /> Chargement des véhicules d'occasion...
        </div>
      ) : error ? (
        <div className="error-message" style={{ textAlign: 'center', color: '#ff6b6b', padding: '2rem' }}>
          {error}
        </div>
      ) : filteredVehicules.length === 0 ? (
        <div className="empty-state">
          <p>Aucun véhicule d'occasion correspondant à votre recherche pour le moment.</p>
          <Link to="/search" className="btn-create-first" style={{ marginTop: '1.5rem' }}>
            <FaSearch /> Recherche avancée
          </Link>
        </div>
      ) : (
        <div className="vehicule-grid">
          {filteredVehicules.map(v => (
            <div key={v._id} className="vehicule-card">
              <div className="vehicule-image">
                {v.images?.length > 0 ? (
                  <img src={getImageUrl(v.images[0].url)} alt={`${v.marque} ${v.modele}`} />
                ) : (
                  <div className="no-image">Pas d'image</div>
                )}
                <div className="occasion-badge">OCCASION</div>
              </div>

              <div className="vehicule-info">
                <h3>{v.marque} {v.modele}</h3>

                <p className="v-meta">
                  <span>Année : <strong>{v.annee}</strong></span>
                  <span>Immat : <strong>{v.immatriculation || '—'}</strong></span>
                </p>

                <p className="v-meta">
                  <span>KM : <strong>{v.kilometrage ? v.kilometrage.toLocaleString('fr-TN') : '0'}</strong></span>
                  <span>Type : <strong>{v.categorie || v.typeMoto || '—'}</strong></span>
                </p>

                <p className="v-meta price-line">
                  <span>Prix : <strong>{v.prix ? v.prix.toLocaleString('fr-TN') + ' TND' : 'Sur demande'}</strong></span>
                </p>

                <p className="v-meta" style={{ fontSize: '0.95rem', marginTop: '8px', color: '#a5b4fc' }}>
                  Agence : <strong>{v.agence?.nom || '—'}</strong>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}