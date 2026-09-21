import React, { useState } from 'react';
import { X, Plus, Shirt, Barcode, Sparkles, AlertCircle } from 'lucide-react';
import { ClothingCategory, ProductReference } from '../../types';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Omit<ProductReference, 'id' | 'createdAt'>) => void;
}

const CATEGORIES: ClothingCategory[] = [
  'Robes',
  'Costumes & Blazers',
  'Pantalons & Jeans',
  'Chemises & Hauts',
  'Mailles & Pulls',
  'Vestes & Manteaux',
  'Jupes & Shorts',
  'Accessoires'
];

const STANDARD_SIZE_PRESETS = [
  { label: 'Standard Lettres (XS-XL)', sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { label: 'Standard Lettres Étendu (XS-XXL)', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { label: 'Pantalons / Vêtements 36-44', sizes: ['36', '38', '40', '42', '44'] },
  { label: 'Chemises Homme (38-43)', sizes: ['38', '39', '40', '41', '42', '43'] },
  { label: 'Taille Unique', sizes: ['TU'] },
];

export const NewProductModal: React.FC<NewProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [reference, setReference] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('Robes');
  const [season, setSeason] = useState('Printemps-Été 2025');
  const [color, setColor] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['XS', 'S', 'M', 'L', 'XL']);
  const [unitCostPrice, setUnitCostPrice] = useState<number>(25);
  const [unitRetailPrice, setUnitRetailPrice] = useState<number>(75);
  const [centralStock, setCentralStock] = useState<number>(50);
  const [material, setMaterial] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGenerateBarcode = () => {
    const randomEan = '3760' + Math.floor(100000000 + Math.random() * 900000000).toString();
    setBarcode(randomEan);
  };

  const handleGenerateReference = () => {
    const prefixMap: Record<ClothingCategory, string> = {
      'Robes': 'ROB',
      'Costumes & Blazers': 'VES',
      'Pantalons & Jeans': 'PAN',
      'Chemises & Hauts': 'CHM',
      'Mailles & Pulls': 'PUL',
      'Vestes & Manteaux': 'MAN',
      'Jupes & Shorts': 'JUP',
      'Accessoires': 'ACC',
    };
    const prefix = prefixMap[category] || 'TEX';
    const num = Math.floor(100 + Math.random() * 900);
    setReference(`REF-${prefix}-${num}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reference.trim() || !name.trim()) {
      setErrorMsg('La référence et le nom de l\'article sont obligatoires.');
      return;
    }

    if (selectedSizes.length === 0) {
      setErrorMsg('Veuillez sélectionner au moins une taille.');
      return;
    }

    onSubmit({
      reference: reference.trim().toUpperCase(),
      barcode: barcode.trim() || '3760' + Date.now().toString().slice(-9),
      name: name.trim(),
      category,
      season,
      color: color.trim() || 'Multicolore',
      sizes: selectedSizes,
      unitCostPrice: Number(unitCostPrice) || 0,
      unitRetailPrice: Number(unitRetailPrice) || 0,
      centralStock: Number(centralStock) || 0,
      material: material.trim() || '100% Coton',
      description: description.trim() || name.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Ajouter une Référence d'Habillement
              </h3>
              <p className="text-xs text-slate-400">
                Enregistrer un nouveau vêtement dans la base de données centrale
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Reference & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Référence Unique *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateReference}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Générer code
                </button>
              </div>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: REF-ROB-042"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Code-barres EAN-13
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <Barcode className="w-3 h-3" />
                  Auto EAN
                </button>
              </div>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Ex: 3760128490012"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nom du Modèle / Article *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Robe Portefeuille Fleurie"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Catégorie Textile *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ClothingCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color & Material */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Couleur
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ex: Bleu Indigo, Bordeaux..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Matière / Composition
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="Ex: 100% Coton Biologique"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Saison
              </label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="Ex: Printemps-Été 2025"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Sizes Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Grille de Tailles Disponibles :
              </label>
              <div className="flex gap-1">
                {STANDARD_SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSelectedSizes(preset.sizes)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    {preset.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL', '34', '36', '38', '40', '42', '44', '46', 'TU'].map((sz) => {
                const isSelected = selectedSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSizes(selectedSizes.filter(s => s !== sz));
                      } else {
                        setSelectedSizes([...selectedSizes, sz]);
                      }
                    }}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing & Central Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Stock Central Initial (pcs)
              </label>
              <input
                type="number"
                min="0"
                value={centralStock}
                onChange={(e) => setCentralStock(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-400 font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Prix de Revient (€ HT)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={unitCostPrice}
                onChange={(e) => setUnitCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Prix Public Conseillé (€ TTC)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={unitRetailPrice}
                onChange={(e) => setUnitRetailPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Enregistrer la Référence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
