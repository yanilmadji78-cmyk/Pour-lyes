import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle, Package, Building2 } from 'lucide-react';
import { ProductReference, Store } from '../../types';

interface NewDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductReference[];
  stores: Store[];
  initialProductId?: string;
  initialStoreId?: string;
  onSubmit: (params: {
    productId: string;
    storeId: string;
    sizeQuantities: Record<string, number>;
    note?: string;
    operator: string;
  }) => void;
}

export const NewDistributionModal: React.FC<NewDistributionModalProps> = ({
  isOpen,
  onClose,
  products,
  stores,
  initialProductId,
  initialStoreId,
  onSubmit,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  const [operator, setOperator] = useState('Responsable Logistique');
  const [errorMsg, setErrorMsg] = useState('');

  // When modal opens or initial IDs change, initialize state
  useEffect(() => {
    if (isOpen) {
      const prodId = initialProductId || (products[0]?.id || '');
      const strId = initialStoreId || (stores[0]?.id || '');
      setSelectedProductId(prodId);
      setSelectedStoreId(strId);
      setNote('');
      setErrorMsg('');

      // Initialize sizes
      const prod = products.find(p => p.id === prodId);
      if (prod) {
        const initSizes: Record<string, number> = {};
        prod.sizes.forEach(s => {
          initSizes[s] = 0;
        });
        setSizeQuantities(initSizes);
      }
    }
  }, [isOpen, initialProductId, initialStoreId, products, stores]);

  if (!isOpen) return null;

  const currentProduct = products.find(p => p.id === selectedProductId);
  const currentStore = stores.find(s => s.id === selectedStoreId);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    setErrorMsg('');
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      const initSizes: Record<string, number> = {};
      prod.sizes.forEach(s => {
        initSizes[s] = 0;
      });
      setSizeQuantities(initSizes);
    }
  };

  const handleQuantityChange = (size: string, value: number) => {
    const safeVal = Math.max(0, value);
    setSizeQuantities(prev => ({
      ...prev,
      [size]: safeVal,
    }));
  };

  const totalQuantity = Object.values(sizeQuantities).reduce((a, b) => a + (Number(b) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedProductId || !selectedStoreId) {
      setErrorMsg('Veuillez sélectionner un vêtement et un magasin.');
      return;
    }

    if (totalQuantity <= 0) {
      setErrorMsg('Veuillez saisir au moins 1 pièce à distribuer.');
      return;
    }

    if (currentProduct && totalQuantity > currentProduct.centralStock) {
      setErrorMsg(
        `Stock central insuffisant (${currentProduct.centralStock} disponible(s), ${totalQuantity} sélectionné(s)).`
      );
      return;
    }

    onSubmit({
      productId: selectedProductId,
      storeId: selectedStoreId,
      sizeQuantities,
      note,
      operator: operator || 'Responsable Approvisionnement',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Nouvelle Distribution / Expédition
              </h3>
              <p className="text-xs text-slate-400">
                Transférer du stock de l'Entrepôt Central vers une boutique
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Référence du Vêtement *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference} — {p.name} (Stock central : {p.centralStock} pcs)
                </option>
              ))}
            </select>
          </div>

          {/* Target Store Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Magasin Destinataire *
            </label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city}) — {s.type}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Central Summary Notice */}
          {currentProduct && (
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-300">
                Stock entrepôt central disponible :
              </span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {currentProduct.centralStock} pièces
              </span>
            </div>
          )}

          {/* Size Quantities Inputs */}
          {currentProduct && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Répartition par Taille :
                </label>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Total sélectionné : {totalQuantity} pcs
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {currentProduct.sizes.map((sz) => {
                  const qty = sizeQuantities[sz] || 0;
                  return (
                    <div key={sz} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-center">
                      <span className="block text-xs text-slate-400 font-semibold mb-1 uppercase">
                        {sz}
                      </span>
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(sz, qty - 1)}
                          className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={(e) => handleQuantityChange(sz, parseInt(e.target.value) || 0)}
                          className="w-10 text-center bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono font-bold py-1 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(sz, qty + 1)}
                          className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Operator and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Opérateur / Responsable
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Nom du logisticien"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Note de livraison
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Réassort capsule, commande client..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
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
              Valider l'Expédition ({totalQuantity} pcs)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
