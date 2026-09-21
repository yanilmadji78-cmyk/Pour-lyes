import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Barcode, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  TrendingDown, 
  ArrowRightLeft, 
  Plus, 
  SlidersHorizontal,
  Package,
  Building,
  Sparkles,
  Send,
  X
} from 'lucide-react';
import { ProductReference, Store, StoreStockItem, DistributionSearchResult } from '../types';

interface ReferenceSearchSectionProps {
  products: ProductReference[];
  stores: Store[];
  selectedReference: string;
  onSelectReference: (ref: string) => void;
  distributionResult: DistributionSearchResult | null;
  onDistributeToStore: (productId: string, storeId: string) => void;
  onTransferFromStore: (productId: string, fromStoreId: string) => void;
  onAdjustStock: (storeId: string, productId: string) => void;
}

export const ReferenceSearchSection: React.FC<ReferenceSearchSectionProps> = ({
  products,
  stores,
  selectedReference,
  onSelectReference,
  distributionResult,
  onDistributeToStore,
  onTransferFromStore,
  onAdjustStock,
}) => {
  const [searchInput, setSearchInput] = useState(selectedReference || '');
  const [filterStatus, setFilterStatus] = useState<'all' | 'optimal' | 'low' | 'out_of_stock'>('all');
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  // Sync internal search input if external selectedReference changes
  React.useEffect(() => {
    if (selectedReference) {
      setSearchInput(selectedReference);
    }
  }, [selectedReference]);

  // Autocomplete matching products based on current search input
  const searchSuggestions = useMemo(() => {
    if (!searchInput.trim()) return [];
    const q = searchInput.trim().toUpperCase();
    return products.filter(
      p => p.reference.toUpperCase().includes(q) || 
           p.name.toUpperCase().includes(q) ||
           p.barcode.includes(q)
    ).slice(0, 6);
  }, [searchInput, products]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;
    onSelectReference(searchInput.trim());
  };

  const handlePickProduct = (ref: string) => {
    setSearchInput(ref);
    onSelectReference(ref);
  };

  const handleSimulateScan = () => {
    setIsSimulatingScan(true);
    // Pick a random product barcode
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    setTimeout(() => {
      setIsSimulatingScan(false);
      setSearchInput(randomProduct.reference);
      onSelectReference(randomProduct.reference);
    }, 600);
  };

  // Filter distributed stores by status if needed
  const filteredDistributedStores = useMemo(() => {
    if (!distributionResult) return [];
    if (filterStatus === 'all') return distributionResult.distributedStores;
    return distributionResult.distributedStores.filter(item => item.status === filterStatus);
  }, [distributionResult, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Search Input Banner */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 sm:p-7 shadow-xl shadow-slate-950/40 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Recherche Instantanée Référence & Magasins
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              Où est distribué votre vêtement ?
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Saisissez la référence du produit ou scannez son code-barres pour afficher en temps réel tous les magasins approvisionnés.
            </p>
          </div>

          {/* Main Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-4 text-slate-400 pointer-events-none">
                <Search className="w-5 h-5 text-indigo-400" />
              </div>

              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Exemple: REF-ROB-042, REF-VES-108, ou nom de l'article..."
                className="w-full pl-12 pr-32 py-3.5 bg-slate-900/90 border-2 border-indigo-500/40 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 text-white placeholder-slate-400 rounded-xl text-base font-medium shadow-inner transition-all"
              />

              <div className="absolute right-2 flex items-center space-x-1.5">
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      onSelectReference('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors"
                    title="Effacer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSimulateScan}
                  disabled={isSimulatingScan}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold hover:text-white transition-colors cursor-pointer"
                  title="Simuler un scan de code-barres"
                >
                  <Barcode className="w-4 h-4 text-emerald-400" />
                  <span>{isSimulatingScan ? 'Scan...' : 'Scanner'}</span>
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Chercher
                </button>
              </div>
            </div>

            {/* Autocomplete Dropdown */}
            {searchSuggestions.length > 0 && searchInput.trim() !== selectedReference && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800">
                <div className="px-3 py-1.5 bg-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Suggestions de références trouvées
                </div>
                {searchSuggestions.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handlePickProduct(prod.reference)}
                    className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-indigo-950/40 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 group-hover:border-indigo-400">
                        {prod.reference}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-white">{prod.name}</p>
                        <p className="text-xs text-slate-400">{prod.category} • {prod.color}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-mono">Central: {prod.centralStock} pcs</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Quick clickable chips for demo references */}
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <span className="text-slate-400 text-xs font-medium mr-1">Exemples rapides :</span>
            {products.slice(0, 5).map((p) => (
              <button
                key={p.id}
                onClick={() => handlePickProduct(p.reference)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  selectedReference === p.reference
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {p.reference} <span className="opacity-70 font-sans">({p.name.split(' ')[0]})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RESULT DISPLAY */}
      {distributionResult ? (
        <div className="space-y-6">
          {/* Product Overview Card */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-indigo-900/60 to-slate-900 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
                  <Package className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-xs sm:text-sm font-extrabold px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      {distributionResult.product.reference}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700/80 text-slate-300 border border-slate-600">
                      {distributionResult.product.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 font-mono">
                      EAN: {distributionResult.product.barcode}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {distributionResult.product.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Couleur : <span className="text-white font-medium">{distributionResult.product.color}</span> • Matière : <span className="text-slate-300">{distributionResult.product.material}</span> • Saison : <span className="text-slate-300">{distributionResult.product.season}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="text-xs text-slate-400 mr-1">Tailles disponibles :</span>
                    {distributionResult.product.sizes.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-slate-700 text-slate-200 text-xs font-semibold rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Central vs Network stock stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t lg:border-t-0 lg:border-l border-slate-700 pt-4 lg:pt-0 lg:pl-6 shrink-0">
                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/60">
                  <p className="text-[11px] text-slate-400 font-medium">Stock Entrepôt Central</p>
                  <p className="text-xl font-extrabold text-amber-400 font-mono mt-0.5">
                    {distributionResult.product.centralStock} <span className="text-xs font-normal text-slate-400">pièces</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Prêt à être expédié</p>
                </div>

                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/60">
                  <p className="text-[11px] text-slate-400 font-medium">Distribué en Magasins</p>
                  <p className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
                    {distributionResult.totalStockInStores} <span className="text-xs font-normal text-slate-400">pièces</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Sur {distributionResult.totalDistributedStoresCount} magasin(s)</p>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-slate-900/60 rounded-xl p-3 border border-slate-700/60">
                  <p className="text-[11px] text-slate-400 font-medium">Prix Conseillé</p>
                  <p className="text-xl font-extrabold text-slate-100 font-mono mt-0.5">
                    {distributionResult.product.unitRetailPrice.toFixed(2)} €
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Coût : {distributionResult.product.unitCostPrice.toFixed(2)} €</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: STORES WHERE THIS PRODUCT WAS DISTRIBUTED */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-400" />
                  Magasins où cette référence est distribuée ({distributionResult.distributedStores.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Points de vente ayant reçu cette référence avec état des stocks en temps réel
                </p>
              </div>

              {/* Status Filters */}
              <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tous ({distributionResult.distributedStores.length})
                </button>
                <button
                  onClick={() => setFilterStatus('optimal')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    filterStatus === 'optimal' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  En Stock
                </button>
                <button
                  onClick={() => setFilterStatus('low')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    filterStatus === 'low' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Faible
                </button>
                <button
                  onClick={() => setFilterStatus('out_of_stock')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    filterStatus === 'out_of_stock' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Rupture
                </button>
              </div>
            </div>

            {/* List of Distributed Stores Cards */}
            {filteredDistributedStores.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-8 text-center">
                <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-300 font-semibold">Aucun magasin ne correspond à ce filtre.</p>
                <p className="text-xs text-slate-500 mt-1">Modifiez le filtre d'état de stock ci-dessus.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDistributedStores.map(({ store, stock, status }) => {
                  const isOutOfStock = status === 'out_of_stock';
                  const isLow = status === 'low';

                  return (
                    <div
                      key={store.id}
                      className={`rounded-xl border p-5 transition-all shadow-md relative overflow-hidden ${
                        isOutOfStock
                          ? 'bg-rose-950/20 border-rose-800/40'
                          : isLow
                          ? 'bg-amber-950/20 border-amber-800/40'
                          : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      {/* Top Row: Store Name & Status Badge */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white tracking-tight">{store.name}</h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 uppercase">
                              {store.type}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-slate-400 gap-1.5 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{store.city} ({store.postalCode}) • {store.address}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Rupture de Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <TrendingDown className="w-3.5 h-3.5" />
                              Stock Faible ({stock.totalQuantity})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              En Stock ({stock.totalQuantity})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stock Quantity Highlight & Size Breakdown */}
                      <div className="bg-slate-900/70 rounded-lg p-3 border border-slate-800 my-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400 font-medium">Répartition par taille en boutique :</span>
                          <span className="text-xs font-bold font-mono text-white">
                            Total : <span className={isOutOfStock ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}>{stock.totalQuantity} pièces</span>
                          </span>
                        </div>

                        {/* Sizes Grid */}
                        <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
                          {distributionResult.product.sizes.map((size) => {
                            const qty = stock.sizeQuantities[size] || 0;
                            return (
                              <div
                                key={size}
                                className={`text-center p-1.5 rounded border text-xs ${
                                  qty === 0
                                    ? 'bg-slate-800/40 border-slate-800 text-slate-500'
                                    : 'bg-slate-800 border-slate-700 text-slate-200'
                                }`}
                              >
                                <span className="block text-[10px] text-slate-400 uppercase font-semibold">{size}</span>
                                <span className={`font-mono font-bold ${qty === 0 ? 'text-slate-600' : 'text-white'}`}>
                                  {qty}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Store Meta & Last Restock Date */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 mb-3">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>Resp : {store.manager}</span>
                          <span className="mx-1 text-slate-600">•</span>
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{store.phone}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Dernier arrivage : {new Date(stock.lastRestockedAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>

                      {/* Quick Actions on this Store */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => onDistributeToStore(distributionResult.product.id, store.id)}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Réapprovisionner</span>
                        </button>

                        <button
                          onClick={() => onTransferFromStore(distributionResult.product.id, store.id)}
                          disabled={stock.totalQuantity <= 0}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                            stock.totalQuantity <= 0
                              ? 'bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed'
                              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                          }`}
                          title="Transférer une partie de ce stock vers une autre boutique"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                          <span>Transférer</span>
                        </button>

                        <button
                          onClick={() => onAdjustStock(store.id, distributionResult.product.id)}
                          className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                          title="Corriger l'inventaire en boutique"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: UNDISTRIBUTED STORES FOR THIS REFERENCE */}
          {distributionResult.undistributedStores.length > 0 && (
            <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded-xl p-5">
              <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-1">
                <Building className="w-4 h-4 text-slate-400" />
                Magasins n'ayant pas encore reçu cette référence ({distributionResult.undistributedStores.length})
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Ces points de vente n'ont actuellement aucun stock pour {distributionResult.product.reference}. Vous pouvez leur envoyer un premier lot dès maintenant.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {distributionResult.undistributedStores.map((store) => (
                  <div
                    key={store.id}
                    className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{store.name}</p>
                      <p className="text-[11px] text-slate-400">{store.city} • {store.type}</p>
                    </div>

                    <button
                      onClick={() => onDistributeToStore(distributionResult.product.id, store.id)}
                      className="px-2.5 py-1.5 rounded-md bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Distribuer</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : selectedReference ? (
        /* Reference entered but not found */
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-10 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Référence "{selectedReference}" introuvable</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Aucun vêtement ne correspond exactement à ce code. Vérifiez la saisie ou sélectionnez une référence parmi le catalogue ci-dessous.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => onSelectReference('REF-ROB-042')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              Afficher REF-ROB-042 (Exemple)
            </button>
          </div>
        </div>
      ) : (
        /* Empty search state: guide the user */
        <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white font-display">
            Entrez une référence d'habillement pour voir sa distribution
          </h3>
          <p className="text-sm text-slate-300 max-w-lg mx-auto mt-2 leading-relaxed">
            Tapez la référence d'un modèle (ex: <code className="text-indigo-300 font-mono bg-indigo-950/60 px-1.5 py-0.5 rounded">REF-ROB-042</code> ou <code className="text-indigo-300 font-mono bg-indigo-950/60 px-1.5 py-0.5 rounded">REF-VES-108</code>) pour consulter instantanément les points de vente où il a été envoyé, les quantités par taille et les stocks disponibles.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePickProduct(p.reference)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                <span className="font-mono font-bold text-indigo-300">{p.reference}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
