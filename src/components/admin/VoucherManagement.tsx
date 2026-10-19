import React, { useState, useMemo } from 'react';
import { Voucher, DiscountType, CurrencyCode } from '../../types';
import { db } from '../../utils/storage';
import { formatCurrency, formatShortDate } from '../../utils/formatters';
import { Pagination } from '../common/Pagination';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { 
  Tag, Search, Plus, Edit, Trash2, Copy, CheckCircle, XCircle, X
} from 'lucide-react';

interface Props {
  vouchers: Voucher[];
  currency: CurrencyCode;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const VoucherManagement: React.FC<Props> = ({
  vouchers,
  currency,
  addToast,
}) => {
  // State
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as DiscountType,
    discountValue: '15',
    minPurchaseUSD: '50',
    maxDiscountUSD: '100',
    usageLimit: '200',
    isActive: true,
    startDate: new Date().toISOString().slice(0, 10),
    expiryDate: '2026-12-31',
  });

  // Filtered
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || v.code.toLowerCase().includes(q) || v.description.toLowerCase().includes(q);
      const matchStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && v.isActive) ||
        (selectedStatus === 'inactive' && !v.isActive);

      return matchSearch && matchStatus;
    });
  }, [vouchers, search, selectedStatus]);

  const paginatedVouchers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVouchers.slice(start, start + pageSize);
  }, [filteredVouchers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredVouchers.length / pageSize) || 1;

  // Handlers
  const handleOpenAdd = () => {
    setEditingVoucher(null);
    setFormData({
      code: 'LUXURY' + Math.floor(10 + Math.random() * 90),
      description: '15% OFF site-wide discount',
      discountType: 'percentage',
      discountValue: '15',
      minPurchaseUSD: '50',
      maxDiscountUSD: '100',
      usageLimit: '200',
      isActive: true,
      startDate: new Date().toISOString().slice(0, 10),
      expiryDate: '2026-12-31',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (v: Voucher) => {
    setEditingVoucher(v);
    setFormData({
      code: v.code,
      description: v.description,
      discountType: v.discountType,
      discountValue: v.discountValue.toString(),
      minPurchaseUSD: v.minPurchaseUSD.toString(),
      maxDiscountUSD: v.maxDiscountUSD ? v.maxDiscountUSD.toString() : '',
      usageLimit: v.usageLimit.toString(),
      isActive: v.isActive,
      startDate: v.startDate,
      expiryDate: v.expiryDate,
    });
    setIsAddEditOpen(true);
  };

  const handleSaveVoucher = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      addToast('error', 'Validation Error', 'Voucher Code is required');
      return;
    }

    const val = parseFloat(formData.discountValue);
    if (isNaN(val) || val <= 0) {
      addToast('error', 'Validation Error', 'Discount Value must be greater than zero');
      return;
    }

    const minUSD = parseFloat(formData.minPurchaseUSD) || 0;
    const maxUSD = formData.maxDiscountUSD ? parseFloat(formData.maxDiscountUSD) : undefined;
    const limit = parseInt(formData.usageLimit, 10) || 100;

    if (editingVoucher) {
      const updated = db.updateVoucher(editingVoucher.id, {
        code: formData.code.toUpperCase().trim(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: val,
        minPurchaseUSD: minUSD,
        maxDiscountUSD: maxUSD,
        usageLimit: limit,
        isActive: formData.isActive,
        startDate: formData.startDate,
        expiryDate: formData.expiryDate,
      });

      if (updated) {
        addToast('success', 'Voucher Saved', `Promo code ${updated.code} updated.`);
      }
    } else {
      // Check duplicate code
      const existing = db.getVoucherByCode(formData.code);
      if (existing) {
        addToast('error', 'Duplicate Code', `Voucher code ${formData.code} already exists.`);
        return;
      }

      const created = db.addVoucher({
        code: formData.code.toUpperCase().trim(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: val,
        minPurchaseUSD: minUSD,
        maxDiscountUSD: maxUSD,
        usageLimit: limit,
        isActive: formData.isActive,
        startDate: formData.startDate,
        expiryDate: formData.expiryDate,
      });

      addToast('success', 'Voucher Created', `Promo code ${created.code} activated.`);
    }

    setIsAddEditOpen(false);
  };

  const handleDeleteVoucher = (id: string) => {
    const v = vouchers.find(item => item.id === id);
    const success = db.deleteVoucher(id);
    if (success) {
      addToast('success', 'Voucher Deleted', `Promo code ${v?.code || 'Item'} removed.`);
    }
  };

  const handleToggleActive = (v: Voucher) => {
    db.updateVoucher(v.id, { isActive: !v.isActive });
    addToast('info', 'Voucher Status', `${v.code} set to ${!v.isActive ? 'Active' : 'Disabled'}.`);
  };

  const handleDuplicate = (v: Voucher) => {
    const newCode = `${v.code}-COPY`;
    db.addVoucher({
      ...v,
      code: newCode,
      description: `${v.description} (Copy)`,
      isActive: false,
    });
    addToast('success', 'Voucher Duplicated', `Created copy code ${newCode}.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-stone-900 border border-stone-800 shadow-md">
        <div>
          <h2 className="text-xl font-serif font-bold text-amber-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            <span>Promotions & Discount Vouchers</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Create coupon codes, percentage discounts, free shipping vouchers, and usage caps.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow-md cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Promo Code</span>
        </button>
      </div>

      {/* Filter */}
      <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search promo code or description..."
            className="w-full bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-amber-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as any)}
          className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2.5 focus:border-amber-500"
        >
          <option value="all">All Vouchers</option>
          <option value="active">Active Vouchers Only</option>
          <option value="inactive">Disabled Vouchers Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow-md">
        {paginatedVouchers.length === 0 ? (
          <div className="py-12 text-center text-stone-400 space-y-3">
            <Tag className="w-12 h-12 text-stone-600 mx-auto stroke-1" />
            <p className="text-base font-serif font-semibold text-stone-300">No vouchers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="text-[11px] uppercase tracking-wider text-stone-500 bg-stone-950/60 border-b border-stone-800">
                <tr>
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Discount Value</th>
                  <th className="py-3 px-3">Min Purchase</th>
                  <th className="py-3 px-3">Usage</th>
                  <th className="py-3 px-3">Valid Until</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {paginatedVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-stone-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-300 text-sm">
                      {v.code}
                    </td>

                    <td className="py-3 px-3 text-stone-200">{v.description}</td>

                    <td className="py-3 px-3 font-bold text-emerald-400">
                      {v.discountType === 'percentage'
                        ? `${v.discountValue}% OFF`
                        : v.discountType === 'fixed_amount'
                        ? `${formatCurrency(v.discountValue, currency)} OFF`
                        : 'Free Shipping'}
                    </td>

                    <td className="py-3 px-3 text-stone-400">
                      {formatCurrency(v.minPurchaseUSD, currency)}
                    </td>

                    <td className="py-3 px-3 font-mono text-stone-300">
                      {v.usageCount} / {v.usageLimit}
                    </td>

                    <td className="py-3 px-3 text-stone-400">
                      {formatShortDate(v.expiryDate)}
                    </td>

                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleActive(v)}
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          v.isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-stone-800 text-stone-400 border border-stone-700'
                        }`}
                      >
                        {v.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{v.isActive ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(v)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-blue-300 hover:bg-stone-800"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(v.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredVouchers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Add / Edit Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-stone-900 text-stone-100 rounded-2xl border border-stone-800 shadow-2xl p-6">
            <button
              onClick={() => setIsAddEditOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif font-bold text-amber-100 mb-1">
              {editingVoucher ? 'Edit Discount Voucher' : 'Create New Voucher'}
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Configure promo conditions, minimum spend requirements, and usage caps.
            </p>

            <form onSubmit={handleSaveVoucher} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-300 mb-1">Voucher Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. LUXURY20"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  >
                    <option value="percentage">Percentage OFF (%)</option>
                    <option value="fixed_amount">Fixed Amount OFF ($)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">Min Purchase ($ USD)</label>
                  <input
                    type="number"
                    value={formData.minPurchaseUSD}
                    onChange={(e) => setFormData({ ...formData, minPurchaseUSD: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">Max Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-300 mb-1">Public Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 15% OFF on orders over $50"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded-sm bg-stone-950 border-stone-700 text-amber-500 focus:ring-0"
                  />
                  <span>Code Active and Redeemable</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold"
                >
                  Save Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteConfirmId}
        title="Delete Promo Voucher?"
        message="Are you sure you want to delete this discount voucher? Customers will no longer be able to apply it during checkout."
        confirmLabel="Delete Voucher"
        onConfirm={() => deleteConfirmId && handleDeleteVoucher(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
