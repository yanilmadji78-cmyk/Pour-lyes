import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Store as StoreIcon, 
  Tag, 
  Trash2, 
  Edit3, 
  Check, 
  Download, 
  RotateCcw, 
  Building2, 
  Package, 
  MapPin, 
  Calendar,
  CheckCircle2,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { ProductReference, Store, StoreStockItem } from '../types';
import { StorageService } from '../services/storage';

interface SimpleDistributionManagerProps {
  products: ProductReference[];
  stores: Store[];
  storeStocks: StoreStockItem[];
  onDataChanged: () => void;
  onShowMessage: (msg: string, type?: 'success' | 'error') => void;
}

export const SimpleDistributionManager: React.FC<SimpleDistributionManagerProps> = ({
  products,
  stores,
  storeStocks,
  onDataChanged,
  onShowMessage,
}) => {
  // Formulaire principal de saisie
  const [inputRef, setInputRef] = useState('');
  const [inputProdName, setInputProdName] = useState('');
  const [inputStore, setInputStore] = useState('');
  const [inputQty, setInputQty] = useState<number>(10);
  const [inputNote, setInputNote] = useState('');

  // Barre de recherche et filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'by_ref' | 'by_store'>('by_ref');

  // État pour l'ajout rapide de magasin directement sur une référence
  const [quickAddStoreForRef, setQuickAddStoreForRef] = useState<string | null>(null);
  const [quickStoreName, setQuickStoreName] = useState('');
  const [quickStoreQty, setQuickStoreQty] = useState<number>(5);

  // État pour la modification en direct d'une quantité
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState<number>(0);

  // Auto-remplir le nom du produit si l'utilisateur saisit une référence existante
  const handleRefInputChange = (val: string) => {
    setInputRef(val);
    const found = products.find(p => p.reference.toUpperCase() === val.trim().toUpperCase());
    if (found && !inputProdName) {
      setInputProdName(found.name);
    }
  };

  // Soumission du formulaire principal
  const handleMainSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputRef.trim()) {
      onShowMessage('Veuillez saisir une référence de vêtement', 'error');
      return;
    }
    if (!inputStore.trim()) {
      onShowMessage('Veuillez taper le magasin destinataire', 'error');
      return;
    }

    const res = StorageService.recordDirectDistribution({
      reference: inputRef.trim(),
      productName: inputProdName.trim() || undefined,
      storeName: inputStore.trim(),
      quantity: inputQty > 0 ? inputQty : 1,
      note: inputNote.trim() || undefined,
    });

    if (res.success) {
      onShowMessage(res.message, 'success');
      setInputStore('');
      setInputNote('');
      setInputQty(10);
      onDataChanged();
    } else {
      onShowMessage(res.message, 'error');
    }
  };

  // Ajout rapide d'un magasin pour une référence déjà listée
  const handleQuickAddStore = (productReference: string) => {
    if (!quickStoreName.trim()) {
      onShowMessage('Veuillez taper le nom du magasin', 'error');
      return;
    }

    const res = StorageService.recordDirectDistribution({
      reference: productReference,
      storeName: quickStoreName.trim(),
      quantity: quickStoreQty > 0 ? quickStoreQty : 1,
    });

    if (res.success) {
      onShowMessage(`Magasin ${quickStoreName} ajouté pour la référence ${productReference}`, 'success');
      setQuickAddStoreForRef(null);
      setQuickStoreName('');
      setQuickStoreQty(5);
      onDataChanged();
    } else {
      onShowMessage(res.message, 'error');
    }
  };

  // Sauvegarder la modification d'une quantité
  const handleSaveQtyEdit = (storeId: string, productId: string) => {
    const res = StorageService.updateDistributionQuantity(storeId, productId, editingQty);
    if (res.success) {
      onShowMessage(res.message, 'success');
      setEditingStockId(null);
      onDataChanged();
    }
  };

  // Supprimer une distribution (retirer un magasin d'une référence)
  const handleDeleteDistribution = (storeId: string, productId: string, storeName: string, ref: string) => {
    if (window.confirm(`Retirer le magasin "${storeName}" pour la référence ${ref} ?`)) {
      const res = StorageService.removeDistribution(storeId, productId);
      if (res.success) {
        onShowMessage(`Distribution vers ${storeName} retirée`, 'success');
        onDataChanged();
      }
    }
  };

  // Supprimer complètement une référence
  const handleDeleteReference = (productId: string, ref: string) => {
    if (window.confirm(`Supprimer complètement la référence ${ref} et toutes ses distributions ?`)) {
      const res = StorageService.deleteProductReference(productId);
      if (res.success) {
        onShowMessage(`Référence ${ref} supprimée`, 'success');
        onDataChanged();
      }
    }
  };

  // Export CSV Excel
  const handleExportCSV = () => {
    const csvContent = StorageService.exportCSV();
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `distributions-habillement-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onShowMessage('Fichier Excel / CSV téléchargé avec succès', 'success');
  };

  // Structure des données regroupées par Référence
  const referenceData = useMemo(() => {
    return products.map(prod => {
      // Trouver tous les magasins où ce produit est distribué
      const prodStocks = storeStocks.filter(s => s.productId === prod.id && s.totalQuantity > 0);
      const distributedStoresList = prodStocks.map(stk => {
        const store = stores.find(s => s.id === stk.storeId);
        return {
          stock: stk,
          store: store || {
            id: stk.storeId,
            name: 'Magasin',
            city: 'France',
            address: '',
            postalCode: '',
            phone: '',
            manager: '',
            email: '',
            code: '',
            type: 'boutique' as const
          }
        };
      });

      const totalQuantity = distributedStoresList.reduce((sum, item) => sum + item.stock.totalQuantity, 0);

      return {
        product: prod,
        storesCount: distributedStoresList.length,
        totalQuantity,
        distributions: distributedStoresList,
      };
    });
  }, [products, stores, storeStocks]);

  // Structure des données regroupées par Magasin
  const storeData = useMemo(() => {
    return stores.map(store => {
      const thisStoreStocks = storeStocks.filter(s => s.storeId === store.id && s.totalQuantity > 0);
      const referencesList = thisStoreStocks.map(stk => {
        const prod = products.find(p => p.id === stk.productId);
        return {
          stock: stk,
          product: prod || {
            id: stk.productId,
            reference: stk.productReference,
            name: stk.productReference,
            centralStock: 0,
            unitCostPrice: 0,
            unitRetailPrice: 0,
            barcode: '',
            category: 'Robes' as const,
            season: '',
            color: '',
            sizes: ['M'],
            description: '',
            material: '',
            createdAt: ''
          }
        };
      });

      const totalItems = referencesList.reduce((sum, item) => sum + item.stock.totalQuantity, 0);

      return {
        store,
        referencesCount: referencesList.length,
        totalItems,
        references: referencesList,
      };
    });
  }, [stores, products, storeStocks]);

  // Filtrage selon la recherche
  const filteredReferences = useMemo(() => {
    if (!searchQuery.trim()) return referenceData;
    const q = searchQuery.toLowerCase().trim();
    return referenceData.filter(item => {
      const matchRef = item.product.reference.toLowerCase().includes(q);
      const matchName = item.product.name.toLowerCase().includes(q);
      const matchStore = item.distributions.some(d => 
        d.store.name.toLowerCase().includes(q) || d.store.city.toLowerCase().includes(q)
      );
      return matchRef || matchName || matchStore;
    });
  }, [referenceData, searchQuery]);

  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return storeData;
    const q = searchQuery.toLowerCase().trim();
    return storeData.filter(item => {
      const matchStore = item.store.name.toLowerCase().includes(q) || item.store.city.toLowerCase().includes(q);
      const matchRef = item.references.some(r => 
        r.product.reference.toLowerCase().includes(q) || r.product.name.toLowerCase().includes(q)
      );
      return matchStore || matchRef;
    });
  }, [storeData, searchQuery]);

  // Suggestions rapides pour la saisie
  const existingRefs = useMemo(() => products.map(p => p.reference), [products]);
  const existingStoreNames = useMemo(() => stores.map(s => s.name), [stores]);

  return (
    <div className="space-y-8">
      {/* 1. SECTION PRINCIPALE : FORMULAIRE DE SAISIE SIMPLE */}
      <section className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold mb-2">
            <Tag className="w-3.5 h-3.5" />
            <span>Votre espace de saisie</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Saisir vos Références & Magasins
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Tapez directement la référence de votre vêtement et le magasin où vous l'avez distribuée.
          </p>
        </div>

        <form onSubmit={handleMainSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Champ Référence */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                1. Référence Vêtement <span className="text-indigo-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputRef}
                  onChange={(e) => handleRefInputChange(e.target.value)}
                  placeholder="Tapez votre référence (ex: ROBE-01, VESTE-BLANCHE, 542...)"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white font-medium placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  required
                />
              </div>

              {/* Suggestions rapides de références déjà saisies par l'utilisateur */}
              {existingRefs.length > 0 && !inputRef && (
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-slate-400">Vos références :</span>
                  {existingRefs.slice(0, 4).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRefInputChange(r)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono border border-slate-700 cursor-pointer transition-colors"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Champ Magasin */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                2. Magasin Distribué <span className="text-indigo-400">*</span>
              </label>
              <input
                type="text"
                value={inputStore}
                onChange={(e) => setInputStore(e.target.value)}
                placeholder="Tapez le nom du magasin (ex: Paris, Lyon, Bordeaux...)"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white font-medium placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                required
              />

              {/* Suggestions rapides de magasins déjà saisis */}
              {existingStoreNames.length > 0 && !inputStore && (
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-slate-400">Vos magasins :</span>
                  {existingStoreNames.slice(0, 3).map(sName => (
                    <button
                      key={sName}
                      type="button"
                      onClick={() => setInputStore(sName)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] border border-slate-700 cursor-pointer transition-colors truncate max-w-[140px]"
                    >
                      {sName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Champ Quantité & Bouton Submit */}
            <div className="md:col-span-4 flex flex-col sm:flex-row gap-3 items-end">
              <div className="w-full sm:w-36">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Quantité (pièces)
                </label>
                <div className="flex items-center bg-slate-800 border border-slate-600 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setInputQty(Math.max(1, inputQty - 1))}
                    className="px-2.5 py-3 text-slate-400 hover:text-white hover:bg-slate-700 text-sm font-bold cursor-pointer transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={inputQty}
                    onChange={(e) => setInputQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-transparent text-center text-sm font-bold text-white focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setInputQty(inputQty + 1)}
                    className="px-2.5 py-3 text-slate-400 hover:text-white hover:bg-slate-700 text-sm font-bold cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Enregistrer ma Distribution</span>
              </button>
            </div>
          </div>

          {/* Option facultative : Description ou Note */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 text-xs">
            <div className="flex-1">
              <input
                type="text"
                value={inputProdName}
                onChange={(e) => setInputProdName(e.target.value)}
                placeholder="Description du vêtement (facultatif, ex: Robe d'été, Pantalon lin...)"
                className="w-full bg-slate-800/60 border border-slate-750 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-slate-500"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
                placeholder="Note / Observation (facultatif, ex: Envoi du matin, Réassort...)"
                className="w-full bg-slate-800/60 border border-slate-750 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>
        </form>
      </section>

      {/* 2. BARRE D'OUTILS ET RECHERCHE */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Champ de recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tapez une référence pour voir où elle a été distribuée..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Boutons de vue, export et vidage */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-1 flex">
            <button
              onClick={() => setViewMode('by_ref')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'by_ref'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Par Référence ({filteredReferences.length})
            </button>
            <button
              onClick={() => setViewMode('by_store')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'by_store'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Par Magasin ({filteredStores.length})
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            title="Télécharger la liste sous Excel"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          {products.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Voulez-vous effacer toutes vos références et magasins pour recommencer à zéro ?')) {
                  StorageService.clearAllData();
                  onDataChanged();
                  onShowMessage('Toutes les données ont été effacées', 'success');
                }
              }}
              title="Vider toutes les données enregistrées"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 border border-slate-700 hover:border-rose-700 text-slate-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tout effacer</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. VUE PRINCIPALE : PAR RÉFÉRENCE */}
      {viewMode === 'by_ref' && (
        <div className="space-y-4">
          {filteredReferences.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <Package className="w-12 h-12 text-indigo-400/60 mx-auto mb-3" />
              <p className="text-slate-200 font-bold text-base">
                {products.length === 0 
                  ? "Votre base est prête et vide" 
                  : "Aucune référence ne correspond à votre recherche"}
              </p>
              <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
                {products.length === 0
                  ? "C'est à vous de saisir : tapez votre référence et le nom de votre magasin ci-dessus, puis validez pour commencer le suivi."
                  : "Essayez de taper un autre terme de recherche ou effacez la barre de recherche."}
              </p>
            </div>
          ) : (
            filteredReferences.map(({ product, storesCount, totalQuantity, distributions }) => (
              <div
                key={product.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-md"
              >
                {/* En-tête de la référence */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shrink-0">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-extrabold text-white font-mono tracking-tight">
                          {product.reference}
                        </span>
                        {product.name && product.name !== product.reference && (
                          <span className="text-sm font-semibold text-slate-300">
                            — {product.name}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[11px]">
                          {product.category || 'Vêtement'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Distribué dans <strong className="text-slate-200">{storesCount} magasin{storesCount > 1 ? 's' : ''}</strong>
                        {' '}• Total : <strong className="text-indigo-400 font-mono">{totalQuantity} pièces</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setQuickAddStoreForRef(quickAddStoreForRef === product.reference ? null : product.reference)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter un magasin</span>
                    </button>
                    <button
                      onClick={() => handleDeleteReference(product.id, product.reference)}
                      title="Supprimer cette référence"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Formulaire inline pour ajouter un magasin à cette référence */}
                {quickAddStoreForRef === product.reference && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-850 border border-indigo-500/40 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-300">
                        Ajouter un magasin pour la référence {product.reference} :
                      </span>
                      <button
                        onClick={() => setQuickAddStoreForRef(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={quickStoreName}
                        onChange={(e) => setQuickStoreName(e.target.value)}
                        placeholder="Nom du magasin (ex: Boutique Bordeaux, Marseille...)"
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                      <div className="flex items-center bg-slate-800 border border-slate-600 rounded-lg overflow-hidden w-28">
                        <input
                          type="number"
                          min="1"
                          value={quickStoreQty}
                          onChange={(e) => setQuickStoreQty(parseInt(e.target.value) || 1)}
                          className="w-full bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                        />
                        <span className="pr-2 text-[10px] text-slate-400">pcs</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickAddStore(product.reference)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        Valider
                      </button>
                    </div>
                  </div>
                )}

                {/* Liste des magasins où cette référence est distribuée */}
                <div className="mt-4">
                  {distributions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">
                      Cette référence n'a pas encore été distribuée à un magasin. Cliquez sur "+ Ajouter un magasin".
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {distributions.map(({ stock, store }) => {
                        const isEditing = editingStockId === stock.id;

                        return (
                          <div
                            key={stock.id}
                            className="bg-slate-800/60 border border-slate-750 hover:border-slate-600 rounded-xl p-3.5 flex flex-col justify-between transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  <span>{store.name}</span>
                                </h4>
                                {store.city && (
                                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-500" />
                                    <span>{store.city}</span>
                                  </p>
                                )}
                              </div>

                              {/* Quantité ou champ de modification */}
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    value={editingQty}
                                    onChange={(e) => setEditingQty(parseInt(e.target.value) || 0)}
                                    className="w-14 bg-slate-900 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveQtyEdit(store.id, product.id)}
                                    className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="text-right">
                                  <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-mono font-bold text-xs">
                                    {stock.totalQuantity} pcs
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Bas de la carte magasin : Date & Actions */}
                            <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{stock.lastRestockedAt ? new Date(stock.lastRestockedAt).toLocaleDateString('fr-FR') : 'Récent'}</span>
                              </span>

                              <div className="flex items-center gap-1.5">
                                {!isEditing && (
                                  <button
                                    onClick={() => {
                                      setEditingStockId(stock.id);
                                      setEditingQty(stock.totalQuantity);
                                    }}
                                    title="Modifier la quantité"
                                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteDistribution(store.id, product.id, store.name, product.reference)}
                                  title="Retirer ce magasin"
                                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. VUE PAR MAGASIN */}
      {viewMode === 'by_store' && (
        <div className="space-y-4">
          {filteredStores.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-200 font-bold text-base">
                {stores.length === 0 ? "Aucun magasin enregistré" : "Aucun magasin ne correspond à votre recherche"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {stores.length === 0 
                  ? "Saisissez votre première distribution ci-dessus pour ajouter vos magasins."
                  : "Effacez votre recherche pour voir tous vos magasins."}
              </p>
            </div>
          ) : (
            filteredStores.map(({ store, referencesCount, totalItems, references }) => (
              <div
                key={store.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>{store.name}</span>
                        {store.city && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                            {store.city}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {referencesCount} référence{referencesCount > 1 ? 's' : ''} reçue{referencesCount > 1 ? 's' : ''} • Total : <strong className="text-emerald-400 font-mono">{totalItems} pièces</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Liste des références reçues par ce magasin */}
                <div className="mt-4">
                  {references.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">
                      Ce magasin n'a reçu aucune référence pour le moment.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {references.map(({ stock, product }) => (
                        <div
                          key={stock.id}
                          className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-mono font-bold text-white block">
                              {product.reference}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate block max-w-[170px]">
                              {product.name}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono font-bold text-xs">
                            {stock.totalQuantity} pcs
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
