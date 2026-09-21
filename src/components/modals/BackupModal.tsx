import React, { useState } from 'react';
import { X, Database, Download, Upload, RefreshCw, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { StorageService } from '../../services/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const dataStr = StorageService.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `distri-textile-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatusMsg({ text: 'Sauvegarde JSON téléchargée avec succès.', type: 'success' });
    } catch (e) {
      setStatusMsg({ text: 'Erreur lors de l\'export.', type: 'error' });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = StorageService.importData(content);
        if (result.success) {
          setStatusMsg({ text: result.message, type: 'success' });
          onDataChanged();
        } else {
          setStatusMsg({ text: result.message, type: 'error' });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('Voulez-vous réinitialiser toutes les données avec le jeu d\'essai initial de vêtements et magasins ?')) {
      StorageService.resetToDefault();
      setStatusMsg({ text: 'Données réinitialisées avec succès aux valeurs de démonstration.', type: 'success' });
      onDataChanged();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Base de Données & Sauvegardes
              </h3>
              <p className="text-xs text-slate-400">
                Gestion de la persistance locale et transfert de données
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {statusMsg && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-800/80 text-rose-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-xs text-slate-300 space-y-2">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              Base de Données Centralisée
            </p>
            <p className="text-slate-400 leading-relaxed">
              Toutes vos références d'habillement, points de vente, distributions et historiques sont synchronisés et stockés en continu dans le stockage de votre navigateur.
            </p>
          </div>

          {/* Action Blocks */}
          <div className="space-y-3">
            {/* Export */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800 border border-slate-700">
              <div>
                <p className="text-xs font-bold text-white">Exporter la Base (Fichier JSON)</p>
                <p className="text-[11px] text-slate-400">Télécharger une sauvegarde complète de tous vos stocks</p>
              </div>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter</span>
              </button>
            </div>

            {/* Import */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800 border border-slate-700">
              <div>
                <p className="text-xs font-bold text-white">Restaurer / Importer une Sauvegarde</p>
                <p className="text-[11px] text-slate-400">Charger un fichier JSON exporté précédemment</p>
              </div>
              <label className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Importer</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
              <div>
                <p className="text-xs font-bold text-rose-300">Réinitialiser les Données Démo</p>
                <p className="text-[11px] text-slate-500">Restaurer le catalogue initial avec les 8 modèles et 6 magasins</p>
              </div>
              <button
                onClick={handleResetData}
                className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Footer close */}
          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
