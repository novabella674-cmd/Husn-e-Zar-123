import React, { useState } from 'react';
import { Order, CurrencyCode } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { db } from '../../utils/storage';
import { X, Search, Package, CheckCircle2, Clock, Truck, MapPin, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  currency: CurrencyCode;
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<Props> = ({ isOpen, currency, onClose }) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const q = searchQuery.trim().toLowerCase();
    const orders = db.getOrders();
    const found = orders.find(
      (o) => o.id.toLowerCase() === q || o.customerEmail.toLowerCase() === q
    );

    setSearchedOrder(found || null);
    setSearched(true);
  };

  const getStepActive = (status: Order['status'], step: string) => {
    const steps = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    const currentIdx = steps.indexOf(status);
    const stepIdx = steps.indexOf(step);
    if (status === 'Cancelled') return false;
    return stepIdx <= currentIdx;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-900/10">
        {/* Header */}
        <div className="p-5 bg-amber-950 text-amber-100 flex items-center justify-between border-b border-amber-900">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-serif font-bold">Track Your Royal Delivery</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-amber-900 text-amber-300 hover:text-amber-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order ID (e.g. HZB-10891) or Email"
                className="w-full pl-10 pr-3 py-2.5 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-800"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-amber-100 font-semibold text-xs rounded-xl transition-colors shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Results */}
          {searched && !searchedOrder && (
            <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200">
              <p className="text-sm font-semibold text-rose-800">No order found</p>
              <p className="text-xs text-rose-600 mt-1">
                Please verify your order ID or email address and try again.
              </p>
            </div>
          )}

          {searchedOrder && (
            <div className="space-y-5 animate-fade-in">
              {/* Status Header */}
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-900/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-500 font-medium">Order Reference:</span>
                  <p className="text-base font-mono font-bold text-amber-950">{searchedOrder.id}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-neutral-500 font-medium">Status:</span>
                  <p className="text-sm font-bold text-amber-900">{searchedOrder.status}</p>
                </div>
              </div>

              {/* Order Tracker Step Visualizer */}
              {searchedOrder.status !== 'Cancelled' ? (
                <div className="py-2">
                  <div className="relative flex items-center justify-between">
                    {/* Line behind */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-neutral-200 -translate-y-1/2 z-0" />

                    {['Pending', 'Processing', 'Shipped', 'Delivered'].map((step, idx) => {
                      const isActive = getStepActive(searchedOrder.status, step);
                      return (
                        <div key={step} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-sm ${
                              isActive
                                ? 'bg-amber-900 text-amber-100 ring-4 ring-amber-100'
                                : 'bg-white border-2 border-neutral-300 text-neutral-400'
                            }`}
                          >
                            {isActive ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span
                            className={`text-[10px] mt-1.5 font-semibold ${
                              isActive ? 'text-amber-900' : 'text-neutral-400'
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-rose-100 text-rose-800 text-xs font-semibold rounded-xl text-center">
                  This order has been cancelled.
                </div>
              )}

              {/* Tracking Number if shipped */}
              {searchedOrder.trackingNumber && (
                <div className="p-3 bg-neutral-100 rounded-xl text-xs flex justify-between items-center">
                  <span className="text-neutral-600 font-medium flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-amber-800" /> Express Tracking Number:
                  </span>
                  <span className="font-mono font-bold text-neutral-900">{searchedOrder.trackingNumber}</span>
                </div>
              )}

              {/* Shipping Address */}
              <div className="p-3 bg-neutral-50 rounded-xl text-xs space-y-1 border border-neutral-200">
                <span className="font-semibold text-neutral-800 block mb-1">Destination Address:</span>
                <p className="text-neutral-700">{searchedOrder.shippingAddress.fullName}</p>
                <p className="text-neutral-600">
                  {searchedOrder.shippingAddress.addressLine}, {searchedOrder.shippingAddress.city},{' '}
                  {searchedOrder.shippingAddress.country}
                </p>
              </div>

              {/* Items summary */}
              <div className="border-t border-neutral-200 pt-3">
                <span className="text-xs font-semibold text-neutral-700 mb-2 block">
                  Items Included ({searchedOrder.items.length}):
                </span>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {searchedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-neutral-700">
                      <span>
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(item.priceUSD * item.quantity, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
