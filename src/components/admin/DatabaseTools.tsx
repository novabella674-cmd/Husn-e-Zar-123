import React, { useState } from 'react';
import { db } from '../../utils/storage';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { 
  Database, Download, Upload, RefreshCw, Trash2, ShieldCheck, FileCode, CheckCircle, HardDrive
} from 'lucide-react';

interface Props {
  addToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
  onRefreshData: () => void;
}

export const DatabaseTools: React.FC<Props> = ({ addToast, onRefreshData }) => {
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  // Download Backup JSON file
  const handleExportBackup = () => {
    try {
      const jsonStr = db.exportDatabaseJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `husnezar_db_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('success', 'Backup Exported', 'Central database JSON exported successfully.');
    } catch (err) {
      addToast('error', 'Export Failed', 'Could not generate backup file.');
    }
  };

  // Import Backup JSON
  const handleImportBackup = () => {
    if (!jsonInput.trim()) {
      addToast('error', 'Import Error', 'Please paste valid JSON data.');
      return;
    }
    const result = db.importDatabaseJSON(jsonInput);
    if (result.success) {
      addToast('success', 'Database Restored', result.message);
      onRefreshData();
      setShowImportModal(false);
      setJsonInput('');
    } else {
      addToast('error', 'Import Error', result.message);
    }
  };

  // Seed Default Data
  const handleSeedDefaults = () => {
    db.resetToDefault();
    onRefreshData();
    addToast('success', 'Data Seeded', 'Sample products, orders, categories, and vouchers re-loaded.');
  };

  // Reset Everything
  const handleResetDatabase = () => {
    db.resetToDefault();
    onRefreshData();
    addToast('warning', 'Database Reset', 'LocalStorage entries reset to defaults.');
  };

  const dbStats = {
    products: db.getProducts().length,
    orders: db.getOrders().length,
    customers: db.getCustomers().length,
    categories: db.getCategories().length,
    vouchers: db.getVouchers().length,
    reviews: db.getReviews().length,
    banners: db.getBanners().length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#B88E8D] text-xs font-semibold uppercase tracking-widest mb-1">
            <Database className="w-4 h-4" />
            <span>CENTRAL LOCALSTORAGE ENGINE</span>
          </div>
          <h2 className="text-2xl font-light text-[#1A1A1A]">Database Control & Maintenance</h2>
          <p className="text-xs text-[#999999] mt-1">
            Backup, restore, seed initial luxury records, or perform a complete state purge.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBackup}
            className="px-5 py-2.5 rounded-full bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-medium flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#B88E8D]" />
            <span>EXPORT BACKUP</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-[#F5F5F5] text-[#1A1A1A] border border-[#EEEEEE] text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#B88E8D]" />
            <span>IMPORT JSON</span>
          </button>
        </div>
      </div>

      {/* Database Statistics */}
      <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[#B88E8D]" />
          <span>Active Collection Record Counts</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(dbStats).map(([key, count]) => (
            <div key={key} className="p-4 rounded-xl bg-[#FAFAFA] border border-[#EEEEEE] text-center">
              <span className="text-[10px] uppercase tracking-widest text-[#999999] block font-medium">{key}</span>
              <span className="text-xl font-semibold text-[#1A1A1A] mt-1 block">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Seed Data */}
        <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs space-y-3">
          <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 w-fit">
            <RefreshCw className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-[#1A1A1A]">Seed Default Catalog</h4>
          <p className="text-xs text-[#999999] leading-relaxed">
            Restores the initial suite of Husn-e-Zar products, categories, discount codes, and customer profiles into LocalStorage.
          </p>
          <button
            onClick={() => setSeedConfirmOpen(true)}
            className="w-full mt-2 py-2.5 rounded-full bg-[#FAFAFA] hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-[#1A1A1A] border border-[#EEEEEE] text-xs font-medium transition-colors cursor-pointer"
          >
            Run Default Seeder
          </button>
        </div>

        {/* Download JSON */}
        <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs space-y-3">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600 w-fit">
            <FileCode className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-[#1A1A1A]">Download JSON Dump</h4>
          <p className="text-xs text-[#999999] leading-relaxed">
            Generates a complete standalone JSON file containing all tables, settings, products, and customer orders.
          </p>
          <button
            onClick={handleExportBackup}
            className="w-full mt-2 py-2.5 rounded-full bg-[#FAFAFA] hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-[#1A1A1A] border border-[#EEEEEE] text-xs font-medium transition-colors cursor-pointer"
          >
            Download Database File
          </button>
        </div>

        {/* Purge Database */}
        <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs space-y-3">
          <div className="p-3 rounded-full bg-rose-50 text-rose-600 w-fit">
            <Trash2 className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-[#1A1A1A]">Purge All Records</h4>
          <p className="text-xs text-[#999999] leading-relaxed">
            Wipes all LocalStorage keys associated with this app. Useful for resetting state completely before a fresh test run.
          </p>
          <button
            onClick={() => setResetConfirmOpen(true)}
            className="w-full mt-2 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Wipe LocalStorage
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#EEEEEE] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold text-[#1A1A1A]">Import Database JSON</h3>
            <p className="text-xs text-[#999999]">
              Paste a previously exported Husn-e-Zar JSON backup string below to overwrite current tables.
            </p>
            <textarea
              rows={8}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste JSON content here..."
              className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl p-3 text-xs font-mono text-[#1A1A1A] focus:outline-none focus:border-[#B88E8D]"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-full border border-[#EEEEEE] text-xs font-medium text-[#1A1A1A] hover:bg-[#F5F5F5]"
              >
                Cancel
              </button>
              <button
                onClick={handleImportBackup}
                className="px-5 py-2 rounded-full bg-[#1A1A1A] text-white text-xs font-medium hover:bg-[#333333]"
              >
                Restore JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={seedConfirmOpen}
        title="Seed Initial Sample Data?"
        message="This will re-populate default products, categories, vouchers, and customer records. Existing custom additions will be merged or reset."
        confirmLabel="Yes, Seed Data"
        variant="info"
        onConfirm={handleSeedDefaults}
        onClose={() => setSeedConfirmOpen(false)}
      />

      <ConfirmationModal
        isOpen={resetConfirmOpen}
        title="Wipe Entire LocalStorage Database?"
        message="Warning: This action will permanently delete all stored products, orders, categories, customer profiles, vouchers, and reviews from browser memory."
        confirmLabel="Yes, Wipe Database"
        variant="danger"
        onConfirm={handleResetDatabase}
        onClose={() => setResetConfirmOpen(false)}
      />
    </div>
  );
};
