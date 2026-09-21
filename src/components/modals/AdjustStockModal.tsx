import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, AlertCircle, Building2 } from 'lucide-react';
import { ProductReference, Store, StoreStockItem } from '../../types';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductReference[];
  stores: Store[];
  storeStocks: StoreStockItem[];
  storeId: string;
  productId: string;
  onSubmit: (params: {
    storeId: string;
    productId: string;
    sizeQuantities: Record<string, number>;
    reason: string;
    operator: string;
  }) => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  isOpen,
  onClose,
  products,
  stores,
  storeStocks,
  storeId,
  productId,
  onSubmit,
}) => {
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('Comptage physique d\'inventaire');
  const [operator, setOperator] = useState('Responsable Magasin');
  const [errorMsg, setErrorMsg] = useState('');

  const currentStore = stores.find(s => s.id === storeId);
  const currentProduct = products.find(p => p.id === productId);

  useEffect(() => {
    if (isOpen && currentStore && currentProduct) {
      setErrorMsg('');
      const currentStock = storeStocks.find(
        s => s.storeId === storeId && s.productId === productId
      );

      const init: Record<string, number> = {};
      currentProduct.sizes.forEach(sz => {
        init[sz] = currentStock?.sizeQuantities[sz] || 0;
      });
      setSizeQuantities(init);
    }
  }, [isOpen, storeId, productId, currentStore, currentProduct, storeStocks]);

  if (!isOpen || !currentStore || !currentProduct) return null;

  const handleSizeChange = (sz: string, val: number) => {
    const safe = Math.max(0, val);
    setSizeQuantities(prev => ({
      ...prev,
      [sz]: safe,
    }));
  };

  const totalNewQuantity = Object.values(sizeQuantities).reduce((a, b) => a + (Number(b) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Veuillez préciser le motif de l\'ajustement.');
      return;
    }

    onSubmit({
      storeId,
      productId,
      sizeQuantities,
      reason: reason.trim(),
      operator: operator || 'Responsable Magasin',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Ajustement d'Inventaire
              </h3>
              <p className="text-xs text-slate-400">
                {currentStore.name} • {currentProduct.reference}
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

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
            <p className="text-xs text-slate-400">Article :</p>
            <p className="text-sm font-bold text-white">
              {currentProduct.reference} — {currentProduct.name}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Boutique : <strong className="text-slate-200">{currentStore.name} ({currentStore.city})</strong>
            </p>
          </div>

          {/* Size Adjustment Inputs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Nouvelles quantités réelles constatées :
              </label>
              <span className="text-xs font-mono font-bold text-blue-400">
                Nouveau Total : {totalNewQuantity} pcs
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
                        onClick={() => handleSizeChange(sz, qty - 1)}
                        className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) => handleSizeChange(sz, parseInt(e.target.value) || 0)}
                        className="w-10 text-center bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono font-bold py-1 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSizeChange(sz, qty + 1)}
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

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Motif de l'ajustement *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Comptage physique d'inventaire">Comptage physique d'inventaire</option>
              <option value="Vente non synchronisée">Vente directe non synchronisée</option>
              <option value="Démarque inconnue / Vol">Démarque inconnue / Vol</option>
              <option value="Article défectueux / Retiré de la vente">Article défectueux / Retiré</option>
              <option value="Correction d'erreur de saisie">Correction d'erreur de saisie</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Responsable de la validation
            </label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="Nom du responsable"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
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
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              Enregistrer l'Ajustement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
