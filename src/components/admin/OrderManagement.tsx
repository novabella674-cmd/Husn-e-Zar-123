import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, Product, CurrencyCode } from '../../types';
import { db } from '../../utils/storage';
import { formatCurrency, formatDate, generateOrderID } from '../../utils/formatters';
import { Pagination } from '../common/Pagination';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { 
  ShoppingBag, Search, Filter, Eye, Edit, Trash2, Printer, Plus, X, Truck, Check, Calendar, ArrowUpDown
} from 'lucide-react';

interface Props {
  orders: Order[];
  products: Product[];
  currency: CurrencyCode;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const OrderManagement: React.FC<Props> = ({
  orders,
  products,
  currency,
  addToast,
}) => {
  // State
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'totalUSD'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);

  // Edit Form State
  const [editStatus, setEditStatus] = useState<OrderStatus>('Pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'Paid' | 'Unpaid' | 'Refunded'>('Unpaid');
  const [editTrackingNumber, setEditTrackingNumber] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Add Manual Order Form State
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerEmail, setManualCustomerEmail] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualSelectedProductId, setManualSelectedProductId] = useState('');
  const [manualQuantity, setManualQuantity] = useState(1);
  const [manualItems, setManualItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'Cash on Delivery' | 'Credit / Debit Card'>('Cash on Delivery');

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q));

      const matchStatus = selectedStatus === 'all' || o.status === selectedStatus;
      const matchPayment = selectedPaymentStatus === 'all' || o.paymentStatus === selectedPaymentStatus;

      return matchSearch && matchStatus && matchPayment;
    }).sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];
      if (typeof valA === 'string') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orders, search, selectedStatus, selectedPaymentStatus, sortBy, sortOrder]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;

  // Handlers
  const handleOpenEdit = (o: Order) => {
    setEditingOrder(o);
    setEditStatus(o.status);
    setEditPaymentStatus(o.paymentStatus);
    setEditTrackingNumber(o.trackingNumber || '');
    setEditNotes(o.notes || '');
  };

  const handleSaveEditOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    const updated = db.updateOrder(editingOrder.id, {
      status: editStatus,
      paymentStatus: editPaymentStatus,
      trackingNumber: editTrackingNumber.trim(),
      notes: editNotes.trim(),
    });

    if (updated) {
      addToast('success', 'Order Updated', `Order ${updated.id} status set to ${editStatus}.`);
    } else {
      addToast('error', 'Update Failed', 'Could not update order.');
    }

    setEditingOrder(null);
  };

  const handleDeleteOrder = (id: string) => {
    const success = db.deleteOrder(id);
    if (success) {
      addToast('success', 'Order Deleted', `Order ${id} removed from LocalStorage.`);
    }
  };

  const handleAddManualItem = () => {
    const p = products.find(prod => prod.id === manualSelectedProductId);
    if (!p) return;
    setManualItems([...manualItems, { product: p, quantity: manualQuantity }]);
    setManualSelectedProductId('');
    setManualQuantity(1);
  };

  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualItems.length === 0) {
      addToast('error', 'Validation Error', 'Please add at least one product item.');
      return;
    }

    const orderItems = manualItems.map(mi => ({
      productId: mi.product.id,
      productName: mi.product.name,
      sku: mi.product.sku,
      imageUrl: mi.product.imageUrl,
      priceUSD: mi.product.priceUSD,
      quantity: mi.quantity,
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.priceUSD * item.quantity, 0);

    const newOrder = db.addOrder({
      id: generateOrderID(),
      customerName: manualCustomerName.trim() || 'Guest Client',
      customerEmail: manualCustomerEmail.trim() || 'client@husnezar.com',
      customerPhone: manualCustomerPhone.trim() || '+1-800-HUSN-ZAR',
      shippingAddress: {
        fullName: manualCustomerName.trim() || 'Guest Client',
        email: manualCustomerEmail.trim() || 'client@husnezar.com',
        phone: manualCustomerPhone.trim() || '+1-800-HUSN-ZAR',
        addressLine: manualAddress.trim() || 'Executive Suite',
        city: manualCity.trim() || 'Dubai',
        country: 'UAE',
        postalCode: '00000',
      },
      items: orderItems,
      subtotalUSD: subtotal,
      discountUSD: 0,
      shippingFeeUSD: 0,
      totalUSD: subtotal,
      paymentMethod: manualPaymentMethod,
      paymentStatus: 'Paid',
      status: 'Processing',
    });

    addToast('success', 'Manual Order Created', `Order ${newOrder.id} successfully recorded.`);
    setIsAddManualOpen(false);
    setManualItems([]);
    setManualCustomerName('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Action Header */}
      <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#B88E8D] text-xs font-semibold uppercase tracking-widest mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>GLOBAL ORDER PROCESSING</span>
          </div>
          <h2 className="text-2xl font-light text-[#1A1A1A]">Customer Orders & Logistics</h2>
          <p className="text-xs text-[#999999] mt-1">
            Fulfill client purchases, update tracking numbers, print invoices, and record phone orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddManualOpen(true)}
            className="px-5 py-2.5 rounded-full bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-medium uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#B88E8D]" />
            <span>RECORD MANUAL ORDER</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="p-5 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Order ID, Client Name, Email, or Tracking..."
              className="w-full bg-[#FAFAFA] border border-[#EEEEEE] text-[#1A1A1A] text-xs rounded-full pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#B88E8D]"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#FAFAFA] border border-[#EEEEEE] text-[#1A1A1A] text-xs rounded-full px-3 py-2.5 focus:outline-none focus:border-[#B88E8D] cursor-pointer"
            >
              <option value="all">All Order Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => {
                setSelectedPaymentStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#FAFAFA] border border-[#EEEEEE] text-[#1A1A1A] text-xs rounded-full px-3 py-2.5 focus:outline-none focus:border-[#B88E8D] cursor-pointer"
            >
              <option value="all">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-white border border-[#EEEEEE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1A1A1A]">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#EEEEEE]">
                <th className="py-3.5 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Order ID</th>
                <th className="py-3.5 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Client</th>
                <th className="py-3.5 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Total</th>
                <th className="py-3.5 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Status</th>
                <th className="py-3.5 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Payment</th>
                <th className="py-3.5 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Date</th>
                <th className="py-3.5 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEEEE]">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#999999]">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-[#999999]" />
                    <p className="text-sm font-medium">No orders found</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#B88E8D]">{o.id}</td>
                    <td className="py-3.5 px-4 font-medium text-[#1A1A1A]">{o.customerName}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#1A1A1A]">
                      {formatCurrency(o.totalUSD, currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                        o.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' :
                        o.status === 'Shipped' ? 'bg-purple-50 text-purple-600' :
                        o.status === 'Processing' ? 'bg-blue-50 text-blue-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        o.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#999999]">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingOrder(o)}
                          className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#999999] hover:text-[#1A1A1A]"
                          title="View Order"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(o)}
                          className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#999999] hover:text-[#B88E8D]"
                          title="Update Logistics"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPrintingOrder(o)}
                          className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#999999] hover:text-[#1A1A1A]"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(o.id)}
                          className="p-1.5 rounded-full hover:bg-rose-50 text-[#999999] hover:text-rose-600"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredOrders.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Edit Logistics Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#EEEEEE] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEEEEE]">
              <h3 className="text-base font-semibold text-[#1A1A1A]">Update Order Logistics</h3>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-1 rounded-full text-[#999999] hover:text-[#1A1A1A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOrder} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#999999] font-semibold mb-1">
                  Fulfillment Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                  className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl px-3 py-2 text-[#1A1A1A]"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#999999] font-semibold mb-1">
                  Payment Status
                </label>
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                  className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl px-3 py-2 text-[#1A1A1A]"
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#999999] font-semibold mb-1">
                  Logistics Tracking Number
                </label>
                <input
                  type="text"
                  value={editTrackingNumber}
                  onChange={(e) => setEditTrackingNumber(e.target.value)}
                  placeholder="DHL-99201928"
                  className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl px-3 py-2 text-[#1A1A1A] font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EEEEEE]">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-full border border-[#EEEEEE] text-[#1A1A1A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1A1A1A] text-white font-medium hover:bg-[#333333]"
                >
                  Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteConfirmId}
        title="Delete Order Record?"
        message="Are you sure you want to permanently delete this order?"
        confirmLabel="Yes, Delete Order"
        variant="danger"
        onConfirm={() => deleteConfirmId && handleDeleteOrder(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
