import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './Panier.css';
import { 
  FaTrash, 
  FaShoppingCart, 
  FaCar, 
  FaMotorcycle, 
  FaArrowLeft, 
  FaCreditCard, 
  FaCheck, 
  FaTimes,
  FaUser,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaLock,
  FaExclamationTriangle
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface PanierItem {
  _id: string;
  vehiculeId: string;
  typeVehicule: 'voiture' | 'moto';
  marque: string;
  modele: string;
  annee: number;
  prix?: number;
  imageUrl: string;
  agenceNom: string;
  etat: 'neuf' | 'occasion';
  addedAt: string;
}

interface CommandeFormData {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  codePostal: string;
  methodePaiement: 'espece' | 'virement' | 'carte';
}

interface OrderItem {
  vehiculeId: string;
  typeVehicule: 'voiture' | 'moto';
  marque?: string;
  modele?: string;
  prix?: number;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface Notification {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

// ─── Types pour la confirmation inline ───────────────────────────────────────
type ConfirmAction =
  | { type: 'remove'; itemId: string; vehiculeNom: string }
  | { type: 'orderSingle'; item: PanierItem }
  | { type: 'orderAll' }
  | { type: 'clearPanier' };

// ─── Composant de confirmation inline ────────────────────────────────────────
function InlineConfirm({
  action,
  totalPrix,
  itemsCount,
  onConfirm,
  onCancel,
}: {
  action: ConfirmAction;
  totalPrix: number;
  itemsCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const iconStyle = { fontSize: '2.8rem', marginBottom: '0.8rem' };

  const content = (() => {
    switch (action.type) {
      case 'remove':
        return {
          icon: <FaTrash style={{ ...iconStyle, color: '#ef4444' }} />,
          title: 'Retirer du panier ?',
          desc: (
            <>
              Voulez-vous retirer{' '}
              <strong style={{ color: '#fff' }}>{action.vehiculeNom}</strong>{' '}
              de votre panier ?
            </>
          ),
          confirmLabel: 'Retirer',
          confirmColor: '#ef4444',
          confirmGradient: 'linear-gradient(135deg,#ef4444,#dc2626)',
        };
      case 'orderSingle':
        return {
          icon: <FaCheck style={{ ...iconStyle, color: '#10b981' }} />,
          title: 'Commander ce véhicule ?',
          desc: (
            <>
              Vous allez passer une commande pour{' '}
              <strong style={{ color: '#fff' }}>
                {action.item.marque} {action.item.modele}
              </strong>
              {action.item.prix ? (
                <>
                  {' '}au prix de{' '}
                  <strong style={{ color: '#34d399' }}>
                    {action.item.prix.toLocaleString('fr-TN')} TND
                  </strong>
                </>
              ) : null}
              .
            </>
          ),
          confirmLabel: 'Continuer',
          confirmColor: '#10b981',
          confirmGradient: 'linear-gradient(135deg,#10b981,#059669)',
        };
      case 'orderAll':
        return {
          icon: <FaCreditCard style={{ ...iconStyle, color: '#646cff' }} />,
          title: 'Passer la commande globale ?',
          desc: (
            <>
              Vous allez commander{' '}
              <strong style={{ color: '#fff' }}>{itemsCount} véhicule(s)</strong>{' '}
              pour un total de{' '}
              <strong style={{ color: '#34d399' }}>
                {totalPrix.toLocaleString('fr-TN')} TND
              </strong>
              .
            </>
          ),
          confirmLabel: 'Continuer',
          confirmColor: '#646cff',
          confirmGradient: 'linear-gradient(135deg,#646cff,#4f46e5)',
        };
      case 'clearPanier':
        return {
          icon: <FaExclamationTriangle style={{ ...iconStyle, color: '#f59e0b' }} />,
          title: 'Vider le panier ?',
          desc: (
            <>
              Cette action supprimera{' '}
              <strong style={{ color: '#fff' }}>tous les véhicules</strong>{' '}
              de votre panier. Cette opération est irréversible.
            </>
          ),
          confirmLabel: 'Vider',
          confirmColor: '#f59e0b',
          confirmGradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
        };
    }
  })();

  return (
    <div
      style={{
        background: 'rgba(15,15,26,0.97)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        animation: 'confirmPop 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      <style>{`
        @keyframes confirmPop {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {content.icon}

      <h3 style={{ color: '#fff', margin: '0 0 0.6rem', fontSize: '1.5rem' }}>
        {content.title}
      </h3>
      <p style={{ color: '#bbb', margin: '0 0 2rem', fontSize: '1rem', lineHeight: 1.6 }}>
        {content.desc}
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '0.85rem 2rem',
            background: 'rgba(255,255,255,0.06)',
            color: '#ccc',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          style={{
            padding: '0.85rem 2rem',
            background: content.confirmGradient,
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: `0 4px 15px ${content.confirmColor}40`,
          }}
        >
          {content.confirmLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Stripe Card Form ─────────────────────────────────────────────────────────
function CardPaymentForm({ 
  onSuccess, 
  onError, 
  clientSecret,
  totalAmount 
}: { 
  onSuccess: () => void;
  onError: (error: string) => void;
  clientSecret: string;
  totalAmount: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError("Stripe n'est pas chargé correctement.");
      return;
    }

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      onError("Erreur avec le formulaire de carte");
      setProcessing(false);
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      onError(error.message || "Erreur lors de la validation de la carte");
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod.id,
    });

    if (confirmError) {
      onError(confirmError.message || "Erreur lors du paiement");
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  const cardStyle = {
    style: {
      base: {
        color: '#fff',
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': { color: '#777' },
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd', fontWeight: '500' }}>
          Informations de la carte bancaire
        </label>
        <div style={{ 
          padding: '14px 16px', 
          background: '#1e2a47', 
          border: '1px solid rgba(255,255,255,0.12)', 
          borderRadius: '12px'
        }}>
          <CardElement options={cardStyle} onChange={(e) => setCardComplete(e.complete)} />
        </div>
        <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <FaLock size={10} /> Paiement sécurisé par Stripe
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing || !cardComplete}
        style={{
          width: '100%',
          padding: '1rem',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontWeight: 'bold',
          fontSize: '1rem',
          cursor: (!stripe || processing || !cardComplete) ? 'not-allowed' : 'pointer',
        }}
      >
        {processing ? (
          'Traitement en cours...'
        ) : (
          `Payer ${totalAmount.toLocaleString('fr-TN')} TND (~ ${(totalAmount * 0.30).toFixed(0)} €)`
        )}
      </button>

      <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '1rem' }}>
        Le paiement sera traité en <strong>Euro (EUR)</strong> via Stripe.<br />
        Montant affiché : {totalAmount.toLocaleString('fr-TN')} TND
      </p>
    </form>
  );
}

// ─── Stripe Wrapper ───────────────────────────────────────────────────────────
function StripePaymentWrapper({ 
  show, 
  onClose, 
  clientSecret,
  totalAmount,
  onPaymentSuccess 
}: {
  show: boolean;
  onClose: () => void;
  clientSecret: string;
  totalAmount: number;
  onPaymentSuccess: () => void;
}) {
  if (!show) return null;

  if (!stripePromise) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ padding: '2rem', color: '#ef4444', textAlign: 'center' }}>
          <h3>Erreur de configuration Stripe</h3>
          <p>La clé publique Stripe est manquante.<br />Vérifiez votre fichier .env frontend.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2100, padding: '1rem'
    }}>
      <div className="modal-content" style={{
        background: '#16213e',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '95vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
      }}>
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaCreditCard /> Paiement par carte
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#aaa', cursor: 'pointer' }}
          >
            <FaTimes />
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          <Elements stripe={stripePromise}>
            <CardPaymentForm
              onSuccess={onPaymentSuccess}
              onError={(error) => alert(error)}
              clientSecret={clientSecret}
              totalAmount={totalAmount}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Panier() {
  const [items, setItems] = useState<PanierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [pendingOrderData, setPendingOrderData] = useState<{
    items: OrderItem[];
    formData: CommandeFormData;
  } | null>(null);
  const [formData, setFormData] = useState<CommandeFormData>({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: '',
    ville: '',
    codePostal: '',
    methodePaiement: 'espece',
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ── Confirmation inline ──────────────────────────────────────────────────
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmAction | null>(null);

  const navigate = useNavigate();

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

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
      } else {
        setError('Impossible de charger le panier');
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.response?.data?.message || 'Erreur lors du chargement du panier');
    } finally {
      setLoading(false);
    }
  }, []);

  const totalPrix = items.reduce((sum, item) => 
    sum + (item.prix && typeof item.prix === 'number' ? item.prix : 0), 0);

  const openOrderModal = (orderItems: OrderItem[]) => {
    setCurrentOrderItems(orderItems);
    setFormData({
      nom: '', prenom: '', telephone: '', email: '', adresse: '', ville: '', codePostal: '', methodePaiement: 'espece'
    });
    setShowModal(true);
  };

  const createOrder = async (itemsToOrder: OrderItem[], clientFormData: CommandeFormData) => {
    setIsOrdering(true);
    
    try {
      const res = await api.post('/vehicules/commande', {
        items: itemsToOrder.map(item => ({
          vehiculeId: item.vehiculeId,
          typeVehicule: item.typeVehicule
        })),
        informationsClient: {
          nom: clientFormData.nom,
          prenom: clientFormData.prenom,
          telephone: clientFormData.telephone,
          email: clientFormData.email,
          adresse: clientFormData.adresse,
          ville: clientFormData.ville,
          codePostal: clientFormData.codePostal,
        },
        methodePaiement: clientFormData.methodePaiement
      });

      if (res.data.success) {
        if (clientFormData.methodePaiement === 'carte' && res.data.clientSecret) {
          setClientSecret(res.data.clientSecret);
          setPendingOrderData({ items: itemsToOrder, formData: clientFormData });
          setShowModal(false);
          setShowCardModal(true);
          setIsOrdering(false);
          return;
        }
        
        showNotification('success', `Commande passée avec succès ! Numéro : ${res.data.commande.numeroCommande}`);

        if (itemsToOrder.length === 1) {
          const itemIdToRemove = items.find(i => i.vehiculeId === itemsToOrder[0].vehiculeId)?._id;
          if (itemIdToRemove) setItems(prev => prev.filter(i => i._id !== itemIdToRemove));
        } else {
          setItems([]);
        }

        setShowModal(false);
        window.dispatchEvent(new Event('cartUpdated'));

        if (itemsToOrder.length > 1) navigate('/mes-commandes');
        return res.data;
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      showNotification('error', apiErr.response?.data?.message || "Erreur lors de la commande.");
    } finally {
      setIsOrdering(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!pendingOrderData) return;
    
    showNotification('success', 'Paiement réussi ! Votre commande a été confirmée.');
    
    if (pendingOrderData.items.length === 1) {
      const itemIdToRemove = items.find(i => i.vehiculeId === pendingOrderData.items[0].vehiculeId)?._id;
      if (itemIdToRemove) setItems(prev => prev.filter(i => i._id !== itemIdToRemove));
    } else {
      setItems([]);
    }
    
    setShowCardModal(false);
    setPendingOrderData(null);
    setClientSecret('');
    window.dispatchEvent(new Event('cartUpdated'));
    navigate('/mes-commandes');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrderItems.length) return;
    await createOrder(currentOrderItems, formData);
  };

  // ── Actions avec confirmation inline (plus de confirm()) ─────────────────
  const handleOrderSingle = (item: PanierItem) => {
    setPendingConfirm({ type: 'orderSingle', item });
  };

  const handleOrderAll = () => {
    if (items.length === 0) return;
    setPendingConfirm({ type: 'orderAll' });
  };

  const handleRemoveItem = (itemId: string, vehiculeNom: string) => {
    setPendingConfirm({ type: 'remove', itemId, vehiculeNom });
  };

  const handleClearPanier = () => {
    setPendingConfirm({ type: 'clearPanier' });
  };

  // ── Exécution après confirmation ─────────────────────────────────────────
  const executeConfirmedAction = async () => {
    if (!pendingConfirm) return;
    const action = pendingConfirm;
    setPendingConfirm(null);

    switch (action.type) {
      case 'remove': {
        try {
          const res = await api.delete(`/vehicules/panier/${action.itemId}`);
          if (res.data.success) {
            setItems(prev => prev.filter(item => item._id !== action.itemId));
            showNotification('success', `${action.vehiculeNom} a été retiré du panier.`);
            window.dispatchEvent(new Event('cartUpdated'));
          }
        } catch (err: unknown) {
          const apiErr = err as ApiError;
          showNotification('error', apiErr.response?.data?.message || 'Erreur lors du retrait');
        }
        break;
      }
      case 'orderSingle': {
        openOrderModal([action.item]);
        break;
      }
      case 'orderAll': {
        openOrderModal(items);
        break;
      }
      case 'clearPanier': {
        try {
          const res = await api.delete('/vehicules/panier/clear');
          if (res.data.success) {
            setItems([]);
            showNotification('success', 'Le panier a été vidé.');
            window.dispatchEvent(new Event('cartUpdated'));
          }
        } catch (err: unknown) {
          const apiErr = err as ApiError;
          showNotification('error', apiErr.response?.data?.message || 'Erreur lors du vidage');
        }
        break;
      }
    }
  };

  useEffect(() => {
    fetchPanier();
  }, [fetchPanier]);

  if (loading) {
    return (
      <div className="vehicule-list-container" style={{ margin: '2rem auto', maxWidth: '1200px' }}>
        <div className="loading">⏳ Chargement de votre panier...</div>
      </div>
    );
  }

  return (
    <div className="vehicule-list-container" style={{ margin: '2rem auto', maxWidth: '1200px', background: '#0f0f1a' }}>
      {/* Notifications toast */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 3000 }}>
        {notifications.map((notif) => (
          <div
            key={notif.id}
            style={{
              background: notif.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white',
              padding: '14px 20px',
              borderRadius: '12px',
              marginBottom: '10px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: '280px'
            }}
          >
            {notif.type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
            <span>{notif.message}</span>
          </div>
        ))}
      </div>

      <div className="list-header">
        <h2>
          <FaShoppingCart style={{ marginRight: '12px', color: '#646cff' }} />
          Mon Panier
          {items.length > 0 && (
            <span className="badge" style={{ marginLeft: '1rem', background: '#646cff' }}>
              {items.length} article(s)
            </span>
          )}
        </h2>
        <Link to="/vehicules-neufs" className="btn-add-inline" style={{ textDecoration: 'none' }}>
          <FaArrowLeft /> Continuer mes achats
        </Link>
      </div>

      {error && <div className="error" style={{ textAlign: 'center', padding: '2rem' }}>❌ {error}</div>}

      {/* ── Message de confirmation inline (remplace la carte) ── */}
      {pendingConfirm ? (
        <InlineConfirm
          action={pendingConfirm}
          totalPrix={totalPrix}
          itemsCount={items.length}
          onConfirm={executeConfirmedAction}
          onCancel={() => setPendingConfirm(null)}
        />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <FaShoppingCart style={{ fontSize: '4rem', opacity: 0.5, marginBottom: '1rem' }} />
          <h3>Votre panier est vide</h3>
          <p>Ajoutez des véhicules depuis nos annonces</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <Link to="/vehicules-neufs" className="btn-add-inline">Véhicules Neufs</Link>
            <Link to="/vehicules-occasions" className="btn-add-inline" style={{ background: '#fbbf24' }}>
              Occasions
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="panier-list">
            {items.map((item) => {
              const prixAffiche = item.prix 
                ? item.prix.toLocaleString('fr-TN') + ' TND' 
                : 'Sur demande';

              return (
                <div key={item._id} className="panier-item" style={{
                  display: 'flex', gap: '1.5rem', padding: '1.2rem', 
                  background: 'rgba(255,255,255,0.03)', borderRadius: '16px', 
                  marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div className="panier-item-image" style={{ width: '140px', height: '100px', flexShrink: 0 }}>
                    {item.imageUrl ? (
                      <img 
                        src={getImageUrl(item.imageUrl)} 
                        alt={`${item.marque} ${item.modele}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#222', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.typeVehicule === 'voiture' ? <FaCar size={35} /> : <FaMotorcycle size={35} />}
                      </div>
                    )}
                  </div>

                  <div className="panier-item-details" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.3rem 0' }}>
                          {item.marque} {item.modele}
                          <span className={item.etat === 'neuf' ? 'neuf-badge' : 'occasion-badge'} 
                                style={{ marginLeft: '0.8rem', fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}>
                            {item.etat.toUpperCase()}
                          </span>
                        </h3>
                        <p style={{ margin: '0', fontSize: '0.9rem', color: '#aaa' }}>
                          Année: {item.annee} • Agence: {item.agenceNom || '—'}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#34d399', margin: '0 0 0.8rem 0' }}>
                          {prixAffiche}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOrderSingle(item)}
                            disabled={isOrdering}
                            style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.6rem 1.3rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <FaCheck /> Commander seul
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item._id, `${item.marque} ${item.modele}`)}
                            style={{ background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
                          >
                            <FaTrash /> Retirer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="panier-summary" style={{
            marginTop: '2.5rem', padding: '2rem', background: 'linear-gradient(135deg, rgba(100,108,255,0.1), rgba(138,43,226,0.1))',
            borderRadius: '20px', border: '1px solid rgba(100,108,255,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Total estimé</h3>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#34d399' }}>
                  {totalPrix.toLocaleString('fr-TN')} TND
                </p>
                <p style={{ color: '#aaa' }}>{items.length} véhicule(s)</p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleClearPanier}
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '0.9rem 1.8rem', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  Vider le panier
                </button>
                <button 
                  onClick={handleOrderAll} 
                  disabled={isOrdering}
                  style={{ 
                    background: 'linear-gradient(135deg, #10b981, #059669)', 
                    color: 'white', 
                    padding: '0.9rem 2.5rem', 
                    borderRadius: '10px', 
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Passer la commande <FaCreditCard />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal formulaire commande ── */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 2000, padding: '1rem'
        }}>
          <div className="modal-content" style={{
            background: '#16213e', 
            borderRadius: '20px', 
            width: '100%', 
            maxWidth: '620px',
            maxHeight: '95vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ 
              padding: '1.8rem 2rem', 
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <h2 style={{ margin: 0, color: '#fff' }}>Finaliser votre commande</h2>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ background: 'none', border: 'none', fontSize: '1.8rem', color: '#aaa', cursor: 'pointer' }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
                  <FaUser /> Informations personnelles
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>Prénom *</label>
                    <input 
                      type="text" 
                      placeholder="Votre prénom" 
                      value={formData.prenom} 
                      onChange={(e) => setFormData({...formData, prenom: e.target.value})} 
                      required 
                    />
                  </div>
                  <div>
                    <label>Nom *</label>
                    <input 
                      type="text" 
                      placeholder="Votre nom" 
                      value={formData.nom} 
                      onChange={(e) => setFormData({...formData, nom: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label>Téléphone *</label>
                  <input 
                    type="tel" 
                    placeholder="+216 XX XXX XXX" 
                    value={formData.telephone} 
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})} 
                    required 
                  />
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label>Email *</label>
                  <input 
                    type="email" 
                    placeholder="exemple@email.com" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
                  <FaMapMarkerAlt /> Adresse de retrait / livraison
                </h3>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Adresse complète *</label>
                  <input 
                    type="text" 
                    placeholder="Rue, numéro, quartier..." 
                    value={formData.adresse} 
                    onChange={(e) => setFormData({...formData, adresse: e.target.value})} 
                    required 
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>Ville *</label>
                    <input 
                      type="text" 
                      placeholder="Tunis, Sfax..." 
                      value={formData.ville} 
                      onChange={(e) => setFormData({...formData, ville: e.target.value})} 
                      required 
                    />
                  </div>
                  <div>
                    <label>Code postal *</label>
                    <input 
                      type="text" 
                      placeholder="XXXX" 
                      value={formData.codePostal} 
                      onChange={(e) => setFormData({...formData, codePostal: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
                  <FaMoneyBillWave /> Méthode de paiement
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { value: 'espece', label: 'Paiement en espèce', desc: "À la livraison ou au retrait chez l'agence" },
                    { value: 'virement', label: 'Virement bancaire', desc: 'Vous recevrez les coordonnées bancaires par email' },
                    { value: 'carte', label: 'Carte bancaire', desc: 'Paiement sécurisé en ligne' }
                  ].map((methode) => (
                    <label 
                      key={methode.value}
                      style={{
                        padding: '14px 16px',
                        background: formData.methodePaiement === methode.value ? '#0f3460' : '#1e2a47',
                        border: formData.methodePaiement === methode.value ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input 
                          type="radio" 
                          name="methodePaiement" 
                          value={methode.value}
                          checked={formData.methodePaiement === methode.value}
                          onChange={(e) => setFormData({...formData, methodePaiement: e.target.value as CommandeFormData['methodePaiement']})}
                          style={{ accentColor: '#34d399' }}
                        />
                        <div>
                          <strong>{methode.label}</strong>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#aaa' }}>{methode.desc}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ 
                    flex: 1, 
                    padding: '1.1rem', 
                    background: '#334155', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '12px', 
                    fontSize: '1.05rem',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isOrdering}
                  style={{ 
                    flex: 1, 
                    padding: '1.1rem', 
                    background: 'linear-gradient(135deg, #10b981, #059669)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    fontWeight: 'bold',
                    fontSize: '1.05rem',
                    cursor: isOrdering ? 'not-allowed' : 'pointer',
                    opacity: isOrdering ? 0.8 : 1
                  }}
                >
                  {isOrdering ? 'Traitement en cours...' : `Confirmer la commande • ${totalPrix.toLocaleString('fr-TN')} TND`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StripePaymentWrapper
        show={showCardModal}
        onClose={() => {
          setShowCardModal(false);
          setPendingOrderData(null);
          setClientSecret('');
        }}
        clientSecret={clientSecret}
        totalAmount={totalPrix}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}