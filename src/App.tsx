import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StorageService } from './services/storage';
import { Header } from './components/Header';
import { ReferenceSearchSection } from './components/ReferenceSearchSection';
import { StoresOverviewSection } from './components/StoresOverviewSection';
import { DistributionHistorySection } from './components/DistributionHistorySection';
import { SimpleDistributionManager } from './components/SimpleDistributionManager';
import { NewDistributionModal } from './components/modals/NewDistributionModal';
import { NewProductModal } from './components/modals/NewProductModal';
import { NewStoreModal } from './components/modals/NewStoreModal';
import { TransferStockModal } from './components/modals/TransferStockModal';
import { AdjustStockModal } from './components/modals/AdjustStockModal';
import { BackupModal } from './components/modals/BackupModal';
import { 
  ProductReference, 
  Store, 
  StoreStockItem, 
  StockMovement, 
  DistributionSearchResult 
} from './types';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  // Initialize storage once on boot
  useEffect(() => {
    StorageService.initializeIfNeeded();
  }, []);

  // Main Data States
  const [products, setProducts] = useState<ProductReference[]>(() => StorageService.getProducts());
  const [stores, setStores] = useState<Store[]>(() => StorageService.getStores());
  const [storeStocks, setStoreStocks] = useState<StoreStockItem[]>(() => StorageService.getStoreStocks());
  const [movements, setMovements] = useState<StockMovement[]>(() => StorageService.getMovements());

  // UI Navigation & Active Reference Selection
  const [activeTab, setActiveTab] = useState<'simple' | 'search' | 'stores' | 'history'>('simple');
  const [selectedReference, setSelectedReference] = useState<string>('');

  // Modal Visibility States
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
  const [distributeModalInitial, setDistributeModalInitial] = useState<{ productId?: string; storeId?: string }>({});

  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isNewStoreModalOpen, setIsNewStoreModalOpen] = useState(false);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferModalInitial, setTransferModalInitial] = useState<{ productId?: string; fromStoreId?: string }>({});

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustModalInitial, setAdjustModalInitial] = useState<{ storeId: string; productId: string }>({ storeId: '', productId: '' });

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // User feedback toast banner
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // Synchronize state reload from StorageService
  const refreshData = useCallback(() => {
    setProducts(StorageService.getProducts());
    setStores(StorageService.getStores());
    setStoreStocks(StorageService.getStoreStocks());
    setMovements(StorageService.getMovements());
  }, []);

  // Global Aggregate Stats
  const globalStats = useMemo(() => {
    const totalProducts = products.length;
    const totalStores = stores.length;
    const totalItemsInStores = storeStocks.reduce((sum, s) => sum + s.totalQuantity, 0);
    const lowStockAlertsCount = storeStocks.filter(s => s.totalQuantity <= s.minThreshold).length;

    return {
      totalProducts,
      totalStores,
      totalItemsInStores,
      lowStockAlertsCount,
    };
  }, [products, stores, storeStocks]);

  // Compute distribution details for the currently selected product reference
  const currentDistributionResult = useMemo<DistributionSearchResult | null>(() => {
    if (!selectedReference.trim()) return null;
    return StorageService.getDistributionForProduct(selectedReference);
  }, [selectedReference, products, stores, storeStocks]);

  // Trigger fast distribution modal with optional prefill
  const handleOpenDistribute = (productId?: string, storeId?: string) => {
    setDistributeModalInitial({ productId, storeId });
    setIsDistributeModalOpen(true);
  };

  // Trigger transfer modal
  const handleOpenTransfer = (productId: string, fromStoreId: string) => {
    setTransferModalInitial({ productId, fromStoreId });
    setIsTransferModalOpen(true);
  };

  // Trigger adjustment modal
  const handleOpenAdjust = (storeId: string, productId: string) => {
    setAdjustModalInitial({ storeId, productId });
    setIsAdjustModalOpen(true);
  };

  // Switch to reference search from anywhere in the app
  const handleSelectReferenceFromAnywhere = (ref: string) => {
    setSelectedReference(ref);
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handlers for modal submissions
  const handlePerformDistribution = (params: {
    productId: string;
    storeId: string;
    sizeQuantities: Record<string, number>;
    note?: string;
    operator: string;
  }) => {
    const result = StorageService.distributeStock(params);
    if (result.success) {
      refreshData();
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handlePerformTransfer = (params: {
    productId: string;
    fromStoreId: string;
    toStoreId: string;
    sizeQuantities: Record<string, number>;
    note?: string;
    operator: string;
  }) => {
    const result = StorageService.transferStock(params);
    if (result.success) {
      refreshData();
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handlePerformAdjust = (params: {
    storeId: string;
    productId: string;
    sizeQuantities: Record<string, number>;
    reason: string;
    operator: string;
  }) => {
    const result = StorageService.adjustStoreStock(params);
    if (result.success) {
      refreshData();
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleAddNewProduct = (newProd: Omit<ProductReference, 'id' | 'createdAt'>) => {
    const created = StorageService.addProduct(newProd);
    refreshData();
    showToast(`Référence ${created.reference} (${created.name}) ajoutée au catalogue central`, 'success');
    setSelectedReference(created.reference);
    setActiveTab('search');
  };

  const handleAddNewStore = (newStore: Omit<Store, 'id'>) => {
    const created = StorageService.addStore(newStore);
    refreshData();
    showToast(`Nouveau point de vente ${created.name} (${created.city}) enregistré`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center space-x-3 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/60 text-emerald-300 shadow-emerald-950/40'
                : 'bg-slate-900/95 border-rose-500/60 text-rose-300 shadow-rose-950/40'
            } backdrop-blur-md`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-0.5 ml-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={globalStats}
        onOpenNewDistribution={() => handleOpenDistribute()}
        onOpenNewProduct={() => setIsNewProductModalOpen(true)}
        onOpenNewStore={() => setIsNewStoreModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />

      {/* Main Application Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'simple' && (
          <SimpleDistributionManager
            products={products}
            stores={stores}
            storeStocks={storeStocks}
            onDataChanged={refreshData}
            onShowMessage={showToast}
          />
        )}

        {activeTab === 'search' && (
          <ReferenceSearchSection
            products={products}
            stores={stores}
            selectedReference={selectedReference}
            onSelectReference={setSelectedReference}
            distributionResult={currentDistributionResult}
            onDistributeToStore={(prodId, strId) => handleOpenDistribute(prodId, strId)}
            onTransferFromStore={(prodId, fromStrId) => handleOpenTransfer(prodId, fromStrId)}
            onAdjustStock={(strId, prodId) => handleOpenAdjust(strId, prodId)}
          />
        )}

        {activeTab === 'stores' && (
          <StoresOverviewSection
            stores={stores}
            products={products}
            storeStocks={storeStocks}
            onSelectReference={handleSelectReferenceFromAnywhere}
            onDistributeToStore={(prodId, strId) => handleOpenDistribute(prodId, strId)}
            onAdjustStock={(strId, prodId) => handleOpenAdjust(strId, prodId)}
            onOpenNewStore={() => setIsNewStoreModalOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <DistributionHistorySection
            movements={movements}
            onSelectReference={handleSelectReferenceFromAnywhere}
          />
        )}
      </main>

      {/* Modals */}
      <NewDistributionModal
        isOpen={isDistributeModalOpen}
        onClose={() => setIsDistributeModalOpen(false)}
        products={products}
        stores={stores}
        initialProductId={distributeModalInitial.productId}
        initialStoreId={distributeModalInitial.storeId}
        onSubmit={handlePerformDistribution}
      />

      <NewProductModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onSubmit={handleAddNewProduct}
      />

      <NewStoreModal
        isOpen={isNewStoreModalOpen}
        onClose={() => setIsNewStoreModalOpen(false)}
        onSubmit={handleAddNewStore}
      />

      <TransferStockModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        products={products}
        stores={stores}
        storeStocks={storeStocks}
        initialProductId={transferModalInitial.productId}
        initialFromStoreId={transferModalInitial.fromStoreId}
        onSubmit={handlePerformTransfer}
      />

      {adjustModalInitial.storeId && adjustModalInitial.productId && (
        <AdjustStockModal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          products={products}
          stores={stores}
          storeStocks={storeStocks}
          storeId={adjustModalInitial.storeId}
          productId={adjustModalInitial.productId}
          onSubmit={handlePerformAdjust}
        />
      )}

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataChanged={refreshData}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>
          DISTRI-TEXTILE • Système de gestion centralisée des stocks d'habillement & traçabilité magasins
        </p>
      </footer>
    </div>
  );
}
