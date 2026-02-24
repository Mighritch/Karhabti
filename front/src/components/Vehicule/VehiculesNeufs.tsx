// src/components/VehiculesNeufs.tsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FaCar, FaMotorcycle, FaSpinner, FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './VehiculeList.css'; // réutilisation des styles (y compris les nouveaux pour le modal)

interface Vehicule {
  _id: string;
  marque: string;
  modele: string;
  annee: number;
  immatriculation?: string;
  images: { url: string; nomFichier: string }[];
  kilometrage?: number;
  categorie?: string;           // pour voiture
  typeMoto?: string;            // pour moto
  couleur: string;
  etat: 'neuf' | 'occasion';
  motorisation: string;
  prix?: number;
  createdAt: string;
  agence: { nom: string };

  // Champs voiture
  puissance?: number;
  cylindre?: number;
  boiteVitesse?: string;
  nbrVitesse?: number;
  consommation?: number;
  nbrPortes?: number;
  nbrPlaces?: number;
  airbags?: number;
  abs?: boolean;
  regulateurVitesse?: boolean;
  climatisation?: boolean;
  cameraRecul?: boolean;
  gps?: boolean;
  ecranMultimedia?: boolean;
  typePermis?: string;

  // Champs moto
  typeTransmission?: string;
}

export default function VehiculesNeufs() {
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeVehiculeFilter, setTypeVehiculeFilter] = useState('');
  const [selectedVehicule, setSelectedVehicule] = useState<Vehicule | null>(null);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    const fetchNeufsAVendre = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {};
        if (typeVehiculeFilter) params.typeVehicule = typeVehiculeFilter;

        const res = await api.get('/vehicules/neufs-a-vendre', { params });

        if (res.data.success) {
          const all = [...(res.data.voitures || []), ...(res.data.motos || [])];
          setVehicules(all);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des véhicules neufs');
      } finally {
        setLoading(false);
      }
    };

    fetchNeufsAVendre();
  }, [typeVehiculeFilter]);

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
          <FaCar style={{ marginRight: '12px', color: '#4ade80' }} />
          Véhicules Neufs à Vendre
          <span className="badge neuf">NEUF</span>
        </h2>
      </div>

      {/* FILTRE TYPE VÉHICULE */}
      <div className="filters-section" style={{ marginBottom: '1.5rem' }}>
        <div className="filter-row">
          <div className="filter-group">
            <label>Type de véhicule :</label>
            <select
              value={typeVehiculeFilter}
              onChange={(e) => setTypeVehiculeFilter(e.target.value)}
            >
              <option value="">Tous</option>
              <option value="voiture">Voitures</option>
              <option value="moto">Motos</option>
            </select>
          </div>
        </div>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div className="search-bar-container" style={{ marginBottom: '1rem' }}>
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
          <FaSpinner className="spin" /> Chargement des véhicules neufs...
        </div>
      ) : error ? (
        <div className="error-message" style={{ textAlign: 'center', color: '#ff6b6b', padding: '2rem' }}>
          {error}
        </div>
      ) : filteredVehicules.length === 0 ? (
        <div className="empty-state">
          <p>Aucun véhicule neuf correspondant à votre recherche pour le moment.</p>
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
                <div className="neuf-badge">NEUF</div>
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

                {/* BOUTON AJOUTÉ : Voir les caractéristiques */}
                <button
                  className="btn-view-details"
                  onClick={() => setSelectedVehicule(v)}
                >
                  <FaSearch /> Voir toutes les caractéristiques
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== MODAL DÉTAILS ==================== */}
      {selectedVehicule && (
        <div className="detail-modal" onClick={(e) => { if (e.target === e.currentTarget) setSelectedVehicule(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedVehicule(null)}>×</button>

            <h2>
              {selectedVehicule.marque} {selectedVehicule.modele}
              <span style={{ fontSize: '0.75em', opacity: 0.7 }}> - {selectedVehicule.annee}</span>
            </h2>

            {selectedVehicule.etat === 'neuf' ? (
              <div className="neuf-badge" style={{ position: 'static', display: 'inline-block', margin: '0.5rem 0' }}>
                NEUF
              </div>
            ) : (
              <div className="occasion-badge" style={{ position: 'static', display: 'inline-block', margin: '0.5rem 0' }}>
                OCCASION
              </div>
            )}

            <div className="modal-image">
              {selectedVehicule.images?.[0] && (
                <img
                  src={getImageUrl(selectedVehicule.images[0].url)}
                  alt={`${selectedVehicule.marque} ${selectedVehicule.modele}`}
                />
              )}
            </div>

            {selectedVehicule.images.length > 1 && (
              <div className="image-gallery">
                {selectedVehicule.images.slice(1).map((img, i) => (
                  <img key={i} src={getImageUrl(img.url)} alt={`Photo ${i + 2}`} />
                ))}
              </div>
            )}

            <div className="details-grid">
              <div className="detail-item"><strong>Agence</strong><span>{selectedVehicule.agence?.nom || '—'}</span></div>
              <div className="detail-item"><strong>Prix</strong><span>{selectedVehicule.prix ? `${selectedVehicule.prix.toLocaleString('fr-TN')} TND` : 'Sur demande'}</span></div>
              <div className="detail-item"><strong>Couleur</strong><span>{selectedVehicule.couleur}</span></div>
              <div className="detail-item"><strong>Motorisation</strong><span>{selectedVehicule.motorisation}</span></div>

              {selectedVehicule.kilometrage !== undefined && (
                <div className="detail-item"><strong>Kilométrage</strong><span>{selectedVehicule.kilometrage.toLocaleString('fr-TN')} km</span></div>
              )}
              {selectedVehicule.immatriculation && (
                <div className="detail-item"><strong>Immatriculation</strong><span>{selectedVehicule.immatriculation}</span></div>
              )}
              {(selectedVehicule.categorie || selectedVehicule.typeMoto) && (
                <div className="detail-item"><strong>Type</strong><span>{selectedVehicule.categorie || selectedVehicule.typeMoto}</span></div>
              )}

              {selectedVehicule.cylindre !== undefined && (
                <div className="detail-item"><strong>Cylindrée</strong><span>{selectedVehicule.cylindre} cm³</span></div>
              )}
              {selectedVehicule.boiteVitesse && (
                <div className="detail-item"><strong>Boîte de vitesse</strong><span>{selectedVehicule.boiteVitesse}</span></div>
              )}
              {selectedVehicule.typePermis && (
                <div className="detail-item"><strong>Permis requis</strong><span>{selectedVehicule.typePermis}</span></div>
              )}

              {/* Champs spécifiques VOITURE */}
              {selectedVehicule.categorie && (
                <>
                  {selectedVehicule.puissance && <div className="detail-item"><strong>Puissance</strong><span>{selectedVehicule.puissance} ch</span></div>}
                  {selectedVehicule.consommation && <div className="detail-item"><strong>Consommation</strong><span>{selectedVehicule.consommation} L/100km</span></div>}
                  {selectedVehicule.nbrPortes && <div className="detail-item"><strong>Portes</strong><span>{selectedVehicule.nbrPortes}</span></div>}
                  {selectedVehicule.nbrPlaces && <div className="detail-item"><strong>Places</strong><span>{selectedVehicule.nbrPlaces}</span></div>}
                  {selectedVehicule.airbags !== undefined && <div className="detail-item"><strong>Airbags</strong><span>{selectedVehicule.airbags}</span></div>}
                  {selectedVehicule.abs !== undefined && <div className="detail-item"><strong>ABS</strong><span>{selectedVehicule.abs ? 'Oui' : 'Non'}</span></div>}
                  {selectedVehicule.regulateurVitesse !== undefined && <div className="detail-item"><strong>Régulateur de vitesse</strong><span>{selectedVehicule.regulateurVitesse ? 'Oui' : 'Non'}</span></div>}
                  {selectedVehicule.climatisation !== undefined && <div className="detail-item"><strong>Climatisation</strong><span>{selectedVehicule.climatisation ? 'Oui' : 'Non'}</span></div>}
                  {selectedVehicule.cameraRecul !== undefined && <div className="detail-item"><strong>Caméra de recul</strong><span>{selectedVehicule.cameraRecul ? 'Oui' : 'Non'}</span></div>}
                  {selectedVehicule.gps !== undefined && <div className="detail-item"><strong>GPS</strong><span>{selectedVehicule.gps ? 'Oui' : 'Non'}</span></div>}
                  {selectedVehicule.ecranMultimedia !== undefined && <div className="detail-item"><strong>Écran multimédia</strong><span>{selectedVehicule.ecranMultimedia ? 'Oui' : 'Non'}</span></div>}
                  {selectedVehicule.nbrVitesse && <div className="detail-item"><strong>Nombre de vitesses</strong><span>{selectedVehicule.nbrVitesse}</span></div>}
                </>
              )}

              {/* Champ spécifique MOTO */}
              {!selectedVehicule.categorie && selectedVehicule.typeMoto && selectedVehicule.typeTransmission && (
                <div className="detail-item"><strong>Transmission</strong><span>{selectedVehicule.typeTransmission}</span></div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <button onClick={() => setSelectedVehicule(null)} className="btn-secondary">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}