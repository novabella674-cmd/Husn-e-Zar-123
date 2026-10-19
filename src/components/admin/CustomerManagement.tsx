import React, { useState, useMemo } from 'react';
import { Customer, CustomerTier, Order, CurrencyCode } from '../../types';
import { db } from '../../utils/storage';
import { formatCurrency, getCustomerTierBadgeClass, validateEmail } from '../../utils/formatters';
import { Pagination } from '../common/Pagination';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { 
  Users, Search, Filter, Plus, Edit, Trash2, Eye, Download, CheckCircle, XCircle, X
} from 'lucide-react';

interface Props {
  customers: Customer[];
  orders: Order[];
  currency: CurrencyCode;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const CustomerManagement: React.FC<Props> = ({
  customers,
  orders,
  currency,
  addToast,
}) => {
  // State
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'totalSpentUSD' | 'joinedAt' | 'name'>('totalSpentUSD');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    tier: 'Standard' as CustomerTier,
    loyaltyPoints: '0',
    isActive: true,
    notes: '',
  });

  // Filtered & Sorted
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q);

      const matchTier = selectedTier === 'all' || c.tier === selectedTier;
      const matchStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && c.isActive) ||
        (selectedStatus === 'inactive' && !c.isActive);

      return matchSearch && matchTier && matchStatus;
    }).sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [customers, search, selectedTier, selectedStatus, sortBy, sortOrder]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;

  // Handlers
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      city: 'Lahore',
      country: 'Pakistan',
      tier: 'Standard',
      loyaltyPoints: '0',
      isActive: true,
      notes: '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      email: c.email,
      phone: c.phone || '',
      city: c.city || '',
      country: c.country || '',
      tier: c.tier,
      loyaltyPoints: c.loyaltyPoints.toString(),
      isActive: c.isActive,
      notes: c.notes || '',
    });
    setIsAddEditOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addToast('error', 'Validation Error', 'Customer Name is required');
      return;
    }
    if (!validateEmail(formData.email)) {
      addToast('error', 'Validation Error', 'Please enter a valid email address');
      return;
    }

    const points = parseInt(formData.loyaltyPoints, 10) || 0;

    if (editingCustomer) {
      const updated = db.updateCustomer(editingCustomer.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        tier: formData.tier,
        loyaltyPoints: points,
        isActive: formData.isActive,
        notes: formData.notes.trim(),
      });

      if (updated) {
        addToast('success', 'Customer Updated', `${updated.name}'s profile saved.`);
      }
    } else {
      const created = db.addCustomer({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim() || 'Dubai',
        country: formData.country.trim() || 'UAE',
        tier: formData.tier,
        loyaltyPoints: points,
        totalOrdersCount: 0,
        totalSpentUSD: 0,
        isActive: formData.isActive,
        notes: formData.notes.trim(),
      });

      addToast('success', 'Customer Created', `${created.name} registered.`);
    }

    setIsAddEditOpen(false);
  };

  const handleDeleteCustomer = (id: string) => {
    const c = customers.find(item => item.id === id);
    const success = db.deleteCustomer(id);
    if (success) {
      addToast('success', 'Customer Deleted', `${c?.name || 'Customer'} removed.`);
    } else {
      addToast('error', 'Delete Failed', 'Customer not found.');
    }
  };

  const handleToggleActive = (c: Customer) => {
    db.updateCustomer(c.id, { isActive: !c.isActive });
    addToast('info', 'Customer Status Changed', `${c.name} set to ${!c.isActive ? 'Active' : 'Inactive'}.`);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'City', 'Country', 'Tier', 'Loyalty Points', 'Total Orders', 'Total Spent USD', 'Status'];
    const rows = filteredCustomers.map(c => [
      c.id,
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.phone}"`,
      `"${c.city}"`,
      `"${c.country}"`,
      c.tier,
      c.loyaltyPoints,
      c.totalOrdersCount,
      c.totalSpentUSD,
      c.isActive ? 'Active' : 'Inactive',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `husnezar_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Export Complete', 'Exported customer roster to CSV.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-stone-900 border border-stone-800 shadow-md">
        <div>
          <h2 className="text-xl font-serif font-bold text-amber-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>Customer CRM & Royal VIP Directory</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Manage client profiles, tier privileges, loyalty points, and lifetime purchase history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium text-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone, city..."
              className="w-full bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2.5 focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All VIP Tiers</option>
              <option value="VIP Royal">VIP Royal ($1,000+)</option>
              <option value="Gold">Gold ($400+)</option>
              <option value="Silver">Silver ($150+)</option>
              <option value="Standard">Standard</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2.5 focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Account Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow-md">
        {paginatedCustomers.length === 0 ? (
          <div className="py-12 text-center text-stone-400 space-y-3">
            <Users className="w-12 h-12 text-stone-600 mx-auto stroke-1" />
            <p className="text-base font-serif font-semibold text-stone-300">No customers match filter criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="text-[11px] uppercase tracking-wider text-stone-500 bg-stone-950/60 border-b border-stone-800">
                <tr>
                  <th className="py-3 px-3">Customer Profile</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">VIP Tier</th>
                  <th className="py-3 px-3">Orders</th>
                  <th className="py-3 px-3">Total Lifetime Spend</th>
                  <th className="py-3 px-3">Points</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {paginatedCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-serif font-bold text-stone-100 text-sm">{c.name}</p>
                      <p className="text-[10px] text-stone-400">{c.email} | {c.phone}</p>
                    </td>

                    <td className="py-3 px-3 text-stone-300">
                      {c.city}, {c.country}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${getCustomerTierBadgeClass(c.tier)}`}>
                        {c.tier}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-stone-200">
                      {c.totalOrdersCount} orders
                    </td>

                    <td className="py-3 px-3 font-bold text-amber-300">
                      {formatCurrency(c.totalSpentUSD, currency)}
                    </td>

                    <td className="py-3 px-3 font-mono text-stone-300">
                      {c.loyaltyPoints} pts
                    </td>

                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          c.isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {c.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{c.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingCustomer(c)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800"
                          title="View Order History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800"
                          title="Edit Profile"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(c.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800"
                          title="Delete Customer"
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
          totalItems={filteredCustomers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Add / Edit Customer Modal */}
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
              {editingCustomer ? 'Edit Client Profile' : 'Register New Client'}
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Update VIP loyalty status, tier perks, and contact details.
            </p>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">VIP Tier</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value as CustomerTier })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="VIP Royal">VIP Royal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">Loyalty Points</label>
                  <input
                    type="number"
                    value={formData.loyaltyPoints}
                    onChange={(e) => setFormData({ ...formData, loyaltyPoints: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-300 mb-1">Notes / Preferences</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  <span>Account Active</span>
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer History Drawer/Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-stone-900 text-stone-100 rounded-2xl border border-stone-800 shadow-2xl p-6 overflow-hidden">
            <button
              onClick={() => setViewingCustomer(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-4">
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${getCustomerTierBadgeClass(viewingCustomer.tier)}`}>
                  {viewingCustomer.tier}
                </span>
                <h3 className="text-xl font-serif font-bold text-amber-100 mt-1">{viewingCustomer.name}</h3>
                <p className="text-xs text-stone-400">{viewingCustomer.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-400">Lifetime Spend</p>
                <p className="text-lg font-serif font-bold text-amber-300">
                  {formatCurrency(viewingCustomer.totalSpentUSD, currency)}
                </p>
              </div>
            </div>

            {/* Past Orders List */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Order History</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4 pr-1">
              {orders.filter(o => o.customerEmail.toLowerCase() === viewingCustomer.email.toLowerCase()).length === 0 ? (
                <p className="text-xs text-stone-500 py-4 text-center">No orders recorded for this customer yet.</p>
              ) : (
                orders
                  .filter(o => o.customerEmail.toLowerCase() === viewingCustomer.email.toLowerCase())
                  .map(o => (
                    <div key={o.id} className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono font-bold text-amber-400">{o.id}</span>
                        <p className="text-[10px] text-stone-500">{new Date(o.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-stone-200">{formatCurrency(o.totalUSD, currency)}</span>
                        <p className="text-[10px] text-emerald-400">{o.status}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewingCustomer(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-medium"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteConfirmId}
        title="Delete Customer Profile?"
        message="Are you sure you want to permanently remove this customer profile? Order histories will remain unaffected."
        confirmLabel="Delete Customer"
        onConfirm={() => deleteConfirmId && handleDeleteCustomer(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
