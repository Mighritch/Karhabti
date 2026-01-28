import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  FaSpinner,
  FaCar,
  FaMotorcycle,
  FaCloudUploadAlt,
  FaTrash,
  FaRobot,
  FaCheckCircle,
} from 'react-icons/fa';
import './VehiculeForm.css';

interface VehiculeImage {
  file: File;
  preview: string;
}

interface VehiculeFormData {
  marque?: string;
  modele?: string;
  annee?: number;
  couleur?: string;
  etat: 'neuf' | 'occasion';
  kilometrage?: number;
  immatriculation?: string;
  categorie?: string;
  motorisation?: string;
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
  typeMoto?: string;
  typeTransmission?: string;
  typePermis?: string;
  [key: string]: any;
}

interface VehiculeFormProps {
  agenceId: string;
  typeVehicule: 'voiture' | 'moto';
  onSuccess: () => void;
  onCancel: () => void;
}

export default function VehiculeForm({
  agenceId,
  typeVehicule,
  onSuccess,
  onCancel,
}: VehiculeFormProps) {
  const { token } = useAuth();

  const [formData, setFormData] = useState<VehiculeFormData>({
    etat: 'occasion',
    motorisation: 'Essence',
    boiteVitesse: 'Manuelle',
    abs: true,
    regulateurVitesse: false,
    climatisation: false,
    cameraRecul: false,
    gps: false,
    ecranMultimedia: false,
    nbrVitesse: 5,
    nbrPortes: 5,
    nbrPlaces: 5,
    airbags: 2,
    typePermis: typeVehicule === 'voiture' ? 'B' : 'A',
    typeTransmission: typeVehicule === 'moto' ? 'Chaîne' : undefined,
  });

  const [images, setImages] = useState<VehiculeImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  // Nettoyage des previews pour éviter les fuites mémoire
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  // ────────────────────────────────────────────────
  //               Analyse IA
  // ────────────────────────────────────────────────
  const handleMagicAI = async () => {
    if (images.length === 0 || analyzing) return;

    setAnalyzing(true);
    setError(null);
    setAiSuggestions(null);

    try {
      const formDataImage = new FormData();
      formDataImage.append('images', images[0].file);

      const res = await api.post('/vehicules/suggest-from-image', formDataImage, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setAiSuggestions(res.data.data);
        const confiance = res.data.data.confiance || 0;
        if (confiance < 0.65) {
          setError(`Détection peu fiable (${Math.round(confiance * 100)}%) — vérifiez manuellement`);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Impossible d'analyser l'image pour le moment.");
    } finally {
      setAnalyzing(false);
    }
  };

  const applySuggestion = (field: string, value: any) => {
    if (!value || value === 'Inconnu') return;

    let targetField = field;
    let targetValue = value;

    // Mapping intelligent
    if (field === 'type') {
      targetField = typeVehicule === 'voiture' ? 'categorie' : 'typeMoto';
    }

    setFormData((prev) => ({
      ...prev,
      [targetField]: targetValue,
    }));
  };

  // ────────────────────────────────────────────────
  //               Gestion images
  // ────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const newImages = newFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  // ────────────────────────────────────────────────
  //               Gestion formulaire
  // ────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val =
      type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : type === 'number'
        ? value === '' ? undefined : Number(value)
        : value;

    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const endpoint = typeVehicule === 'voiture' ? '/vehicules/voitures' : '/vehicules/motos';
      const data = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          data.append(key, String(value));
        }
      });

      data.append('agence', agenceId);
      images.forEach((img) => data.append('images', img.file));

      const res = await api.post(endpoint, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l’ajout du véhicule');
    } finally {
      setSubmitting(false);
    }
  };

  // ────────────────────────────────────────────────
  //               RENDER
  // ────────────────────────────────────────────────
  return (
    <div className="vehicule-form-container">
      <h2>
        {typeVehicule === 'voiture' ? <FaCar /> : <FaMotorcycle />}
        Ajouter un {typeVehicule === 'voiture' ? 'véhicule' : 'deux-roues'}
      </h2>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="grid-form">
        {/* Panneau IA */}
        {aiSuggestions && (
          <div className="ai-suggestions-panel">
            <h4>
              <FaRobot /> Suggestions IA – cliquez pour remplir
            </h4>
            <div className="suggestions-grid">
              {Object.entries(aiSuggestions).map(([key, value]) =>
                key !== 'confiance' && value && value !== 'Inconnu' ? (
                  <button
                    key={key}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => applySuggestion(key, value)}
                  >
                    <strong>
                      {key === 'type'
                        ? typeVehicule === 'voiture'
                          ? 'Catégorie'
                          : 'Type moto'
                        : key}
                      :
                    </strong>{' '}
                    {String(value)}
                  </button>
                ) : null
              )}
            </div>
            {aiSuggestions.confiance !== undefined && (
              <div className="confiance-indicator">
                Confiance : {Math.round(aiSuggestions.confiance * 100)}%
              </div>
            )}
            <button
              type="button"
              className="btn-clear-ai"
              onClick={() => setAiSuggestions(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* ─── Section 1 ──────────────────────────────── */}
        <section className="form-section">
          <h3>Informations générales</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Marque *</label>
              <input
                type="text"
                name="marque"
                value={formData.marque || ''}
                onChange={handleChange}
                required
                placeholder="Peugeot, Yamaha, BMW..."
              />
            </div>
            <div className="form-group">
              <label>Modèle *</label>
              <input
                type="text"
                name="modele"
                value={formData.modele || ''}
                onChange={handleChange}
                required
                placeholder="208, MT-07, Série 3..."
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Année *</label>
              <input
                type="number"
                name="annee"
                value={formData.annee ?? ''}
                onChange={handleChange}
                min={1900}
                max={new Date().getFullYear() + 1}
                required
              />
            </div>
            <div className="form-group">
              <label>Couleur *</label>
              <input
                type="text"
                name="couleur"
                value={formData.couleur || ''}
                onChange={handleChange}
                required
                placeholder="Noir, Blanc, Rouge..."
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>État *</label>
              <select name="etat" value={formData.etat} onChange={handleChange} required>
                <option value="occasion">Occasion</option>
                <option value="neuf">Neuf</option>
              </select>
            </div>
            <div className="form-group">
              <label>Kilométrage (km)</label>
              <input
                type="number"
                name="kilometrage"
                value={formData.kilometrage ?? ''}
                onChange={handleChange}
                min={0}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Immatriculation</label>
            <input
              type="text"
              name="immatriculation"
              value={formData.immatriculation || ''}
              onChange={handleChange}
              placeholder="ex: 123 TUN 456"
            />
          </div>
        </section>

        {/* ─── Section 2 ──────────────────────────────── */}
        <section className="form-section">
          <h3>Spécifications techniques</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Motorisation *</label>
              <select name="motorisation" value={formData.motorisation} onChange={handleChange} required>
                {['Essence', 'Diesel', 'Électrique', 'Hybride', 'GPL'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Boîte de vitesses *</label>
              <select name="boiteVitesse" value={formData.boiteVitesse} onChange={handleChange} required>
                {['Manuelle', 'Automatique', 'CVT', 'Semi-automatique'].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            {typeVehicule === 'voiture' ? (
              <div className="form-group">
                <label>Puissance (ch/kW) *</label>
                <input
                  type="number"
                  name="puissance"
                  value={formData.puissance ?? ''}
                  onChange={handleChange}
                  min={0}
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Cylindrée (cm³) *</label>
                <input
                  type="number"
                  name="cylindre"
                  value={formData.cylindre ?? ''}
                  onChange={handleChange}
                  min={50}
                  required
                />
              </div>
            )}

            {typeVehicule === 'moto' && (
              <div className="form-group">
                <label>Transmission</label>
                <select
                  name="typeTransmission"
                  value={formData.typeTransmission || ''}
                  onChange={handleChange}
                >
                  <option value="Chaîne">Chaîne</option>
                  <option value="Courroie">Courroie</option>
                  <option value="Arbre">Arbre</option>
                </select>
              </div>
            )}
          </div>

          {typeVehicule === 'voiture' && (
            <div className="form-row">
              <div className="form-group">
                <label>Nombre de portes</label>
                <input
                  type="number"
                  name="nbrPortes"
                  value={formData.nbrPortes ?? ''}
                  onChange={handleChange}
                  min={2}
                  max={6}
                />
              </div>
              <div className="form-group">
                <label>Nombre de places</label>
                <input
                  type="number"
                  name="nbrPlaces"
                  value={formData.nbrPlaces ?? ''}
                  onChange={handleChange}
                  min={2}
                  max={9}
                />
              </div>
            </div>
          )}
        </section>

        {/* ─── Section 3 – Voiture uniquement ─────────── */}
        {typeVehicule === 'voiture' && (
          <section className="form-section">
            <h3>Équipements & Confort</h3>
            <div className="checkbox-grid">
              {[
                { key: 'abs', label: 'ABS' },
                { key: 'climatisation', label: 'Climatisation' },
                { key: 'regulateurVitesse', label: 'Régulateur de vitesse' },
                { key: 'cameraRecul', label: 'Caméra de recul' },
                { key: 'gps', label: 'GPS' },
                { key: 'ecranMultimedia', label: 'Écran multimédia' },
              ].map(({ key, label }) => (
                <label key={key} className="checkbox-item">
                  <input
                    type="checkbox"
                    name={key}
                    checked={!!formData[key]}
                    onChange={handleChange}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>
        )}

        {/* ─── Section Photos + IA ────────────────────── */}
        <section className="form-section">
          <h3>Photos (max 5) – IA sur la première</h3>
          <div className="upload-area">
            <input
              type="file"
              id="vehicle-images"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />
            <label htmlFor="vehicle-images" className="upload-label">
              <FaCloudUploadAlt className="upload-icon" />
              <span>Cliquez ou glissez-déposez</span>
            </label>
          </div>

          {images.length > 0 && (
            <>
              <div className="image-previews">
                {images.map((img, idx) => (
                  <div key={idx} className="preview-item">
                    <img src={img.preview} alt="prévisualisation" />
                    <button type="button" className="remove-image" onClick={() => removeImage(idx)}>
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn-ai-analyze"
                onClick={handleMagicAI}
                disabled={analyzing || images.length === 0}
              >
                {analyzing ? (
                  <>
                    <FaSpinner className="spin" /> Analyse en cours...
                  </>
                ) : (
                  <>
                    <FaRobot /> Analyser la première photo (IA)
                  </>
                )}
              </button>
            </>
          )}
        </section>

        {/* Boutons d'action */}
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Annuler
          </button>
          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? <FaSpinner className="spin" /> : 'Enregistrer le véhicule'}
          </button>
        </div>
      </form>
    </div>
  );
}