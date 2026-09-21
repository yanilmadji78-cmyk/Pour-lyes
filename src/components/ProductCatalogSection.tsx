import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Shirt, 
  Package, 
  Building2, 
  ArrowRight, 
  Barcode, 
  SlidersHorizontal,
  Tag,
  Boxes
} from 'lucide-react';
import { ProductReference, StoreStockItem, ClothingCategory } from '../types';

interface ProductCatalogSectionProps {
  products: ProductReference[];
  storeStocks: StoreStockItem[];
  onSelectReference: (ref: string) => void;
  onOpenNewProduct: () => void;
  onOpenDistributionForProduct: (productId: string) => void;
}

const CATEGORIES: (ClothingCategory | 'Toutes')[] = [
  'Toutes',
  'Robes',
  'Costumes & Blazers',
  'Pantalons & Jeans',
  'Chemises & Hauts',
  'Mailles & Pulls',
  'Vestes & Manteaux',
  'Jupes & Shorts',
  'Accessoires'
];

export const ProductCatalogSection: React.FC<ProductCatalogSectionProps> = ({
  products,
  storeStocks,
  onSelectReference,
  onOpenNewProduct,
  onOpenDistributionForProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | 'Toutes'>('Toutes');
  const [sortBy, setSortBy] = useState<'reference' | 'centralStock' | 'networkStock' | 'price'>('reference');

  // Calculate network distribution count for each product
  const productsWithStats = useMemo(() => {
    return products.map(product => {
      const relevantStocks = storeStocks.filter(s => s.productId === product.id);
      const networkStock = relevantStocks.reduce((sum, s) => sum + s.totalQuantity, 0);
      const storeCount = relevantStocks.filter(s => s.totalQuantity > 0).length;

      return {
        ...product,
        networkStock,
        storeCount,
      };
    });
  }, [products, storeStocks]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return productsWithStats.filter(item => {
      if (selectedCategory !== 'Toutes' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.reference.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.barcode.includes(q) ||
          item.color.toLowerCase().includes(q) ||
          item.material.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'reference') return a.reference.localeCompare(b.reference);
      if (sortBy === 'centralStock') return b.centralStock - a.centralStock;
      if (sortBy === 'networkStock') return b.networkStock - a.networkStock;
      if (sortBy === 'price') return b.unitRetailPrice - a.unitRetailPrice;
      return 0;
    });
  }, [productsWithStats, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par réf (REF-...), nom, code-barres..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="reference">Trier par Référence</option>
            <option value="centralStock">Stock Entrepôt (Décroissant)</option>
            <option value="networkStock">Stock en Magasins (Décroissant)</option>
            <option value="price">Prix de Vente (Décroissant)</option>
          </select>

          <button
            onClick={onOpenNewProduct}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Référence</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 hover:border-indigo-500/50 transition-all flex flex-col justify-between shadow-md group"
          >
            <div>
              {/* Reference Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {product.reference}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                  {product.category}
                </span>
              </div>

              {/* Title & Specs */}
              <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                {product.name}
              </h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                {product.color} • {product.material}
              </p>

              {/* Barcode & Season */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-700/60">
                <span className="flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5" />
                  {product.barcode}
                </span>
                <span className="font-sans text-slate-400">{product.season}</span>
              </div>

              {/* Sizes */}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {product.sizes.map((sz) => (
                  <span key={sz} className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-semibold">
                    {sz}
                  </span>
                ))}
              </div>

              {/* Stock Comparison Grid */}
              <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">Entrepôt Central</span>
                  <span className="font-mono text-base font-bold text-amber-400">
                    {product.centralStock} <span className="text-[10px] text-slate-500">pcs</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">En Magasins</span>
                  <span className="font-mono text-base font-bold text-emerald-400">
                    {product.networkStock} <span className="text-[10px] text-slate-500">pcs</span>
                  </span>
                  <span className="text-[10px] text-slate-500 block">({product.storeCount} boutiques)</span>
                </div>
              </div>
            </div>

            {/* Price & CTA Button */}
            <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block text-[10px]">Prix Vente</span>
                <span className="text-sm font-extrabold text-white font-mono">
                  {product.unitRetailPrice.toFixed(2)} €
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenDistributionForProduct(product.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold transition-all cursor-pointer"
                  title="Expédier ce vêtement vers un magasin"
                >
                  Distribuer
                </button>

                <button
                  onClick={() => onSelectReference(product.reference)}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition-colors cursor-pointer"
                  title="Voir les magasins approvisionnés pour cette référence"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
