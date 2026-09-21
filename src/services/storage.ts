import { ProductReference, Store, StoreStockItem, StockMovement, DistributionSearchResult } from '../types';
import { INITIAL_PRODUCTS, INITIAL_STORES, INITIAL_STORE_STOCKS, INITIAL_MOVEMENTS } from '../data/mockData';

const STORAGE_KEYS = {
  PRODUCTS: 'habillement_user_products_v2',
  STORES: 'habillement_user_stores_v2',
  STORE_STOCKS: 'habillement_user_store_stocks_v2',
  MOVEMENTS: 'habillement_user_movements_v2',
};

// Safe localStorage access helper
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Error loading key ${key} from localStorage:`, e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing key ${key} to localStorage:`, e);
  }
}

export const StorageService = {
  initializeIfNeeded(): void {
    // Purge old mock data keys to ensure empty start for real user input
    try {
      localStorage.removeItem('habillement_products_v1');
      localStorage.removeItem('habillement_stores_v1');
      localStorage.removeItem('habillement_store_stocks_v1');
      localStorage.removeItem('habillement_movements_v1');
    } catch {
      // ignore
    }

    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      setStored(STORAGE_KEYS.PRODUCTS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STORES)) {
      setStored(STORAGE_KEYS.STORES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STORE_STOCKS)) {
      setStored(STORAGE_KEYS.STORE_STOCKS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MOVEMENTS)) {
      setStored(STORAGE_KEYS.MOVEMENTS, []);
    }
  },

  clearAllData(): void {
    setStored(STORAGE_KEYS.PRODUCTS, []);
    setStored(STORAGE_KEYS.STORES, []);
    setStored(STORAGE_KEYS.STORE_STOCKS, []);
    setStored(STORAGE_KEYS.MOVEMENTS, []);
  },

  resetToDefault(): void {
    this.clearAllData();
  },

  loadDemoData(): void {
    setStored(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    setStored(STORAGE_KEYS.STORES, INITIAL_STORES);
    setStored(STORAGE_KEYS.STORE_STOCKS, INITIAL_STORE_STOCKS);
    setStored(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
  },

  getProducts(): ProductReference[] {
    return getStored<ProductReference[]>(STORAGE_KEYS.PRODUCTS, []);
  },

  getStores(): Store[] {
    return getStored<Store[]>(STORAGE_KEYS.STORES, []);
  },

  getStoreStocks(): StoreStockItem[] {
    return getStored<StoreStockItem[]>(STORAGE_KEYS.STORE_STOCKS, []);
  },

  getMovements(): StockMovement[] {
    return getStored<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, []);
  },

  // Find a product by reference (exact or clean normalized match)
  findProductByReference(refQuery: string): ProductReference | undefined {
    if (!refQuery) return undefined;
    const cleanQuery = refQuery.trim().toUpperCase();
    const products = this.getProducts();

    // 1. Exact match on reference
    let found = products.find(p => p.reference.toUpperCase() === cleanQuery);
    if (found) return found;

    // 2. Exact match on barcode
    found = products.find(p => p.barcode === cleanQuery);
    if (found) return found;

    // 3. Partial match on reference or name
    return products.find(p => 
      p.reference.toUpperCase().includes(cleanQuery) || 
      p.name.toUpperCase().includes(cleanQuery)
    );
  },

  // Get full distribution details for a given product reference or id
  getDistributionForProduct(productRefOrId: string): DistributionSearchResult | null {
    const products = this.getProducts();
    const stores = this.getStores();
    const allStocks = this.getStoreStocks();

    const cleanInput = productRefOrId.trim().toUpperCase();
    const product = products.find(
      p => p.id.toUpperCase() === cleanInput || 
           p.reference.toUpperCase() === cleanInput ||
           p.barcode === cleanInput
    ) || products.find(p => p.reference.toUpperCase().includes(cleanInput));

    if (!product) return null;

    // Find all store stock items for this product
    const productStocks = allStocks.filter(s => s.productId === product.id);

    const distributedStores: DistributionSearchResult['distributedStores'] = [];
    const distributedStoreIds = new Set<string>();

    for (const stock of productStocks) {
      const store = stores.find(s => s.id === stock.storeId);
      if (store) {
        distributedStoreIds.add(store.id);
        let status: 'optimal' | 'low' | 'out_of_stock' = 'optimal';
        if (stock.totalQuantity === 0) {
          status = 'out_of_stock';
        } else if (stock.totalQuantity <= stock.minThreshold) {
          status = 'low';
        }

        distributedStores.push({
          store,
          stock,
          status,
        });
      }
    }

    // Sort distributed stores: highest stock first, but prioritize stores with stock
    distributedStores.sort((a, b) => b.stock.totalQuantity - a.stock.totalQuantity);

    const totalStockInStores = distributedStores.reduce((acc, curr) => acc + curr.stock.totalQuantity, 0);

    const undistributedStores = stores.filter(s => !distributedStoreIds.has(s.id));

    return {
      product,
      distributedStores,
      totalStockInStores,
      totalDistributedStoresCount: distributedStores.length,
      undistributedStores,
    };
  },

  // Add a new clothing reference
  addProduct(newProduct: Omit<ProductReference, 'id' | 'createdAt'>): ProductReference {
    const products = this.getProducts();
    const id = `PRD-${String(products.length + 1).padStart(3, '0')}`;
    const product: ProductReference = {
      ...newProduct,
      id,
      createdAt: new Date().toISOString(),
    };

    products.unshift(product);
    setStored(STORAGE_KEYS.PRODUCTS, products);
    return product;
  },

  // Add a new store
  addStore(newStore: Omit<Store, 'id'>): Store {
    const stores = this.getStores();
    const id = `STR-${newStore.city.substring(0, 3).toUpperCase()}-${String(stores.length + 1).padStart(2, '0')}`;
    const store: Store = {
      ...newStore,
      id,
    };

    stores.push(store);
    setStored(STORAGE_KEYS.STORES, stores);
    return store;
  },

  // Distribute stock from Central Warehouse to a Store
  distributeStock(params: {
    productId: string;
    storeId: string;
    sizeQuantities: Record<string, number>;
    note?: string;
    operator: string;
  }): { success: boolean; message: string; movement?: StockMovement } {
    const products = this.getProducts();
    const stores = this.getStores();
    const allStocks = this.getStoreStocks();
    const movements = this.getMovements();

    const product = products.find(p => p.id === params.productId);
    const store = stores.find(s => s.id === params.storeId);

    if (!product || !store) {
      return { success: false, message: 'Produit ou magasin introuvable' };
    }

    const totalToDistribute = Object.values(params.sizeQuantities).reduce((a, b) => a + (Number(b) || 0), 0);

    if (totalToDistribute <= 0) {
      return { success: false, message: 'La quantité totale à distribuer doit être supérieure à zéro' };
    }

    if (product.centralStock < totalToDistribute) {
      return {
        success: false,
        message: `Stock entrepôt insuffisant (${product.centralStock} disponible(s), ${totalToDistribute} demandé(s))`,
      };
    }

    // Deduct from central stock
    product.centralStock -= totalToDistribute;
    setStored(STORAGE_KEYS.PRODUCTS, products);

    // Update or create StoreStock
    const stockId = `${store.id}_${product.id}`;
    let storeStock = allStocks.find(s => s.id === stockId);

    if (!storeStock) {
      storeStock = {
        id: stockId,
        storeId: store.id,
        productId: product.id,
        productReference: product.reference,
        sizeQuantities: {},
        totalQuantity: 0,
        minThreshold: 5,
        lastRestockedAt: new Date().toISOString(),
      };
      allStocks.push(storeStock);
    }

    // Add size quantities
    for (const [size, qty] of Object.entries(params.sizeQuantities)) {
      const added = Number(qty) || 0;
      storeStock.sizeQuantities[size] = (storeStock.sizeQuantities[size] || 0) + added;
    }

    storeStock.totalQuantity = Object.values(storeStock.sizeQuantities).reduce((a, b) => a + b, 0);
    storeStock.lastRestockedAt = new Date().toISOString();
    setStored(STORAGE_KEYS.STORE_STOCKS, allStocks);

    // Record movement
    const movementNumber = `DIS-${new Date().getFullYear()}-${String(movements.length + 1).padStart(3, '0')}`;
    const movement: StockMovement = {
      id: `MVT-${Date.now()}`,
      referenceNumber: movementNumber,
      type: 'distribution',
      productId: product.id,
      productReference: product.reference,
      productName: product.name,
      fromLocationId: 'warehouse',
      fromLocationName: 'Entrepôt Central Logistique',
      toLocationId: store.id,
      toLocationName: store.name,
      quantity: totalToDistribute,
      sizeQuantities: { ...params.sizeQuantities },
      date: new Date().toISOString(),
      note: params.note || 'Distribution standard',
      operator: params.operator || 'Responsable Approvisionnement',
    };

    movements.unshift(movement);
    setStored(STORAGE_KEYS.MOVEMENTS, movements);

    return {
      success: true,
      message: `${totalToDistribute} pièces distribuées avec succès vers ${store.name}`,
      movement,
    };
  },

  // Transfer stock from Store A to Store B
  transferStock(params: {
    productId: string;
    fromStoreId: string;
    toStoreId: string;
    sizeQuantities: Record<string, number>;
    note?: string;
    operator: string;
  }): { success: boolean; message: string; movement?: StockMovement } {
    const products = this.getProducts();
    const stores = this.getStores();
    const allStocks = this.getStoreStocks();
    const movements = this.getMovements();

    const product = products.find(p => p.id === params.productId);
    const fromStore = stores.find(s => s.id === params.fromStoreId);
    const toStore = stores.find(s => s.id === params.toStoreId);

    if (!product || !fromStore || !toStore) {
      return { success: false, message: 'Produit ou magasin introuvable' };
    }

    if (params.fromStoreId === params.toStoreId) {
      return { success: false, message: 'Le magasin source et destinataire doivent être différents' };
    }

    const totalToTransfer = Object.values(params.sizeQuantities).reduce((a, b) => a + (Number(b) || 0), 0);
    if (totalToTransfer <= 0) {
      return { success: false, message: 'La quantité à transférer doit être supérieure à zéro' };
    }

    // Check source store stock
    const sourceStockId = `${fromStore.id}_${product.id}`;
    const sourceStock = allStocks.find(s => s.id === sourceStockId);

    if (!sourceStock || sourceStock.totalQuantity < totalToTransfer) {
      return { success: false, message: 'Stock insuffisant dans le magasin de départ' };
    }

    // Check each size
    for (const [size, qty] of Object.entries(params.sizeQuantities)) {
      const requested = Number(qty) || 0;
      const available = sourceStock.sizeQuantities[size] || 0;
      if (requested > available) {
        return {
          success: false,
          message: `Stock insuffisant en taille ${size} chez ${fromStore.name} (${available} dispo)`,
        };
      }
    }

    // Deduct from source
    for (const [size, qty] of Object.entries(params.sizeQuantities)) {
      const val = Number(qty) || 0;
      sourceStock.sizeQuantities[size] = (sourceStock.sizeQuantities[size] || 0) - val;
    }
    sourceStock.totalQuantity = Object.values(sourceStock.sizeQuantities).reduce((a, b) => a + b, 0);

    // Add to target
    const targetStockId = `${toStore.id}_${product.id}`;
    let targetStock = allStocks.find(s => s.id === targetStockId);
    if (!targetStock) {
      targetStock = {
        id: targetStockId,
        storeId: toStore.id,
        productId: product.id,
        productReference: product.reference,
        sizeQuantities: {},
        totalQuantity: 0,
        minThreshold: 5,
        lastRestockedAt: new Date().toISOString(),
      };
      allStocks.push(targetStock);
    }

    for (const [size, qty] of Object.entries(params.sizeQuantities)) {
      const val = Number(qty) || 0;
      targetStock.sizeQuantities[size] = (targetStock.sizeQuantities[size] || 0) + val;
    }
    targetStock.totalQuantity = Object.values(targetStock.sizeQuantities).reduce((a, b) => a + b, 0);
    targetStock.lastRestockedAt = new Date().toISOString();

    setStored(STORAGE_KEYS.STORE_STOCKS, allStocks);

    // Record movement
    const movementNumber = `TRF-${new Date().getFullYear()}-${String(movements.length + 1).padStart(3, '0')}`;
    const movement: StockMovement = {
      id: `MVT-${Date.now()}`,
      referenceNumber: movementNumber,
      type: 'transfer',
      productId: product.id,
      productReference: product.reference,
      productName: product.name,
      fromLocationId: fromStore.id,
      fromLocationName: fromStore.name,
      toLocationId: toStore.id,
      toLocationName: toStore.name,
      quantity: totalToTransfer,
      sizeQuantities: { ...params.sizeQuantities },
      date: new Date().toISOString(),
      note: params.note || 'Transfert inter-boutiques',
      operator: params.operator || 'Responsable Réseau',
    };

    movements.unshift(movement);
    setStored(STORAGE_KEYS.MOVEMENTS, movements);

    return {
      success: true,
      message: `Transfert de ${totalToTransfer} pièces réussi de ${fromStore.name} vers ${toStore.name}`,
      movement,
    };
  },

  // Manual stock adjustment for inventory correction / sales
  adjustStoreStock(params: {
    storeId: string;
    productId: string;
    sizeQuantities: Record<string, number>;
    reason: string;
    operator: string;
  }): { success: boolean; message: string } {
    const products = this.getProducts();
    const stores = this.getStores();
    const allStocks = this.getStoreStocks();
    const movements = this.getMovements();

    const product = products.find(p => p.id === params.productId);
    const store = stores.find(s => s.id === params.storeId);
    if (!product || !store) return { success: false, message: 'Introuvable' };

    const stockId = `${store.id}_${product.id}`;
    let storeStock = allStocks.find(s => s.id === stockId);

    const oldTotal = storeStock ? storeStock.totalQuantity : 0;

    if (!storeStock) {
      storeStock = {
        id: stockId,
        storeId: store.id,
        productId: product.id,
        productReference: product.reference,
        sizeQuantities: {},
        totalQuantity: 0,
        minThreshold: 5,
        lastRestockedAt: new Date().toISOString(),
      };
      allStocks.push(storeStock);
    }

    storeStock.sizeQuantities = { ...params.sizeQuantities };
    storeStock.totalQuantity = Object.values(params.sizeQuantities).reduce((a, b) => a + (Number(b) || 0), 0);
    storeStock.lastRestockedAt = new Date().toISOString();

    setStored(STORAGE_KEYS.STORE_STOCKS, allStocks);

    const diff = storeStock.totalQuantity - oldTotal;

    const movementNumber = `AJU-${new Date().getFullYear()}-${String(movements.length + 1).padStart(3, '0')}`;
    const movement: StockMovement = {
      id: `MVT-${Date.now()}`,
      referenceNumber: movementNumber,
      type: 'adjustment',
      productId: product.id,
      productReference: product.reference,
      productName: product.name,
      fromLocationId: store.id,
      fromLocationName: store.name,
      toLocationId: store.id,
      toLocationName: store.name,
      quantity: Math.abs(diff),
      sizeQuantities: { ...params.sizeQuantities },
      date: new Date().toISOString(),
      note: `Ajustement inventaire: ${params.reason} (${diff >= 0 ? '+' : ''}${diff} pièces)`,
      operator: params.operator || 'Responsable Magasin',
    };

    movements.unshift(movement);
    setStored(STORAGE_KEYS.MOVEMENTS, movements);

    return {
      success: true,
      message: `Stock mis à jour pour ${store.name} : ${storeStock.totalQuantity} pièces au total`,
    };
  },

  // Saisie directe simplifiée : tapez une référence et un magasin
  recordDirectDistribution(params: {
    reference: string;
    productName?: string;
    storeName: string;
    storeCity?: string;
    quantity: number;
    note?: string;
  }): { success: boolean; message: string; product: ProductReference; store: Store } {
    const cleanRef = params.reference.trim().toUpperCase();
    const cleanStoreName = params.storeName.trim();
    const qty = Math.max(1, Math.round(Number(params.quantity) || 1));

    if (!cleanRef) {
      return { success: false, message: 'Veuillez saisir une référence de vêtement', product: {} as ProductReference, store: {} as Store };
    }
    if (!cleanStoreName) {
      return { success: false, message: 'Veuillez saisir le nom du magasin', product: {} as ProductReference, store: {} as Store };
    }

    const products = this.getProducts();
    const stores = this.getStores();
    const allStocks = this.getStoreStocks();
    const movements = this.getMovements();

    // 1. Trouver ou créer automatiquement la référence vêtement
    let product = products.find(p => p.reference.toUpperCase() === cleanRef);
    if (!product) {
      const displayName = params.productName?.trim() || cleanRef;
      product = {
        id: `PRD-${String(products.length + 1).padStart(3, '0')}`,
        reference: cleanRef,
        barcode: `37000${Math.floor(1000000 + Math.random() * 9000000)}`,
        name: displayName,
        category: 'Robes',
        season: 'Saison Actuelle',
        color: 'Standard',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        unitCostPrice: 25,
        unitRetailPrice: 59,
        centralStock: 500,
        description: `Référence ${cleanRef}`,
        material: 'Textile',
        createdAt: new Date().toISOString(),
      };
      products.unshift(product);
      setStored(STORAGE_KEYS.PRODUCTS, products);
    }

    // 2. Trouver ou créer automatiquement le magasin
    let store = stores.find(s => s.name.toLowerCase() === cleanStoreName.toLowerCase());
    if (!store) {
      const city = params.storeCity?.trim() || cleanStoreName.replace(/Boutique|Magasin|Corner|Galeries/gi, '').trim() || 'France';
      store = {
        id: `STR-${city.substring(0, 3).toUpperCase()}-${String(stores.length + 1).padStart(2, '0')}`,
        code: `${city.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
        name: cleanStoreName,
        city: city,
        address: `Centre-ville, ${city}`,
        postalCode: '75000',
        phone: '01 00 00 00 00',
        manager: 'Responsable',
        email: `${city.toLowerCase()}@reseau.fr`,
        type: 'boutique',
      };
      stores.push(store);
      setStored(STORAGE_KEYS.STORES, stores);
    }

    // 3. Mettre à jour le stock dans ce magasin
    const stockId = `${store.id}_${product.id}`;
    let storeStock = allStocks.find(s => s.id === stockId);

    if (!storeStock) {
      storeStock = {
        id: stockId,
        storeId: store.id,
        productId: product.id,
        productReference: product.reference,
        sizeQuantities: {
          'M': qty,
        },
        totalQuantity: qty,
        minThreshold: 5,
        lastRestockedAt: new Date().toISOString(),
      };
      allStocks.unshift(storeStock);
    } else {
      storeStock.totalQuantity += qty;
      storeStock.sizeQuantities['M'] = (storeStock.sizeQuantities['M'] || 0) + qty;
      storeStock.lastRestockedAt = new Date().toISOString();
    }

    setStored(STORAGE_KEYS.STORE_STOCKS, allStocks);

    // 4. Enregistrer dans l'historique
    const movementNumber = `DIS-${new Date().getFullYear()}-${String(movements.length + 1).padStart(3, '0')}`;
    const movement: StockMovement = {
      id: `MVT-${Date.now()}`,
      referenceNumber: movementNumber,
      type: 'distribution',
      productId: product.id,
      productReference: product.reference,
      productName: product.name,
      fromLocationId: 'warehouse',
      fromLocationName: 'Entrepôt Central',
      toLocationId: store.id,
      toLocationName: store.name,
      quantity: qty,
      sizeQuantities: { 'Total': qty },
      date: new Date().toISOString(),
      note: params.note || 'Distribution magasin',
      operator: 'Gestionnaire',
    };
    movements.unshift(movement);
    setStored(STORAGE_KEYS.MOVEMENTS, movements);

    return {
      success: true,
      message: `Distribution enregistrée : ${qty} pcs de ${product.reference} envoyées à ${store.name}`,
      product,
      store,
    };
  },

  // Retirer un magasin d'une référence (supprimer une distribution)
  removeDistribution(storeId: string, productId: string): { success: boolean; message: string } {
    const allStocks = this.getStoreStocks();
    const stockId = `${storeId}_${productId}`;
    const filtered = allStocks.filter(s => s.id !== stockId);
    setStored(STORAGE_KEYS.STORE_STOCKS, filtered);
    return { success: true, message: 'Distribution retirée avec succès' };
  },

  // Mettre à jour directement la quantité distribuée à un magasin
  updateDistributionQuantity(storeId: string, productId: string, newTotal: number): { success: boolean; message: string } {
    const allStocks = this.getStoreStocks();
    const stockId = `${storeId}_${productId}`;
    const item = allStocks.find(s => s.id === stockId);
    if (!item) return { success: false, message: 'Distribution introuvable' };

    const safeQty = Math.max(0, Math.round(newTotal));
    item.totalQuantity = safeQty;
    item.sizeQuantities = { 'Total': safeQty };
    item.lastRestockedAt = new Date().toISOString();

    setStored(STORAGE_KEYS.STORE_STOCKS, allStocks);
    return { success: true, message: `Quantité mise à jour : ${safeQty} pièces` };
  },

  // Supprimer une référence vêtement et toutes ses distributions
  deleteProductReference(productId: string): { success: boolean; message: string } {
    const products = this.getProducts().filter(p => p.id !== productId);
    setStored(STORAGE_KEYS.PRODUCTS, products);

    const stocks = this.getStoreStocks().filter(s => s.productId !== productId);
    setStored(STORAGE_KEYS.STORE_STOCKS, stocks);

    return { success: true, message: 'Référence supprimée' };
  },

  // Exporter la liste au format CSV (Excel)
  exportCSV(): string {
    const products = this.getProducts();
    const stores = this.getStores();
    const stocks = this.getStoreStocks();

    const headers = ['Reference', 'Nom_Article', 'Magasin', 'Ville', 'Quantite_Distribuee', 'Dernier_Arrivage'];
    const rows = stocks.map(stk => {
      const prod = products.find(p => p.id === stk.productId);
      const str = stores.find(s => s.id === stk.storeId);
      return [
        `"${prod?.reference || stk.productReference}"`,
        `"${prod?.name || ''}"`,
        `"${str?.name || ''}"`,
        `"${str?.city || ''}"`,
        stk.totalQuantity,
        `"${stk.lastRestockedAt?.slice(0, 10) || ''}"`,
      ].join(';');
    });

    return [headers.join(';'), ...rows].join('\n');
  },

  // Export full database backup as JSON
  exportData(): string {
    const data = {
      products: this.getProducts(),
      stores: this.getStores(),
      storeStocks: this.getStoreStocks(),
      movements: this.getMovements(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },

  // Import JSON backup
  importData(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.products) && Array.isArray(parsed.stores)) {
        setStored(STORAGE_KEYS.PRODUCTS, parsed.products);
        setStored(STORAGE_KEYS.STORES, parsed.stores);
        if (Array.isArray(parsed.storeStocks)) {
          setStored(STORAGE_KEYS.STORE_STOCKS, parsed.storeStocks);
        }
        if (Array.isArray(parsed.movements)) {
          setStored(STORAGE_KEYS.MOVEMENTS, parsed.movements);
        }
        return { success: true, message: 'Données importées avec succès' };
      }
      return { success: false, message: 'Format de fichier JSON invalide' };
    } catch (e) {
      return { success: false, message: 'Erreur lors de la lecture du fichier JSON' };
    }
  },
};
