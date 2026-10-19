import React, { useState } from 'react';
import { Product, Voucher, Order, CurrencyCode, StoreSettings } from '../../types';
import { formatCurrency, validateEmail, validatePhone } from '../../utils/formatters';
import { db } from '../../utils/storage';
import { 
  X, Trash2, ShoppingBag, ArrowRight, Check, Tag, ShieldCheck, 
  CreditCard, Truck, AlertCircle, Sparkles, MapPin, Phone, User, Mail
} from 'lucide-react';

export interface CartItem {
  product: Product;
  quantity: number;
  shade?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: CurrencyCode;
  settings: StoreSettings;
  vouchers: Voucher[];
  onUpdateQuantity: (productId: string, quantity: number, shade?: string) => void;
  onRemoveItem: (productId: string, shade?: string) => void;
  onClearCart: () => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
  onOrderPlaced: (order: Order) => void;
}

export const CartDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  settings,
  vouchers,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  addToast,
  onOrderPlaced,
}) => {
  if (!isOpen) return null;

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);

  // Form
  const [shippingForm, setShippingForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine: '',
    city: '',
    country: 'Pakistan',
    postalCode: '',
    paymentMethod: 'Cash on Delivery' as 'Cash on Delivery' | 'Credit / Debit Card' | 'Apple Pay / Wallet',
    notes: '',
  });

  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Calculations
  const subtotalUSD = cartItems.reduce(
    (sum, item) => sum + (item.product.salePriceUSD ?? item.product.priceUSD) * item.quantity,
    0
  );

  let discountUSD = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discountType === 'percentage') {
      discountUSD = (subtotalUSD * appliedVoucher.discountValue) / 100;
      if (appliedVoucher.maxDiscountUSD && discountUSD > appliedVoucher.maxDiscountUSD) {
        discountUSD = appliedVoucher.maxDiscountUSD;
      }
    } else if (appliedVoucher.discountType === 'fixed_amount') {
      discountUSD = appliedVoucher.discountValue;
    }
  }

  const shippingFeeUSD =
    appliedVoucher?.discountType === 'free_shipping' || subtotalUSD >= settings.freeShippingThresholdUSD
      ? 0
      : settings.flatShippingRateUSD;

  const totalUSD = Math.max(0, subtotalUSD - discountUSD + shippingFeeUSD);

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCodeInput.trim()) return;

    const voucher = db.getVoucherByCode(voucherCodeInput);
    if (!voucher) {
      addToast('error', 'Invalid Voucher', 'Code not found or expired.');
      return;
    }

    if (!voucher.isActive) {
      addToast('error', 'Voucher Inactive', 'This discount code is no longer active.');
      return;
    }

    if (voucher.usageCount >= voucher.usageLimit) {
      addToast('error', 'Limit Reached', 'This voucher code usage limit has been exceeded.');
      return;
    }

    if (subtotalUSD < voucher.minPurchaseUSD) {
      addToast(
        'error',
        'Minimum Amount Not Met',
        `Requires minimum order of ${formatCurrency(voucher.minPurchaseUSD, currency)}`
      );
      return;
    }

    setAppliedVoucher(voucher);
    addToast('success', 'Voucher Applied', `${voucher.code} applied successfully!`);
    setVoucherCodeInput('');
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!shippingForm.fullName.trim()) {
      addToast('error', 'Validation Error', 'Please enter your full name.');
      return;
    }
    if (!validateEmail(shippingForm.email)) {
      addToast('error', 'Validation Error', 'Please enter a valid email address.');
      return;
    }
    if (!validatePhone(shippingForm.phone)) {
      addToast('error', 'Validation Error', 'Please enter a valid phone number.');
      return;
    }
    if (!shippingForm.addressLine.trim() || !shippingForm.city.trim()) {
      addToast('error', 'Validation Error', 'Please enter your shipping address and city.');
      return;
    }

    const newOrder: Order = db.addOrder({
      customerName: shippingForm.fullName,
      customerEmail: shippingForm.email,
      customerPhone: shippingForm.phone,
      shippingAddress: {
        fullName: shippingForm.fullName,
        email: shippingForm.email,
        phone: shippingForm.phone,
        addressLine: shippingForm.addressLine,
        city: shippingForm.city,
        country: shippingForm.country,
        postalCode: shippingForm.postalCode || '00000',
      },
      items: cartItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        priceUSD: item.product.salePriceUSD ?? item.product.priceUSD,
        quantity: item.quantity,
        shade: item.shade,
        imageUrl: item.product.imageUrl,
      })),
      subtotalUSD,
      discountUSD,
      shippingFeeUSD,
      totalUSD,
      voucherCodeUsed: appliedVoucher?.code,
      status: 'Pending',
      paymentMethod: shippingForm.paymentMethod,
      paymentStatus: shippingForm.paymentMethod === 'Cash on Delivery' ? 'Unpaid' : 'Paid',
      notes: shippingForm.notes,
    });

    if (appliedVoucher) {
      db.incrementVoucherUsage(appliedVoucher.code);
    }

    setPlacedOrder(newOrder);
    setCheckoutStep('success');
    onClearCart();
    onOrderPlaced(newOrder);
    addToast('success', 'Order Confirmed!', `Order ${newOrder.id} has been placed.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 bg-amber-950 text-amber-100 flex items-center justify-between border-b border-amber-900">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-serif font-bold">
                {checkoutStep === 'cart' && `Your Shopping Bag (${cartItems.length})`}
                {checkoutStep === 'checkout' && 'Shipping & Payment'}
                {checkoutStep === 'success' && 'Order Placed!'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-amber-900 text-amber-300 hover:text-amber-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* STEP 1: CART LIST */}
          {checkoutStep === 'cart' && (
            <>
              {/* Free shipping bar */}
              <div className="p-3 bg-amber-50 border-b border-amber-900/10 text-xs text-amber-900 font-medium text-center">
                {subtotalUSD >= settings.freeShippingThresholdUSD ? (
                  <span className="flex items-center justify-center gap-1.5 text-emerald-800">
                    <Sparkles className="w-4 h-4 text-emerald-600" /> You qualify for Free Express Shipping!
                  </span>
                ) : (
                  <span>
                    Add{' '}
                    <strong>
                      {formatCurrency(settings.freeShippingThresholdUSD - subtotalUSD, currency)}
                    </strong>{' '}
                    more to unlock <strong>Free Shipping</strong>
                  </span>
                )}
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                    <ShoppingBag className="w-12 h-12 stroke-1 mb-3 text-neutral-300" />
                    <p className="font-serif text-lg font-medium text-neutral-700">
                      Your bag is empty
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Explore our botanical elixirs and royal cosmetics to get started.
                    </p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={`${item.product.id}-${item.shade || 'default'}`}
                      className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex gap-3 items-center"
                    >
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-xl bg-white border border-neutral-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-serif font-bold text-neutral-900 truncate">
                          {item.product.name}
                        </h4>
                        {item.shade && (
                          <p className="text-[11px] text-amber-800 font-medium">Shade: {item.shade}</p>
                        )}
                        <p className="text-xs font-bold text-amber-900 mt-0.5">
                          {formatCurrency(item.product.salePriceUSD ?? item.product.priceUSD, currency)}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden text-xs">
                            <button
                              onClick={() =>
                                onUpdateQuantity(
                                  item.product.id,
                                  Math.max(1, item.quantity - 1),
                                  item.shade
                                )
                              }
                              className="px-2 py-0.5 hover:bg-neutral-100 font-bold"
                            >
                              -
                            </button>
                            <span className="px-2 font-semibold">{item.quantity}</span>
                            <button
                              onClick={() =>
                                onUpdateQuantity(
                                  item.product.id,
                                  Math.min(item.product.stockQuantity, item.quantity + 1),
                                  item.shade
                                )
                              }
                              className="px-2 py-0.5 hover:bg-neutral-100 font-bold"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.product.id, item.shade)}
                            className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Voucher Code Form */}
              {cartItems.length > 0 && (
                <div className="p-4 border-t border-neutral-200 bg-neutral-50">
                  <form onSubmit={handleApplyVoucher} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={voucherCodeInput}
                        onChange={(e) => setVoucherCodeInput(e.target.value)}
                        placeholder="Voucher Code (e.g. LUXURY10)"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-300 rounded-xl uppercase tracking-wider font-semibold focus:outline-none focus:ring-1 focus:ring-amber-800"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-amber-100 text-xs font-semibold rounded-xl transition-colors"
                    >
                      Apply
                    </button>
                  </form>

                  {appliedVoucher && (
                    <div className="mt-2 text-xs text-emerald-800 font-medium flex items-center justify-between bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <span>
                        Applied Code: <strong>{appliedVoucher.code}</strong>
                      </span>
                      <button
                        onClick={() => setAppliedVoucher(null)}
                        className="text-neutral-500 hover:text-rose-600 underline text-[10px]"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Order Summary & Proceed */}
              {cartItems.length > 0 && (
                <div className="p-5 border-t border-neutral-200 bg-white space-y-2">
                  <div className="flex justify-between text-xs text-neutral-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotalUSD, currency)}</span>
                  </div>
                  {discountUSD > 0 && (
                    <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                      <span>Discount ({appliedVoucher?.code})</span>
                      <span>-{formatCurrency(discountUSD, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-neutral-600">
                    <span>Shipping Fee</span>
                    <span>
                      {shippingFeeUSD === 0
                        ? 'FREE'
                        : formatCurrency(shippingFeeUSD, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-serif font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                    <span>Total Amount</span>
                    <span className="text-amber-950">{formatCurrency(totalUSD, currency)}</span>
                  </div>

                  <button
                    onClick={() => setCheckoutStep('checkout')}
                    className="w-full mt-3 py-3.5 bg-amber-900 hover:bg-amber-950 text-amber-100 font-semibold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* STEP 2: CHECKOUT FORM */}
          {checkoutStep === 'checkout' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <button
                onClick={() => setCheckoutStep('cart')}
                className="text-xs text-amber-800 hover:underline font-semibold flex items-center gap-1"
              >
                ← Back to Cart
              </button>

              <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={shippingForm.fullName}
                      onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                      placeholder="e.g. Fatima Al-Mansoor"
                      className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-1 focus:ring-amber-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-1">Email *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={shippingForm.email}
                        onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                        placeholder="fatima@example.com"
                        className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-1 focus:ring-amber-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-1">Phone *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={shippingForm.phone}
                        onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                        placeholder="+92 300 1234567"
                        className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-1 focus:ring-amber-800"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Address *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <textarea
                      required
                      rows={2}
                      value={shippingForm.addressLine}
                      onChange={(e) => setShippingForm({ ...shippingForm, addressLine: e.target.value })}
                      placeholder="Street name, Villa/Apartment number, Landmark"
                      className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-1 focus:ring-amber-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                      placeholder="e.g. Lahore / Dubai"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-1 focus:ring-amber-800"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-1">Country</label>
                    <input
                      type="text"
                      value={shippingForm.country}
                      onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-1 focus:ring-amber-800"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2">Payment Method</label>
                  <div className="space-y-2">
                    {[
                      { id: 'Cash on Delivery', label: 'Cash on Delivery (COD)' },
                      { id: 'Credit / Debit Card', label: 'Credit / Debit Card' },
                      { id: 'Apple Pay / Wallet', label: 'Apple Pay / Mobile Wallet' },
                    ].map((pm) => (
                      <label
                        key={pm.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          shippingForm.paymentMethod === pm.id
                            ? 'border-amber-900 bg-amber-50/60 font-semibold text-amber-950'
                            : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={shippingForm.paymentMethod === pm.id}
                          onChange={() => setShippingForm({ ...shippingForm, paymentMethod: pm.id as any })}
                          className="accent-amber-900"
                        />
                        <span>{pm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Total Summary box */}
                <div className="p-3 bg-neutral-100 rounded-xl font-medium text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Total Order Value:</span>
                    <span className="font-bold text-amber-950">{formatCurrency(totalUSD, currency)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-amber-900 hover:bg-amber-950 text-amber-100 font-bold text-sm rounded-2xl transition-all shadow-md"
                >
                  Confirm & Place Order
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {checkoutStep === 'success' && placedOrder && (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <h3 className="text-xl font-serif font-bold text-neutral-900">
                Thank You for Your Order!
              </h3>
              <p className="text-xs text-neutral-600 max-w-xs">
                Your order <strong className="text-amber-900">{placedOrder.id}</strong> has been received and is now being processed by our royal concierge.
              </p>

              <div className="w-full p-4 bg-amber-50/60 rounded-2xl border border-amber-900/10 text-xs text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Order Reference:</span>
                  <span className="font-mono font-bold text-amber-950">{placedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Payment Status:</span>
                  <span className="font-semibold text-emerald-800">{placedOrder.paymentStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Total Charged:</span>
                  <span className="font-bold text-neutral-900">{formatCurrency(placedOrder.totalUSD, currency)}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-amber-900 hover:bg-amber-950 text-amber-100 font-semibold text-xs rounded-xl transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
