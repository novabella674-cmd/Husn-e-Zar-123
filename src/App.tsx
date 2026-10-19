import React, { useState, useEffect, useCallback } from 'react';
import { 
  Product, Order, Customer, Voucher, Category, Review, HeroBanner, StoreSettings, 
  CurrencyCode, ToastMessage, AdminTab 
} from './types';
import { db, initDB, subscribeToDB } from './utils/storage';
import { Storefront } from './components/storefront/Storefront';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ToastContainer } from './components/common/ToastContainer';

export default function App() {
  // Initialize local DB on first load
  useEffect(() => {
    initDB();
  }, []);

  // View state: 'storefront' or 'admin'
  const [viewMode, setViewMode] = useState<'storefront' | 'admin'>('storefront');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('overview');

  // Database States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(db.getSettings());
  const [currency, setCurrency] = useState<CurrencyCode>('PKR');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, description }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load / Refresh DB state
  const refreshData = useCallback(() => {
    setProducts(db.getProducts());
    setOrders(db.getOrders());
    setCustomers(db.getCustomers());
    setVouchers(db.getVouchers());
    setCategories(db.getCategories());
    setReviews(db.getReviews());
    setBanners(db.getBanners());
    setSettings(db.getSettings());
    setCurrency(db.getSelectedCurrency());
  }, []);

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToDB(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [refreshData]);

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    db.setSelectedCurrency(newCurrency);
    addToast('info', 'Currency Updated', `Display currency changed to ${newCurrency}.`);
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans antialiased text-neutral-900 selection:bg-amber-900 selection:text-amber-100">
      {viewMode === 'storefront' ? (
        <Storefront
          products={products}
          categories={categories}
          banners={banners}
          reviews={reviews}
          settings={settings}
          currency={currency}
          onOpenAdmin={() => setViewMode('admin')}
          addToast={addToast}
        />
      ) : (
        <AdminDashboard
          products={products}
          orders={orders}
          customers={customers}
          vouchers={vouchers}
          categories={categories}
          reviews={reviews}
          banners={banners}
          settings={settings}
          currency={currency}
          activeTab={activeAdminTab}
          setActiveTab={setActiveAdminTab}
          onCurrencyChange={handleCurrencyChange}
          onOpenStorefront={() => setViewMode('storefront')}
          addToast={addToast}
        />
      )}

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
