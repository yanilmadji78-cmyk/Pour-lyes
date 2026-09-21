import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  Search, 
  ArrowRightLeft, 
  Plus, 
  ExternalLink,
  DollarSign,
  Package
} from 'lucide-react';
import { Store, ProductReference, StoreStockItem } from '../types';

interface StoresOverviewSectionProps {
  stores: Store[];
  products: ProductReference[];
  storeStocks: StoreStockItem[];
  onSelectReference: (ref: string) => void;
  onDistributeToStore: (productId: string, storeId: string) => void;
  onAdjustStock: (storeId: string, productId: string) => void;
  onOpenNewStore: () => void;
}

export const StoresOverviewSection: React.FC<StoresOverviewSectionProps> = ({
  stores,
  products,
  storeStocks,
  onSelectReference,
  onDistributeToStore,
  onAdjustStock,
  onOpenNewStore,
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || '');
  const [searchFilter, setSearchFilter] = useState('');
  const [filterAlertsOnly, setFilterAlertsOnly] = useState(false);

  // Active store object
  const activeStore = useMemo(() => {
    return stores.find(s => s.id === selectedStoreId) || stores[0];
  }, [stores, selectedStoreId]);

  // Stocks for active store
  const activeStoreStocks = useMemo(() => {
    if (!activeStore) return [];
    const rawStocks = storeStocks.filter(s => s.storeId === activeStore.id);

    return rawStocks.map(stock => {
      const product = products.find(p => p.id === stock.productId);
      let status: 'optimal' | 'low' | 'out_of_stock' = 'optimal';
      if (stock.totalQuantity === 0) status = 'out_of_stock';
      else if (stock.totalQuantity <= stock.minThreshold) status = 'low';

      return {
        stock,
        product,
        status,
      };
    }).filter(item => {
      if (!item.product) return false;
      if (filterAlertsOnly && item.status === 'optimal') return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        return (
          item.product.reference.toLowerCase().includes(q) ||
          item.product.name.toLowerCase().includes(q) ||
          item.product.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeStore, storeStocks, products, filterAlertsOnly, searchFilter]);

  // Aggregate metrics for active store
  const storeMetrics = useMemo(() => {
    if (!activeStore) return { totalItems: 0, totalValue: 0, alertCount: 0, refCount: 0 };
    const rawStocks = storeStocks.filter(s => s.storeId === activeStore.id);

    let totalItems = 0;
    let totalValue = 0;
    let alertCount = 0;

    for (const s of rawStocks) {
      totalItems += s.totalQuantity;
      const p = products.find(prod => prod.id === s.productId);
      if (p) {
        totalValue += s.totalQuantity * p.unitRetailPrice;
      }
      if (s.totalQuantity <= s.minThreshold) {
        alertCount++;
      }
    }

    return {
      totalItems,
      totalValue,
      alertCount,
      refCount: rawStocks.length,
    };
  }, [activeStore, storeStocks, products]);

  return (
    <div className="space-y-6">
      {/* Top Controls: Store Selector Tabs / Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1">
            Points de Vente :
          </span>
          {stores.map((s) => {
            const hasAlerts = storeStocks.some(
              st => st.storeId === s.id && st.totalQuantity <= st.minThreshold
            );
            const isSelected = selectedStoreId === s.id;

            return (
              <button
                key={s.id}
                onClick={() => setSelectedStoreId(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <span>{s.city}</span>
                <span className="text-[11px] opacity-75">({s.name.split(' ')[1] || s.type})</span>
                {hasAlerts && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Alertes stock faible" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={onOpenNewStore}
          className="self-end lg:self-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Nouveau Point de Vente</span>
        </button>
      </div>

      {activeStore && (
        <>
          {/* Active Store Header & Profile */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
                    {activeStore.name}
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                    {activeStore.type}
                  </span>
                  <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-700/60">
                    Code: {activeStore.code}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-xs text-slate-300 mt-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{activeStore.address}, {activeStore.postalCode} {activeStore.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Responsable : <strong className="text-white font-medium">{activeStore.manager}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{activeStore.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{activeStore.email}</span>
                  </div>
                </div>
              </div>

              {/* Store Metrics Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-700 pt-4 lg:pt-0 lg:pl-6">
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80">
                  <p className="text-[11px] text-slate-400 font-medium">Pièces en Rayon</p>
                  <p className="text-xl font-extrabold text-white font-mono mt-0.5">
                    {storeMetrics.totalItems} <span className="text-xs font-normal text-slate-400">pcs</span>
                  </p>
                  <p className="text-[10px] text-slate-500">{storeMetrics.refCount} références actives</p>
                </div>

                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80">
                  <p className="text-[11px] text-slate-400 font-medium">Valeur Marchande</p>
                  <p className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
                    {storeMetrics.totalValue.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} €
                  </p>
                  <p className="text-[10px] text-slate-500">Prix public TTC</p>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-slate-900/70 p-3 rounded-xl border border-slate-700/80">
                  <p className="text-[11px] text-slate-400 font-medium">Alertes Réassort</p>
                  <p className={`text-xl font-extrabold font-mono mt-0.5 ${storeMetrics.alertCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {storeMetrics.alertCount}
                  </p>
                  <p className="text-[10px] text-slate-500">Stock ≤ seuil min</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters inside this store */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrer une référence ou article..."
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
              <button
                onClick={() => setFilterAlertsOnly(!filterAlertsOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                  filterAlertsOnly
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Afficher uniquement les alertes stock</span>
              </button>
            </div>
          </div>

          {/* Inventory Table for this store */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Référence & Article</th>
                    <th className="py-3 px-3">Catégorie</th>
                    <th className="py-3 px-3">Détail par Taille</th>
                    <th className="py-3 px-3 text-center">Quantité Magasin</th>
                    <th className="py-3 px-3 text-center">Statut</th>
                    <th className="py-3 px-3">Dernier Réassort</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {activeStoreStocks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Aucun article correspondant dans cette boutique.
                      </td>
                    </tr>
                  ) : (
                    activeStoreStocks.map(({ stock, product, status }) => {
                      if (!product) return null;
                      const isOutOfStock = status === 'out_of_stock';
                      const isLow = status === 'low';

                      return (
                        <tr key={stock.id} className="hover:bg-slate-750/50 transition-colors">
                          {/* Reference & Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <button
                                onClick={() => onSelectReference(product.reference)}
                                className="font-mono font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                                title="Voir la distribution globale de cette référence"
                              >
                                {product.reference}
                              </button>
                              <span className="text-slate-300 font-medium">{product.name}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{product.color} • {product.season}</p>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 text-[11px]">
                              {product.category}
                            </span>
                          </td>

                          {/* Size breakdown */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              {product.sizes.map((sz) => {
                                const qty = stock.sizeQuantities[sz] || 0;
                                return (
                                  <span
                                    key={sz}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                      qty > 0 ? 'bg-slate-700 text-white font-bold' : 'bg-slate-800 text-slate-600'
                                    }`}
                                  >
                                    {sz}:{qty}
                                  </span>
                                );
                              })}
                            </div>
                          </td>

                          {/* Total Quantity */}
                          <td className="py-3 px-3 text-center">
                            <span className={`font-mono text-sm font-bold ${
                              isOutOfStock ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {stock.totalQuantity}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3 text-center">
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Rupture
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Faible
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Optimal
                              </span>
                            )}
                          </td>

                          {/* Last Restocked */}
                          <td className="py-3 px-3 text-slate-400 text-[11px]">
                            {new Date(stock.lastRestockedAt).toLocaleDateString('fr-FR')}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => onDistributeToStore(product.id, activeStore.id)}
                                className="px-2 py-1 bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Réapprovisionner depuis l'entrepôt central"
                              >
                                + Envoi
                              </button>
                              <button
                                onClick={() => onAdjustStock(activeStore.id, product.id)}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-[11px] font-medium transition-colors cursor-pointer"
                                title="Ajuster l'inventaire en boutique"
                              >
                                Ajuster
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
