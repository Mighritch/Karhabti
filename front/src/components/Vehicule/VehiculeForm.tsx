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
  FaTimes,
} from 'react-icons/fa';
import './VehiculeForm.css';

interface VehiculeImage {
  file?: File;
  preview: string;
  isExisting?: boolean;
  url?: string;
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
  prix?: number;
  images?: { url: string; nomFichier: string }[];
  [key: string]: string | number | boolean | undefined | { url: string; nomFichier: string }[];
}

interface AiSuggestions {
  marque?: string;
  modele?: string;
  annee?: number;
  type?: string;
  couleur?: string;
  prixEstime?: number;
  puissance?: number;
  cylindre?: number;
  kilometrage?: number;
  etat?: string;
  categorie?: string;
  description?: string;
  confiance?: number;
}

interface VehiculeFormProps {
  agenceId: string;
  typeVehicule: 'voiture' | 'moto';
  onSuccess: () => void;
  onCancel: () => void;
  vehiculeId?: string;
  initialData?: VehiculeFormData;
}

export default function VehiculeForm({
  agenceId,
  typeVehicule,
  onSuccess,
  onCancel,
  vehiculeId,
  initialData,
}: VehiculeFormProps) {
  const { token } = useAuth();
  const isEditMode = !!vehiculeId && !!initialData;

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
    prix: undefined,
  });

  const [images, setImages] = useState<VehiculeImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestions | null>(null);

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({ ...initialData });
      const existingImages = (initialData.images || []).map((img) => ({
        preview: img.url.startsWith('http') ? img.url : `http://localhost:5000${img.url}`,
        isExisting: true,
        url: img.url,
      }));
      setImages(existingImages);
    }
  }, [initialData, isEditMode]);

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (!img.isExisting) URL.revokeObjectURL(img.preview);
      });
    };
  }, [images]);

  const applyAllSuggestions = (s: AiSuggestions) => {
    const mapping: Partial<VehiculeFormData> = {};

    if (s.marque) mapping.marque = s.marque;
    if (s.modele) mapping.modele = s.modele;
    if (s.annee) mapping.annee = Number(s.annee);
    if (s.couleur) mapping.couleur = s.couleur;
    if (s.prixEstime !== undefined) mapping.prix = Number(s.prixEstime);
    if (s.puissance !== undefined) mapping.puissance = Number(s.puissance);
    if (s.cylindre !== undefined) mapping.cylindre = Number(s.cylindre);
    if (s.kilometrage !== undefined) mapping.kilometrage = Number(s.kilometrage);
    if (s.etat) {
      const et = s.etat.toString().toLowerCase();
      mapping.etat = et.includes('neuf') ? 'neuf' : et.includes('occasion') ? 'occasion' : mapping.etat;
    }
    if (s.type) {
      if (typeVehicule === 'voiture') mapping.categorie = s.type;
      else mapping.typeMoto = s.type;
    }
    if (s.categorie) mapping.categorie = s.categorie;

    setFormData((prev) => ({ ...prev, ...mapping }));
  };

  const handleMagicAI = async () => {
    if (images.length === 0 || analyzing) return;
    setAnalyzing(true);
    setError(null);
    setAiSuggestions(null);

    try {
      const formDataImage = new FormData();
      const firstImage = images[0];

      if (firstImage.file) {
        formDataImage.append('images', firstImage.file);
      } else {
        setError('Ajoutez une nouvelle image pour utiliser l’analyse IA');
        setAnalyzing(false);
        return;
      }

      const res = await api.post('/vehicules/suggest-from-image', formDataImage, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 95000,
      });

      if (res.data.success) {
        // Supporter plusieurs formes de réponse : { data: {...} } ou legacy { suggestions: [...] }
        const payload = res.data.data || (res.data.suggestions ? { description: Array.isArray(res.data.suggestions) ? res.data.suggestions.join(', ') : String(res.data.suggestions), confiance: 0 } : null);
        if (!payload) {
          setError('Réponse IA invalide');
        } else {
          setAiSuggestions(payload);
          const confiance = typeof payload.confiance === 'number' ? payload.confiance : 0;
          // Auto-apply si la confiance est suffisante
          if (confiance >= 0.6) {
            applyAllSuggestions(payload);
          }
          if (confiance < 0.60) {
            setError(`Détection peu fiable (${Math.round(confiance * 100)}%) – vérifiez manuellement`);
          }
        }
      } else {
        setError(res.data.message || "Réponse invalide du serveur");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Erreur réseau / timeout");
    } finally {
      setAnalyzing(false);
    }
  };

  const applySuggestion = (field: string, value: string | number) => {
    if (!value || value === 'Inconnu') return;
    let targetField = field;
    let targetValue: string | number = value;

    if (field === 'type') {
      targetField = typeVehicule === 'voiture' ? 'categorie' : 'typeMoto';
    } else if (field === 'prixEstime') {
      targetField = 'prix';
      targetValue = Number(value) || 0;
    }

    setFormData((prev) => ({
      ...prev,
      [targetField]: targetValue,
    }));
  };

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
      const img = updated[index];
      if (!img.isExisting) URL.revokeObjectURL(img.preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
      const endpoint = isEditMode
        ? `/vehicules/${typeVehicule}s/${vehiculeId}`
        : `/vehicules/${typeVehicule}s`;

      const method = isEditMode ? api.put : api.post;

      const data = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          data.append(key, String(value));
        }
      });

      images.forEach((img) => {
        if (img.file) {
          data.append('images', img.file);
        }
      });

      if (!isEditMode) {
        data.append('agence', agenceId);
      }

      const res = await method(endpoint, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        onSuccess();
      } else {
        setError(res.data.message || 'Erreur inattendue');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur lors de l’enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="vehicule-form-container">
      <button
        type="button"
        className="close-form-btn"
        onClick={onCancel}
        title="Fermer"
      >
        <FaTimes />
      </button>

      <h2>
        {isEditMode ? 'Modifier' : 'Ajouter'}{' '}
        {typeVehicule === 'voiture' ? <FaCar /> : <FaMotorcycle />}{' '}
        {typeVehicule === 'voiture' ? 'un véhicule' : 'une moto'}
      </h2>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="grid-form">
        {aiSuggestions && (
          <div className="ai-suggestions-panel">
            <h3>
              <FaRobot /> Suggestions IA
              <span className="confiance">
                Confiance : {Math.round((aiSuggestions.confiance || 0) * 100)}%
              </span>
            </h3>
            <div className="suggestions-chips">
              {Object.entries(aiSuggestions).map(([key, value]) =>
                key !== 'confiance' && value && value !== 'Inconnu' ? (
                  <div
                    key={key}
                    className="suggestion-chip"
                    onClick={() => applySuggestion(key, value as string | number)}
                    role="button"
                    tabIndex={0}
                  >
                    {key === 'prixEstime'
                      ? `Prix estimé : ${Number(value).toLocaleString('fr-TN')} TND`
                      : `${key.charAt(0).toUpperCase() + key.slice(1)} : ${value}`}
                    <FaCheckCircle className="check-icon" />
                  </div>
                ) : null
              )}
            </div>
            <div className="ai-actions">
              <button
                type="button"
                className="btn-apply-all"
                onClick={() => applyAllSuggestions(aiSuggestions)}
              >
                Remplir tout
              </button>
              <button
                type="button"
                className="btn-clear-ai"
                onClick={() => setAiSuggestions(null)}
              >
                Ignorer suggestions
              </button>
            </div>
          </div>
        )}

        <section className="form-section">
          <h3>Informations générales</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Marque *</label>
              <input
                type="text"
                name="marque"
                value={formData.marque ?? ''}
                onChange={handleChange}
                placeholder="Peugeot, Yamaha, BMW..."
                required
              />
            </div>
            <div className="form-group">
              <label>Modèle *</label>
              <input
                type="text"
                name="modele"
                value={formData.modele ?? ''}
                onChange={handleChange}
                placeholder="208, MT-07, Série 3..."
                required
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
                value={formData.couleur ?? ''}
                onChange={handleChange}
                placeholder="Blanc, Rouge, Gris..."
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>État *</label>
              <select name="etat" value={formData.etat} onChange={handleChange} required>
                <option value="neuf">Neuf</option>
                <option value="occasion">Occasion</option>
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
            <div className="form-group">
              <label>Prix en TND *</label>
              <input
                type="number"
                name="prix"
                value={formData.prix ?? ''}
                onChange={handleChange}
                min={0}
                step={500}
                placeholder="Exemple : 45800"
                required
              />
              <small>Prix en Dinars Tunisiens (TND)</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Immatriculation</label>
              <input
                type="text"
                name="immatriculation"
                value={formData.immatriculation ?? ''}
                onChange={handleChange}
                placeholder="ex: 123 TUN 456 | AA-123-BB"
              />
            </div>
          </div>

          <div className="form-group">
            <label>{typeVehicule === 'voiture' ? 'Catégorie' : 'Type de moto'} *</label>
            <select
              name={typeVehicule === 'voiture' ? 'categorie' : 'typeMoto'}
              value={formData[typeVehicule === 'voiture' ? 'categorie' : 'typeMoto'] ?? ''}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionnez...</option>
              {typeVehicule === 'voiture' ? (
                <>
                  <option value="Citadine">Citadine</option>
                  <option value="Berline">Berline</option>
                  <option value="SUV / Crossover">SUV / Crossover</option>
                  <option value="Sportive">Sportive</option>
                  <option value="Cabriolet">Cabriolet</option>
                  <option value="Monospace">Monospace</option>
                  <option value="Pickup">Pickup</option>
                  <option value="Utilitaire / Van">Utilitaire / Van</option>
                </>
              ) : (
                <>
                  <option value="Routière">Routière</option>
                  <option value="Sportive">Sportive</option>
                  <option value="Naked">Naked</option>
                  <option value="Trail/Adventure">Trail/Adventure</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Maxi-scooter">Maxi-scooter</option>
                  <option value="Cruiser">Cruiser</option>
                  <option value="Touring">Touring</option>
                </>
              )}
            </select>
          </div>
        </section>

        <section className="form-section">
          <h3>Spécifications techniques</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Motorisation *</label>
              <select name="motorisation" value={formData.motorisation ?? ''} onChange={handleChange} required>
                {['Essence', 'Diesel', 'Électrique', 'Hybride', 'GPL'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Boîte de vitesses *</label>
              <select name="boiteVitesse" value={formData.boiteVitesse ?? ''} onChange={handleChange} required>
                {['Manuelle', 'Automatique', 'CVT', 'Semi-automatique'].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
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

            {typeVehicule === 'voiture' ? (
              <>
                <div className="form-group">
                  <label>Cylindrée (cc) *</label>
                  <input
                    type="number"
                    name="cylindre"
                    value={formData.cylindre ?? ''}
                    onChange={handleChange}
                    min={0}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Consommation (L/100km) *</label>
                  <input
                    type="number"
                    name="consommation"
                    value={formData.consommation ?? ''}
                    onChange={handleChange}
                    min={0}
                    step="0.1"
                    required
                  />
                </div>
              </>
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
          </div>

          {typeVehicule === 'moto' && (
            <div className="form-group">
              <label>Transmission</label>
              <select
                name="typeTransmission"
                value={formData.typeTransmission ?? ''}
                onChange={handleChange}
              >
                <option value="Chaîne">Chaîne</option>
                <option value="Courroie">Courroie</option>
                <option value="Arbre">Arbre</option>
              </select>
            </div>
          )}

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

        <section className="form-section">
          <h3>Photos (max 5) – IA sur la première photo</h3>
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

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Annuler
          </button>
          <button type="submit" className="btn-submit" disabled={submitting || analyzing}>
            {submitting ? (
              <FaSpinner className="spin" />
            ) : isEditMode ? (
              'Mettre à jour'
            ) : (
              'Enregistrer le véhicule'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}