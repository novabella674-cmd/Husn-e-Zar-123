import React from 'react';
import { Product, Order, Customer, Voucher, CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { 
  DollarSign, Package, ShoppingBag, Users, AlertTriangle, TrendingUp, Tag, ShieldCheck, ArrowRight
} from 'lucide-react';

interface Props {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  vouchers: Voucher[];
  currency: CurrencyCode;
  onNavigateTab: (tab: any) => void;
}

export const AdminDashboard: React.FC<Props> = ({
  products,
  orders,
  customers,
  vouchers,
  currency,
  onNavigateTab,
}) => {
  // Metrics calculation
  const totalRevenueUSD = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalUSD, 0);

  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Processing');
  const lowStockProducts = products.filter(p => p.stockQuantity <= 15 && p.status === 'active');
  const activeVouchers = vouchers.filter(v => v.isActive);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="p-8 rounded-2xl bg-white border border-[#EEEEEE] text-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-[#B88E8D] text-xs font-semibold uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>HUSN-E-ZAR GLOBAL HQ</span>
          </div>
          <h2 className="text-3xl font-light tracking-tight text-[#1A1A1A]">Executive Dashboard</h2>
          <p className="text-xs text-[#999999] mt-1">
            Real-time catalog performance, regional orders, client tiers, and global inventory nodes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('products')}
            className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-full text-xs font-medium tracking-widest hover:bg-[#333333] transition-colors shadow-xs cursor-pointer uppercase"
          >
            + ADD PRODUCT
          </button>
          <button
            onClick={() => onNavigateTab('orders')}
            className="px-5 py-2.5 rounded-full bg-white text-[#1A1A1A] font-medium text-xs border border-[#EEEEEE] hover:bg-[#F5F5F5] transition-colors cursor-pointer uppercase tracking-wider"
          >
            Orders ({pendingOrders.length})
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs hover:border-[#B88E8D]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Total Sales</span>
            <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-light text-[#1A1A1A]">
            {formatCurrency(totalRevenueUSD, currency)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 mt-2 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>From {orders.length} total orders</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs hover:border-[#B88E8D]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Active Orders</span>
            <div className="p-2 rounded-full bg-amber-50 text-amber-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-light text-[#1A1A1A]">
            {pendingOrders.length}
          </div>
          <div className="text-[11px] text-[#999999] mt-2">
            Requires fulfillment
          </div>
        </div>

        {/* Active Products */}
        <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs hover:border-[#B88E8D]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Active SKU</span>
            <div className="p-2 rounded-full bg-purple-50 text-purple-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-light text-[#1A1A1A]">
            {products.length}
          </div>
          <div className="text-[11px] text-[#B88E8D] mt-2 font-medium">
            {products.filter(p => p.status === 'active').length} live in catalog
          </div>
        </div>

        {/* Total Customers */}
        <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs hover:border-[#B88E8D]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-[#999999]">VIP Directory</span>
            <div className="p-2 rounded-full bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-light text-[#1A1A1A]">
            {customers.length}
          </div>
          <div className="text-[11px] text-blue-600 mt-2 font-medium">
            {customers.filter(c => c.tier === 'VIP Royal').length} VIP Royal members
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Orders & Inventory Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EEEEEE]">
            <h3 className="text-base font-semibold text-[#1A1A1A] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#B88E8D]" />
              <span>Recent Customer Orders</span>
            </h3>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-[#B88E8D] hover:text-[#A27675] font-medium flex items-center gap-1 uppercase tracking-wider"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1A1A1A]">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#EEEEEE]">
                  <th className="py-3 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Order ID</th>
                  <th className="py-3 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Customer</th>
                  <th className="py-3 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Total</th>
                  <th className="py-3 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Status</th>
                  <th className="py-3 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEEEE]">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-[#FDFDFD] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#B88E8D]">{order.id}</td>
                    <td className="py-3.5 px-4 font-medium text-[#1A1A1A]">{order.customerName}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#1A1A1A]">
                      {formatCurrency(order.totalUSD, currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' :
                        order.status === 'Shipped' ? 'bg-purple-50 text-purple-600' :
                        order.status === 'Processing' ? 'bg-blue-50 text-blue-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#999999]">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Watchlist & Active Vouchers */}
        <div className="space-y-6">
          {/* Low Stock Alert Box */}
          <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EEEEEE]">
              <h3 className="text-base font-semibold text-[#1A1A1A] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span>Low Stock Alert</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold uppercase">
                {lowStockProducts.length} SKU
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-[#999999] py-4 text-center">All active SKUs have sufficient stock levels.</p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="p-3 rounded-xl bg-[#FAFAFA] border border-[#EEEEEE] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-[#1A1A1A] line-clamp-1">{p.name}</p>
                        <p className="text-[10px] text-[#999999] font-mono">SKU: {p.sku}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                      {p.stockQuantity} left
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => onNavigateTab('products')}
              className="w-full mt-2 py-2.5 rounded-full bg-[#FAFAFA] hover:bg-[#F5F5F5] text-[#1A1A1A] border border-[#EEEEEE] text-xs font-medium text-center transition-colors block uppercase tracking-wider"
            >
              Restock SKU Catalog
            </button>
          </div>

          {/* Active Vouchers Box */}
          <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EEEEEE]">
              <h3 className="text-base font-semibold text-[#1A1A1A] flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#B88E8D]" />
                <span>Active Promo Codes</span>
              </h3>
              <button
                onClick={() => onNavigateTab('vouchers')}
                className="text-xs text-[#B88E8D] hover:text-[#A27675] font-medium uppercase tracking-wider"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2">
              {activeVouchers.slice(0, 3).map(v => (
                <div key={v.id} className="p-3 rounded-xl bg-[#FAFAFA] border border-[#EEEEEE] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#B88E8D] bg-white px-2 py-0.5 rounded border border-[#EEEEEE]">
                      {v.code}
                    </span>
                    <p className="text-[11px] text-[#999999] mt-1 line-clamp-1">{v.description}</p>
                  </div>
                  <span className="text-[10px] text-[#999999]">{v.usageCount} used</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
