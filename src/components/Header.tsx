import React from 'react';
import { 
  Shirt, 
  Store as StoreIcon, 
  Search, 
  PlusCircle, 
  ArrowRightLeft, 
  History, 
  AlertTriangle, 
  PackageCheck, 
  Database,
  Building2,
  RefreshCw
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'simple' | 'search' | 'stores' | 'history';
  setActiveTab: (tab: 'simple' | 'search' | 'stores' | 'history') => void;
  stats: {
    totalProducts: number;
    totalStores: number;
    totalItemsInStores: number;
    lowStockAlertsCount: number;
  };
  onOpenNewDistribution: () => void;
  onOpenNewProduct: () => void;
  onOpenNewStore: () => void;
  onOpenBackup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  stats,
  onOpenNewDistribution,
  onOpenNewProduct,
  onOpenNewStore,
  onOpenBackup,
}) => {
  return (
    <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20 ring-1 ring-white/20">
              <Shirt className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight font-display">
                  DISTRI-TEXTILE
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  Saisie & Suivi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Saisir les références et noter les magasins où elles sont distribuées
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center space-x-2">
              <Shirt className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Références</span>
                <span className="text-xs font-bold text-slate-100 font-mono">{stats.totalProducts}</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Magasins</span>
                <span className="text-xs font-bold text-slate-100 font-mono">{stats.totalStores}</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center space-x-2">
              <PackageCheck className="w-4 h-4 text-blue-400" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Distribuées</span>
                <span className="text-xs font-bold text-slate-100 font-mono">{stats.totalItemsInStores} pcs</span>
              </div>
            </div>

            <button
              onClick={onOpenBackup}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sauvegardes et réinitialisation"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Sauvegardes</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 sm:space-x-2 mt-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('simple')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'simple'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Saisie & Distributions</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Fiche Référence Détaillée</span>
          </button>

          <button
            onClick={() => setActiveTab('stores')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'stores'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <StoreIcon className="w-3.5 h-3.5" />
            <span>Tous les Magasins</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historique Envois</span>
          </button>
        </div>
      </div>
    </header>
  );
};
