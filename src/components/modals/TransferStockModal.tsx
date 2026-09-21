import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, AlertCircle, Building2 } from 'lucide-react';
import { ProductReference, Store, StoreStockItem } from '../../types';

interface TransferStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductReference[];
  stores: Store[];
  storeStocks: StoreStockItem[];
  initialProductId?: string;
  initialFromStoreId?: string;
  onSubmit: (params: {
    productId: string;
    fromStoreId: string;
    toStoreId: string;
    sizeQuantities: Record<string, number>;
    note?: string;
    operator: string;
  }) => void;
}

export const TransferStockModal: React.FC<TransferStockModalProps> = ({
  isOpen,
  onClose,
  products,
  stores,
  storeStocks,
  initialProductId,
  initialFromStoreId,
  onSubmit,
}) => {
  const [productId, setProductId] = useState('');
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  const [operator, setOperator] = useState('Responsable Réseau');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const pId = initialProductId || (products[0]?.id || '');
      const fId = initialFromStoreId || (stores[0]?.id || '');
      const tId = stores.find(s => s.id !== fId)?.id || '';

      setProductId(pId);
      setFromStoreId(fId);
      setToStoreId(tId);
      setErrorMsg('');
      setNote('');

      // Init quantities
      const prod = products.find(p => p.id === pId);
      if (prod) {
        const initSizes: Record<string, number> = {};
        prod.sizes.forEach(s => {
          initSizes[s] = 0;
        });
        setSizeQuantities(initSizes);
      }
    }
  }, [isOpen, initialProductId, initialFromStoreId, products, stores]);

  if (!isOpen) return null;

  const currentProduct = products.find(p => p.id === productId);
  const sourceStore = stores.find(s => s.id === fromStoreId);
  const targetStore = stores.find(s => s.id === toStoreId);

  // Find source store's current stock
  const sourceStock = storeStocks.find(
    s => s.storeId === fromStoreId && s.productId === productId
  );

  const handleQuantityChange = (size: string, value: number) => {
    const maxAvailable = sourceStock?.sizeQuantities[size] || 0;
    const safeVal = Math.min(Math.max(0, value), maxAvailable);
    setSizeQuantities(prev => ({
      ...prev,
      [size]: safeVal,
    }));
  };

  const totalTransfer = Object.values(sizeQuantities).reduce((a, b) => a + (Number(b) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!productId || !fromStoreId || !toStoreId) {
      setErrorMsg('Veuillez sélectionner le vêtement et les deux magasins.');
      return;
    }

    if (fromStoreId === toStoreId) {
      setErrorMsg('Le magasin d\'origine et le magasin de destination doivent être différents.');
      return;
    }

    if (totalTransfer <= 0) {
      setErrorMsg('Veuillez saisir au moins 1 pièce à transférer.');
      return;
    }

    onSubmit({
      productId,
      fromStoreId,
      toStoreId,
      sizeQuantities,
      note,
      operator: operator || 'Responsable Réseau',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Transfert Inter-Magasins
              </h3>
              <p className="text-xs text-slate-400">
                Déplacer des pièces d'un magasin vers un autre point de vente
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
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const prod = products.find(p => p.id === e.target.value);
                if (prod) {
                  const init: Record<string, number> = {};
                  prod.sizes.forEach(s => { init[s] = 0; });
                  setSizeQuantities(init);
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference} — {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stores Origin & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Magasin Source (Départ) *
              </label>
              <select
                value={fromStoreId}
                onChange={(e) => setFromStoreId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Magasin Cible (Arrivée) *
              </label>
              <select
                value={toStoreId}
                onChange={(e) => setToStoreId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.id === fromStoreId}>
                    {s.name} ({s.city}) {s.id === fromStoreId ? '(Actuel)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Available stock in source */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-300">
              Stock disponible chez <strong className="text-white">{sourceStore?.name}</strong> :
            </span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {sourceStock?.totalQuantity || 0} pièces
            </span>
          </div>

          {/* Size Transfer Inputs */}
          {currentProduct && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Unités à transférer par taille :
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  Total transfert : {totalTransfer} pcs
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {currentProduct.sizes.map((sz) => {
                  const available = sourceStock?.sizeQuantities[sz] || 0;
                  const qty = sizeQuantities[sz] || 0;

                  return (
                    <div key={sz} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-center">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-1">
                        <span className="uppercase">{sz}</span>
                        <span className="text-slate-500 font-mono">Dispo: {available}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          disabled={qty <= 0}
                          onClick={() => handleQuantityChange(sz, qty - 1)}
                          className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={available}
                          value={qty}
                          onChange={(e) => handleQuantityChange(sz, parseInt(e.target.value) || 0)}
                          className="w-10 text-center bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono font-bold py-1 focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={qty >= available}
                          onClick={() => handleQuantityChange(sz, qty + 1)}
                          className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
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

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Motif du Transfert
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Demande client express, équilibrage des stocks régionaux..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
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
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all cursor-pointer"
            >
              Confirmer le Transfert ({totalTransfer} pcs)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
