import React from 'react';
import './MapModal.css';

interface Props {
  open: boolean;
  onClose: () => void;
  adresse: string;
  ville: string;
  nom?: string;
}

export default function MapModal({ open, onClose, adresse, ville, nom }: Props) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const query = encodeURIComponent(`${adresse}, ${ville}`);
  const embedUrl = apiKey ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${query}` : undefined;
  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  if (!open) return null;

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal" onClick={(e) => e.stopPropagation()}>
        <div className="map-modal-header">
          <h3>{nom ? `${nom} — Localisation` : 'Localisation'}</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="map-modal-body">
          {embedUrl ? (
            <iframe
              title="Google Maps"
              width="100%"
              height="350"
              loading="lazy"
              allowFullScreen
              src={embedUrl}
            />
          ) : (
            <div className="no-api">
              <p>Clé Google Maps non configurée. Vous pouvez ouvrir l'agence directement dans Google Maps.</p>
            </div>
          )}
        </div>

        <div className="map-modal-footer">
          <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">Ouvrir dans Google Maps</a>
          <button className="btn-secondary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
