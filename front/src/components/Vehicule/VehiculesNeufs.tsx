import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FaCar, FaMotorcycle, FaSpinner } from 'react-icons/fa';
import './VehiculeList.css'; // réutilisation des styles

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
  agence: {
    nom: string;
    // typeActivite?: string;   // optionnel à afficher
  };
}

export default function VehiculesNeufs() {
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
    const fetchNeufsAVendre = async () => {
      try {
        setLoading(true);
        const res = await api.get('/vehicules/neufs-a-vendre');
        if (res.data.success) {
          // Fusion voitures + motos
          const all = [...res.data.voitures, ...res.data.motos];
          setVehicules(all);
        }
      } catch (err: unknown) {
        let message = 'Erreur lors du chargement des véhicules neufs';
        if (typeof err === 'object' && err !== null) {
          const e = err as { response?: { data?: { message?: string } } };
          if (e.response?.data?.message) message = e.response.data.message;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchNeufsAVendre();
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
    <div className="vehicule-list-container" style={{ margin: '2rem auto', maxWidth: '1200px' }}>
      <div className="list-header">
        <h2>
          <FaCar style={{ marginRight: '12px' }} />
          Véhicules Neufs à Vendre
        </h2>
      </div>

      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Rechercher marque, modèle, type..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">
          <FaSpinner className="spin" /> Chargement des véhicules neufs...
        </div>
      ) : error ? (
        <div className="error-message" style={{ textAlign: 'center', color: '#ff6b6b' }}>
          {error}
        </div>
      ) : filteredVehicules.length === 0 ? (
        <div className="empty-state">
          <p>Aucun véhicule neuf en vente disponible actuellement.</p>
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
              </div>

              <div className="vehicule-info">
                <h3>{v.marque} {v.modele}</h3>

                <p className="v-meta">
                  <span>Année : <strong>{v.annee}</strong></span>
                  <span>Immat : <strong>{v.immatriculation || '—'}</strong></span>
                </p>

                <p className="v-meta">
                  <span>KM : <strong>{v.kilometrage ? v.kilometrage.toLocaleString('fr-TN') : '—'}</strong></span>
                  <span>Type : <strong>{v.categorie || v.typeMoto || '—'}</strong></span>
                </p>

                <p className="v-meta price-line">
                  <span>Prix : <strong>{v.prix ? v.prix.toLocaleString('fr-TN') + ' TND' : '—'}</strong></span>
                </p>

                <p className="v-meta" style={{ fontSize: '0.95rem', marginTop: '8px' }}>
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