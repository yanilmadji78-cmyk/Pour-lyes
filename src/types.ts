export type ClothingCategory =
  | 'Robes'
  | 'Vestes & Manteaux'
  | 'Pantalons & Jeans'
  | 'Chemises & Hauts'
  | 'Mailles & Pulls'
  | 'Jupes & Shorts'
  | 'Costumes & Blazers'
  | 'Accessoires';

export type StoreType = 'boutique' | 'corner' | 'outlet' | 'franchise';

export type MovementType = 'distribution' | 'transfer' | 'adjustment' | 'return';

export interface ProductReference {
  id: string;
  reference: string; // e.g. "REF-ROB-042"
  barcode: string; // e.g. "370012345678"
  name: string;
  category: ClothingCategory;
  season: string;
  color: string;
  sizes: string[]; // e.g. ["XS", "S", "M", "L", "XL"]
  unitCostPrice: number;
  unitRetailPrice: number;
  centralStock: number; // Stock restant à l'entrepôt central
  description: string;
  material: string;
  createdAt: string;
  imageUrl?: string;
}

export interface Store {
  id: string;
  code: string; // e.g. "PAR-01"
  name: string;
  city: string;
  address: string;
  postalCode: string;
  phone: string;
  manager: string;
  email: string;
  type: StoreType;
}

export interface StoreStockItem {
  id: string; // storeId_productId
  storeId: string;
  productId: string;
  productReference: string;
  sizeQuantities: Record<string, number>; // e.g. { "S": 5, "M": 8, "L": 3 }
  totalQuantity: number;
  minThreshold: number; // Seuil d'alerte stock bas (e.g. 5)
  lastRestockedAt: string;
}

export interface StockMovement {
  id: string;
  referenceNumber: string; // e.g. "MVT-2025-001"
  type: MovementType;
  productId: string;
  productReference: string;
  productName: string;
  fromLocationId: string; // 'warehouse' or storeId
  fromLocationName: string;
  toLocationId: string; // 'warehouse' or storeId
  toLocationName: string;
  quantity: number;
  sizeQuantities: Record<string, number>;
  date: string;
  note?: string;
  operator: string;
}

export interface DistributionSearchResult {
  product: ProductReference;
  distributedStores: {
    store: Store;
    stock: StoreStockItem;
    status: 'optimal' | 'low' | 'out_of_stock';
  }[];
  totalStockInStores: number;
  totalDistributedStoresCount: number;
  undistributedStores: Store[];
}
