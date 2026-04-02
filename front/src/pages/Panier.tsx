// src/pages/Panier.tsx
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { FaTrash, FaShoppingCart, FaCar, FaMotorcycle, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../components/Vehicule/VehiculeList.css';

interface PanierItem {
  _id: string;
  vehiculeId: string;
  typeVehicule: 'voiture' | 'moto';
  marque: string;
  modele: string;
  annee: number;
  prix: number;
  imageUrl: string;
  agenceNom: string;
  etat: 'neuf' | 'occasion';
  addedAt: string;
}

export default function Panier() {
  const [items, setItems] = useState<PanierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getImageUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const fetchPanier = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/vehicules/panier');
      if (res.data.success) {
        setItems(res.data.items || []);
        // Mettre à jour le compteur dans le header
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        setError('Impossible de charger le panier');
      }
    } catch (err: any) {
      console.error('Erreur panier:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement du panier');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRemoveItem = async (itemId: string, vehiculeNom: string) => {
    if (!confirm(`Retirer ${vehiculeNom} du panier ?`)) return;
    
    try {
      const res = await api.delete(`/vehicules/panier/${itemId}`);
      if (res.data.success) {
        setItems(prevItems => prevItems.filter(item => item._id !== itemId));
        // Mettre à jour le compteur dans le header
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleClearPanier = async () => {
    if (!confirm('Vider complètement le panier ?')) return;
    
    try {
      const res = await api.delete('/vehicules/panier/clear');
      if (res.data.success) {
        setItems([]);
        // Mettre à jour le compteur dans le header
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        alert('Erreur lors du vidage du panier');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors du vidage du panier');
    }
  };

  const totalPrix = items.reduce((sum, item) => sum + (item.prix || 0), 0);

  useEffect(() => {
    fetchPanier();
  }, [fetchPanier]);

  if (loading) {
    return (
      <div className="vehicule-list-container" style={{ margin: '2rem auto', maxWidth: '1200px' }}>
        <div className="loading">
          <div className="spin">⏳</div>
          Chargement de votre panier...
        </div>
      </div>
    );
  }

  return (
    <div className="vehicule-list-container" style={{ margin: '2rem auto', maxWidth: '1200px' }}>
      <div className="list-header">
        <h2>
          <FaShoppingCart style={{ marginRight: '12px', color: '#646cff' }} />
          Mon Panier
          {items.length > 0 && <span className="badge" style={{ marginLeft: '1rem', background: '#646cff' }}>{items.length} article(s)</span>}
        </h2>
        <Link to="/vehicules-neufs" className="btn-add-inline" style={{ textDecoration: 'none' }}>
          <FaArrowLeft /> Continuer mes achats
        </Link>
      </div>

      {error ? (
        <div className="error" style={{ textAlign: 'center', padding: '2rem' }}>
          ❌ {error}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <FaShoppingCart style={{ fontSize: '4rem', opacity: 0.5, marginBottom: '1rem' }} />
          <h3>Votre panier est vide</h3>
          <p>Ajoutez des véhicules depuis nos annonces</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <Link to="/vehicules-neufs" className="btn-add-inline" style={{ textDecoration: 'none' }}>
              Voir les véhicules neufs
            </Link>
            <Link to="/vehicules-occasions" className="btn-add-inline" style={{ textDecoration: 'none', background: '#fbbf24' }}>
              Voir les occasions
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="panier-list">
            {items.map((item) => (
              <div key={item._id} className="panier-item" style={{
                display: 'flex',
                gap: '1.5rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                marginBottom: '1rem',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div className="panier-item-image" style={{ width: '120px', height: '90px', flexShrink: 0 }}>
                  {item.imageUrl ? (
                    <img 
                      src={getImageUrl(item.imageUrl)} 
                      alt={`${item.marque} ${item.modele}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#222', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.typeVehicule === 'voiture' ? <FaCar size={30} /> : <FaMotorcycle size={30} />}
                    </div>
                  )}
                </div>
                
                <div className="panier-item-details" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.3rem 0' }}>
                        {item.marque} {item.modele}
                        <span className={item.etat === 'neuf' ? 'neuf-badge' : 'occasion-badge'} style={{ position: 'static', marginLeft: '0.8rem', fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>
                          {item.etat === 'neuf' ? 'NEUF' : 'OCCASION'}
                        </span>
                      </h3>
                      <p style={{ margin: '0', fontSize: '0.85rem', color: '#aaa' }}>
                        Année: {item.annee} | Agence: {item.agenceNom || '—'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: '#34d399' }}>
                        {item.prix ? `${item.prix.toLocaleString('fr-TN')} TND` : 'Sur demande'}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item._id, `${item.marque} ${item.modele}`)}
                        style={{
                          background: 'rgba(239,68,68,0.15)',
                          border: 'none',
                          color: '#ef4444',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <FaTrash /> Retirer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="panier-summary" style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(100,108,255,0.1), rgba(138,43,226,0.1))',
            borderRadius: '16px',
            border: '1px solid rgba(100,108,255,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Total</h3>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#34d399' }}>
                  {totalPrix.toLocaleString('fr-TN')} TND
                </p>
                <p style={{ fontSize: '0.8rem', color: '#aaa', margin: '0.3rem 0 0 0' }}>
                  {items.length} véhicule(s) sélectionné(s)
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleClearPanier}
                  style={{
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#ef4444',
                    padding: '0.8rem 1.5rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Vider le panier
                </button>
                <button
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    color: 'white',
                    padding: '0.8rem 2rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Passer la commande →
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}