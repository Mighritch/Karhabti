// src/components/SearchResults.tsx (new file)
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { FaCar, FaMotorcycle } from 'react-icons/fa';
import './Vehicule/VehiculeList.css'; // Reuse styles from VehiculeList

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
  type: 'voiture' | 'moto';
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        setLoading(true);
        const res = await api.get('/vehicules/search', { params: { query } });
        if (res.data.success) {
          // Combine voitures and motos with type
          const voitures = res.data.voitures.map((v: Vehicule) => ({ ...v, type: 'voiture' }));
          const motos = res.data.motos.map((m: Vehicule) => ({ ...m, type: 'moto' }));
          setVehicules([...voitures, ...motos]);
        }
      } catch (err: unknown) {
        setError((err as Error).message || 'Erreur lors de la recherche');
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchSearchResults();
    } else {
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="vehicule-list-container" style={{ margin: '2rem auto' }}>
      <h2>Résultats de recherche pour "{query}"</h2>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : vehicules.length === 0 ? (
        <div className="empty-state">Aucun véhicule trouvé.</div>
      ) : (
        <div className="vehicule-grid">
          {vehicules.map((v) => (
            <div key={v._id} className="vehicule-card">
              <div className="vehicule-image">
                {v.images && v.images.length > 0 ? (
                  <img src={getImageUrl(v.images[0].url)} alt={`${v.marque} ${v.modele}`} />
                ) : (
                  <div className="no-image">Pas d'image</div>
                )}
              </div>

              <div className="vehicule-info">
                <h3>
                  {v.marque} {v.modele} {v.type === 'voiture' ? <FaCar /> : <FaMotorcycle />}
                </h3>

                <p className="v-meta">
                  <span>Année: <strong>{v.annee}</strong></span>
                  <span>Immat: <strong>{v.immatriculation || '—'}</strong></span>
                </p>

                <p className="v-meta">
                  <span>KM: <strong>{v.kilometrage?.toLocaleString('fr-TN') || '—'}</strong></span>
                  <span>Type: <strong>{v.categorie || v.typeMoto || '—'}</strong></span>
                </p>

                <p className="v-meta price-line">
                  <span>Prix: <strong>{v.prix?.toLocaleString('fr-TN') ?? '—'} TND</strong></span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}