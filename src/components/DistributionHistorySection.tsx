import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  ArrowRightLeft, 
  Send, 
  SlidersHorizontal, 
  Calendar, 
  Store as StoreIcon, 
  Tag, 
  User, 
  CheckCircle2 
} from 'lucide-react';
import { StockMovement, MovementType } from '../types';

interface DistributionHistorySectionProps {
  movements: StockMovement[];
  onSelectReference: (ref: string) => void;
}

export const DistributionHistorySection: React.FC<DistributionHistorySectionProps> = ({
  movements,
  onSelectReference,
}) => {
  const [filterType, setFilterType] = useState<MovementType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (filterType !== 'all' && m.type !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          m.productReference.toLowerCase().includes(q) ||
          m.productName.toLowerCase().includes(q) ||
          m.toLocationName.toLowerCase().includes(q) ||
          m.fromLocationName.toLowerCase().includes(q) ||
          m.referenceNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [movements, filterType, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer par réf, boutique, numéro..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 self-start sm:self-auto text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Tous ({movements.length})
          </button>
          <button
            onClick={() => setFilterType('distribution')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterType === 'distribution' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Distributions
          </button>
          <button
            onClick={() => setFilterType('transfer')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterType === 'transfer' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Transferts
          </button>
          <button
            onClick={() => setFilterType('adjustment')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterType === 'adjustment' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Ajustements
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">N° Mouvement & Date</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Référence Vêtement</th>
                <th className="py-3 px-3">Origine &rarr; Destination</th>
                <th className="py-3 px-3 text-center">Quantité</th>
                <th className="py-3 px-3">Détail Tailles</th>
                <th className="py-3 px-4">Opérateur & Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun mouvement enregistré pour ce filtre.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isDistribution = m.type === 'distribution';
                  const isTransfer = m.type === 'transfer';

                  return (
                    <tr key={m.id} className="hover:bg-slate-750/50 transition-colors">
                      {/* Movement Number & Date */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-200 block text-xs">{m.referenceNumber}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(m.date).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-3">
                        {isDistribution ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            <Send className="w-3 h-3" />
                            Distribution
                          </span>
                        ) : isTransfer ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <ArrowRightLeft className="w-3 h-3" />
                            Transfert
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            <SlidersHorizontal className="w-3 h-3" />
                            Ajustement
                          </span>
                        )}
                      </td>

                      {/* Reference & Name */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onSelectReference(m.productReference)}
                          className="font-mono font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer block"
                          title="Inspecter cette référence"
                        >
                          {m.productReference}
                        </button>
                        <span className="text-slate-300 text-[11px] line-clamp-1">{m.productName}</span>
                      </td>

                      {/* Origin and Destination */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-[11px] text-slate-300">
                          <span className="text-slate-400">{m.fromLocationName}</span>
                          <span className="text-indigo-400 font-bold">&rarr;</span>
                          <span className="font-semibold text-white">{m.toLocationName}</span>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold text-sm text-emerald-400">
                          {m.quantity} pcs
                        </span>
                      </td>

                      {/* Size details */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(m.sizeQuantities || {}).map(([sz, qty]) => {
                            if (!qty || Number(qty) <= 0) return null;
                            return (
                              <span key={sz} className="px-1.5 py-0.2 bg-slate-900 rounded text-[10px] font-mono text-slate-300">
                                {sz}:{qty}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Operator & Note */}
                      <td className="py-3 px-4">
                        <p className="text-[11px] text-slate-300 font-medium">{m.operator}</p>
                        {m.note && <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1">{m.note}</p>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
