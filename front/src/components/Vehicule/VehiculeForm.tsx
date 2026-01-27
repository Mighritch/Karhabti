// src/components/Vehicule/VehiculeForm.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FaSpinner, FaCar, FaMotorcycle, FaCloudUploadAlt, FaTrash, FaMagic } from 'react-icons/fa';
import './VehiculeForm.css';

interface VehiculeImage {
  file: File;
  preview: string;
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
  const [formData, setFormData] = useState<any>({
    etat: 'occasion' // Default value
  });
  const [images, setImages] = useState<VehiculeImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const fetchModelSuggestions = async () => {
    if (!formData.marque || formData.marque.length < 2) return;
    setLoadingModels(true);
    setError(null);
    try {
      const res = await api.post('/vehicules/suggest-models', {
        marque: formData.marque,
        type: typeVehicule
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setModelSuggestions(res.data.data);
      }
    } catch (err: any) {
      console.error('Erreur suggestions models:', err);
      const msg = err.response?.data?.message || 'L\'IA est surchargée, veuillez réessayer.';
      setError(msg);
      setTimeout(() => setError(null), 5000); // Effacer l'erreur après 5s
    } finally {
      setLoadingModels(false);
    }
  };

  const selectModel = (model: string) => {
    setFormData((prev: any) => ({ ...prev, modele: model }));
    setModelSuggestions([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newImages = newFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const endpoint = typeVehicule === 'voiture' ? '/vehicules/voitures' : '/vehicules/motos';

      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      data.append('agence', agenceId);

      images.forEach(img => {
        data.append('images', img.file);
      });

      const res = await api.post(endpoint, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });

      if (res.data.success) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l’ajout');
    } finally {
      setSubmitting(false);
    }
  };

  const commonFields = (
    <>
      <div className="form-group">
        <label>Marque *</label>
        <div className="input-with-action">
          <input
            type="text"
            name="marque"
            value={formData.marque || ''}
            onChange={handleChange}
            required
            placeholder="Ex: Toyota, BMW..."
          />
          <button
            type="button"
            className="btn-ai-suggest"
            onClick={fetchModelSuggestions}
            disabled={loadingModels || !formData.marque}
            title="Suggérer des modèles via IA"
          >
            {loadingModels ? <FaSpinner className="spin" /> : <FaMagic />}
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Modèle *</label>
        <div className="model-input-container">
          <input
            type="text"
            name="modele"
            value={formData.modele || ''}
            onChange={handleChange}
            required
            placeholder="Ex: Corolla, X5..."
          />
          {modelSuggestions.length > 0 && (
            <div className="suggestions-dropdown">
              <div className="suggestions-header">
                <span>Modèles suggérés par l'IA</span>
                <button type="button" onClick={() => setModelSuggestions([])}>&times;</button>
              </div>
              <div className="suggestions-list">
                {modelSuggestions.map((model, idx) => (
                  <div
                    key={idx}
                    className="suggestion-item"
                    onClick={() => selectModel(model)}
                  >
                    {model}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Année *</label>
        <input
          type="number"
          name="annee"
          value={formData.annee ?? ''}
          onChange={handleChange}
          min="1900"
          max={new Date().getFullYear()}
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
        />
      </div>

      <div className="form-group">
        <label>État *</label>
        <div className="choice-group">
          <div className="choice-item">
            <input
              type="radio"
              id="etat-v-neuf"
              name="etat"
              value="neuf"
              checked={formData.etat === 'neuf'}
              onChange={handleChange}
            />
            <label htmlFor="etat-v-neuf">Neuf</label>
          </div>
          <div className="choice-item">
            <input
              type="radio"
              id="etat-v-occasion"
              name="etat"
              value="occasion"
              checked={formData.etat === 'occasion'}
              onChange={handleChange}
            />
            <label htmlFor="etat-v-occasion">Occasion</label>
          </div>
        </div>
      </div>

      {formData.etat === 'occasion' && (
        <div className="form-group">
          <label>Kilométrage *</label>
          <input
            type="number"
            name="kilometrage"
            value={formData.kilometrage ?? ''}
            onChange={handleChange}
            min="0"
            required
          />
        </div>
      )}

      <div className="form-group">
        <label>Immatriculation *</label>
        <input
          type="text"
          name="immatriculation"
          value={formData.immatriculation || ''}
          onChange={handleChange}
          required
          placeholder="ex: 123TUN456"
        />
      </div>
    </>
  );

  return (
    <div className="vehicule-form-container">
      <h2>
        {typeVehicule === 'voiture' ? <FaCar /> : <FaMotorcycle />}
        Ajouter un {typeVehicule === 'voiture' ? 'véhicule' : 'deux-roues'}
      </h2>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        {commonFields}

        {/* Image Upload Field */}
        <div className="form-group">
          <label>Photos du véhicule (Max 5) *</label>
          <div className="upload-area">
            <input
              type="file"
              id="vehicle-images"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
              required={images.length === 0}
            />
            <label htmlFor="vehicle-images" className="upload-label">
              <FaCloudUploadAlt className="upload-icon" />
              <span>Cliquez pour ajouter des photos</span>
              <small>(Format: JPG, PNG • Max: 5Mo)</small>
            </label>
          </div>

          {images.length > 0 && (
            <div className="image-previews">
              {images.map((img, index) => (
                <div key={index} className="preview-item">
                  <img src={img.preview} alt={`Preview ${index}`} />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => removeImage(index)}
                    title="Supprimer"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {typeVehicule === 'voiture' ? (
          <>
            <div className="form-group">
              <label>Catégorie *</label>
              <div className="choice-group">
                {['Citadine', 'Berline', 'SUV / Crossover', 'Sportive', 'Cabriolet', 'Utilitaire / Van'].map((cat) => (
                  <div key={cat} className="choice-item">
                    <input
                      type="radio"
                      id={`cat-${cat}`}
                      name="categorie"
                      value={cat}
                      checked={formData.categorie === cat}
                      onChange={handleChange}
                    />
                    <label htmlFor={`cat-${cat}`} className="choice-label">{cat}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Motorisation *</label>
              <div className="choice-group">
                {['Essence', 'Diesel', 'Électrique', 'Hybride', 'Hybride rechargeable'].map((mot) => (
                  <div key={mot} className="choice-item">
                    <input
                      type="radio"
                      id={`mot-${mot}`}
                      name="motorisation"
                      value={mot}
                      checked={formData.motorisation === mot}
                      onChange={handleChange}
                    />
                    <label htmlFor={`mot-${mot}`} className="choice-label">{mot}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Puissance (kW) *</label>
              <input
                type="number"
                name="puissance"
                value={formData.puissance ?? ''}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Nombre de portes *</label>
              <div className="choice-group">
                {['3', '5'].map((n) => (
                  <div key={n} className="choice-item">
                    <input
                      type="radio"
                      id={`portes-${n}`}
                      name="nbrPortes"
                      value={n}
                      checked={formData.nbrPortes === n}
                      onChange={handleChange}
                    />
                    <label htmlFor={`portes-${n}`} className="choice-label">{n} portes</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Information statique pour le permis */}
            <div className="form-group info-field">
              <label>Type de permis requis</label>
              <div className="static-value">Permis B uniquement</div>
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Motorisation *</label>
              <div className="choice-group">
                {['Essence', 'Diesel', 'Électrique', 'Hybride'].map((mot) => (
                  <div key={mot} className="choice-item">
                    <input
                      type="radio"
                      id={`mot-moto-${mot}`}
                      name="motorisation"
                      value={mot}
                      checked={formData.motorisation === mot}
                      onChange={handleChange}
                    />
                    <label htmlFor={`mot-moto-${mot}`} className="choice-label">{mot}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Cylindrée (cc) *</label>
              <input
                type="number"
                name="cylindre"
                value={formData.cylindre ?? ''}
                onChange={handleChange}
                min="50"
                required
              />
            </div>

            <div className="form-group">
              <label>Type de moto *</label>
              <div className="choice-group">
                {['Routière', 'Sportive', 'Cruiser', 'Touring', 'Naked', 'Enduro', 'Trail', 'Scooter', 'Maxi-scooter'].map((t) => (
                  <div key={t} className="choice-item">
                    <input
                      type="radio"
                      id={`typeMoto-${t}`}
                      name="typeMoto"
                      value={t}
                      checked={formData.typeMoto === t}
                      onChange={handleChange}
                    />
                    <label htmlFor={`typeMoto-${t}`} className="choice-label">{t}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Boîte de vitesse *</label>
              <div className="choice-group">
                {['Manuelle', 'Automatique', 'CVT'].map((b) => (
                  <div key={b} className="choice-item">
                    <input
                      type="radio"
                      id={`boite-${b}`}
                      name="boiteVitesse"
                      value={b}
                      checked={formData.boiteVitesse === b}
                      onChange={handleChange}
                    />
                    <label htmlFor={`boite-${b}`} className="choice-label">{b}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Type de transmission *</label>
              <div className="choice-group">
                {['Chaîne', 'Courroie', 'Arbre'].map((t) => (
                  <div key={t} className="choice-item">
                    <input
                      type="radio"
                      id={`trans-${t}`}
                      name="typeTransmission"
                      value={t}
                      checked={formData.typeTransmission === t}
                      onChange={handleChange}
                    />
                    <label htmlFor={`trans-${t}`} className="choice-label">{t}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Type de permis requis *</label>
              <div className="choice-group">
                {[
                  { val: 'A1', label: 'A1 (≤ 125 cm³)' },
                  { val: 'A', label: 'A (Toutes)' }
                ].map((p) => (
                  <div key={p.val} className="choice-item">
                    <input
                      type="radio"
                      id={`permis-${p.val}`}
                      name="typePermis"
                      value={p.val}
                      checked={formData.typePermis === p.val}
                      onChange={handleChange}
                    />
                    <label htmlFor={`permis-${p.val}`} className="choice-label">{p.label}</label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel} disabled={submitting}>
            Annuler
          </button>
          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? (
              <>
                <FaSpinner className="spin" /> Enregistrement...
              </>
            ) : (
              'Ajouter le véhicule'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}