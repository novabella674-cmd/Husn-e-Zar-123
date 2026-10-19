import {
  Product, Order, Customer, Voucher, Category, Review, HeroBanner, StoreSettings, CurrencyCode
} from '../types';
import {
  INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_CUSTOMERS, INITIAL_VOUCHERS,
  INITIAL_CATEGORIES, INITIAL_REVIEWS, INITIAL_BANNERS, INITIAL_SETTINGS
} from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'hzb_db_products_v1',
  ORDERS: 'hzb_db_orders_v1',
  CUSTOMERS: 'hzb_db_customers_v1',
  VOUCHERS: 'hzb_db_vouchers_v1',
  CATEGORIES: 'hzb_db_categories_v1',
  REVIEWS: 'hzb_db_reviews_v1',
  BANNERS: 'hzb_db_banners_v1',
  SETTINGS: 'hzb_db_settings_v1',
  CART: 'hzb_db_cart_v1',
  WISHLIST: 'hzb_db_wishlist_v1',
  SELECTED_CURRENCY: 'hzb_db_currency_v1',
};

const DB_UPDATE_EVENT = 'husne_zar_db_updated';

function notifyDBChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DB_UPDATE_EVENT));
  }
}

export function subscribeToDB(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(DB_UPDATE_EVENT, callback);
  return () => window.removeEventListener(DB_UPDATE_EVENT, callback);
}

// Internal Helper
function getItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error reading ${key} from LocalStorage:`, err);
    return fallback;
  }
}

function setItem<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    notifyDBChange();
  } catch (err) {
    console.error(`Error writing ${key} to LocalStorage:`, err);
  }
}

// Database Initialization & Seed
export function initDB(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.VOUCHERS)) {
    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(INITIAL_VOUCHERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BANNERS)) {
    localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(INITIAL_BANNERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
  }
}

export const db = {
  // PRODUCTS CRUD
  getProducts(): Product[] {
    return getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },
  getProductById(id: string): Product | undefined {
    return this.getProducts().find(p => p.id === id);
  },
  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.PRODUCTS, [newProduct, ...products]);
    return newProduct;
  },
  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const updatedProduct = {
      ...products[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    products[idx] = updatedProduct;
    setItem(STORAGE_KEYS.PRODUCTS, products);
    return updatedProduct;
  },
  deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    setItem(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  },
  bulkDeleteProducts(ids: string[]): void {
    const products = this.getProducts().filter(p => !ids.includes(p.id));
    setItem(STORAGE_KEYS.PRODUCTS, products);
  },
  duplicateProduct(id: string): Product | null {
    const product = this.getProductById(id);
    if (!product) return null;
    return this.addProduct({
      ...product,
      name: `${product.name} (Copy)`,
      sku: `${product.sku}-COPY`,
      status: 'draft',
    });
  },

  // ORDERS CRUD
  getOrders(): Order[] {
    return getItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },
  getOrderById(id: string): Order | undefined {
    return this.getOrders().find(o => o.id === id);
  },
  addOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Order {
    const orders = this.getOrders();
    const newOrder: Order = {
      ...order,
      id: order.id || `HZB-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.ORDERS, [newOrder, ...orders]);

    // Update customer metrics if customer exists or create guest record
    this.syncCustomerPurchase(newOrder);

    // Deduct stock quantities for items ordered
    this.deductProductStock(newOrder);

    return newOrder;
  },
  updateOrder(id: string, updates: Partial<Order>): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return null;
    const updatedOrder = {
      ...orders[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    orders[idx] = updatedOrder;
    setItem(STORAGE_KEYS.ORDERS, orders);
    return updatedOrder;
  },
  deleteOrder(id: string): boolean {
    const orders = this.getOrders();
    const filtered = orders.filter(o => o.id !== id);
    if (filtered.length === orders.length) return false;
    setItem(STORAGE_KEYS.ORDERS, filtered);
    return true;
  },
  bulkUpdateOrderStatus(ids: string[], status: Order['status']): void {
    const orders = this.getOrders().map(o => {
      if (ids.includes(o.id)) {
        return { ...o, status, updatedAt: new Date().toISOString() };
      }
      return o;
    });
    setItem(STORAGE_KEYS.ORDERS, orders);
  },

  // Helper when order placed
  deductProductStock(order: Order) {
    const products = this.getProducts();
    let updated = false;
    order.items.forEach(item => {
      const pIdx = products.findIndex(p => p.id === item.productId);
      if (pIdx !== -1) {
        products[pIdx].stockQuantity = Math.max(0, products[pIdx].stockQuantity - item.quantity);
        products[pIdx].updatedAt = new Date().toISOString();
        updated = true;
      }
    });
    if (updated) {
      setItem(STORAGE_KEYS.PRODUCTS, products);
    }
  },

  syncCustomerPurchase(order: Order) {
    const customers = this.getCustomers();
    const existingIndex = customers.findIndex(c => c.email.toLowerCase() === order.customerEmail.toLowerCase());
    
    if (existingIndex !== -1) {
      const cust = customers[existingIndex];
      const newSpent = cust.totalSpentUSD + order.totalUSD;
      const newOrdersCount = cust.totalOrdersCount + 1;
      const newPoints = cust.loyaltyPoints + Math.floor(order.totalUSD);

      let newTier = cust.tier;
      if (newSpent >= 1000) newTier = 'VIP Royal';
      else if (newSpent >= 400) newTier = 'Gold';
      else if (newSpent >= 150) newTier = 'Silver';

      customers[existingIndex] = {
        ...cust,
        totalSpentUSD: newSpent,
        totalOrdersCount: newOrdersCount,
        loyaltyPoints: newPoints,
        tier: newTier,
      };
      setItem(STORAGE_KEYS.CUSTOMERS, customers);
    } else {
      // Create new customer record
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        city: order.shippingAddress.city,
        country: order.shippingAddress.country,
        tier: order.totalUSD >= 150 ? 'Silver' : 'Standard',
        loyaltyPoints: Math.floor(order.totalUSD),
        totalOrdersCount: 1,
        totalSpentUSD: order.totalUSD,
        isActive: true,
        joinedAt: new Date().toISOString(),
      };
      setItem(STORAGE_KEYS.CUSTOMERS, [newCust, ...customers]);
    }
  },

  // CUSTOMERS CRUD
  getCustomers(): Customer[] {
    return getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },
  addCustomer(customer: Omit<Customer, 'id' | 'joinedAt'>): Customer {
    const customers = this.getCustomers();
    const newCust: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
      joinedAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.CUSTOMERS, [newCust, ...customers]);
    return newCust;
  },
  updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) return null;
    customers[idx] = { ...customers[idx], ...updates };
    setItem(STORAGE_KEYS.CUSTOMERS, customers);
    return customers[idx];
  },
  deleteCustomer(id: string): boolean {
    const customers = this.getCustomers();
    const filtered = customers.filter(c => c.id !== id);
    if (filtered.length === customers.length) return false;
    setItem(STORAGE_KEYS.CUSTOMERS, filtered);
    return true;
  },

  // VOUCHERS CRUD
  getVouchers(): Voucher[] {
    return getItem<Voucher[]>(STORAGE_KEYS.VOUCHERS, INITIAL_VOUCHERS);
  },
  getVoucherByCode(code: string): Voucher | undefined {
    return this.getVouchers().find(v => v.code.toUpperCase() === code.trim().toUpperCase());
  },
  addVoucher(voucher: Omit<Voucher, 'id' | 'createdAt' | 'usageCount'>): Voucher {
    const vouchers = this.getVouchers();
    const newVoucher: Voucher = {
      ...voucher,
      code: voucher.code.toUpperCase().trim(),
      id: `vouch-${Date.now()}`,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.VOUCHERS, [newVoucher, ...vouchers]);
    return newVoucher;
  },
  updateVoucher(id: string, updates: Partial<Voucher>): Voucher | null {
    const vouchers = this.getVouchers();
    const idx = vouchers.findIndex(v => v.id === id);
    if (idx === -1) return null;
    if (updates.code) updates.code = updates.code.toUpperCase().trim();
    vouchers[idx] = { ...vouchers[idx], ...updates };
    setItem(STORAGE_KEYS.VOUCHERS, vouchers);
    return vouchers[idx];
  },
  deleteVoucher(id: string): boolean {
    const vouchers = this.getVouchers();
    const filtered = vouchers.filter(v => v.id !== id);
    if (filtered.length === vouchers.length) return false;
    setItem(STORAGE_KEYS.VOUCHERS, filtered);
    return true;
  },
  incrementVoucherUsage(code: string): void {
    const vouchers = this.getVouchers();
    const idx = vouchers.findIndex(v => v.code.toUpperCase() === code.trim().toUpperCase());
    if (idx !== -1) {
      vouchers[idx].usageCount += 1;
      setItem(STORAGE_KEYS.VOUCHERS, vouchers);
    }
  },

  // CATEGORIES CRUD
  getCategories(): Category[] {
    return getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },
  addCategory(category: Omit<Category, 'id'>): Category {
    const categories = this.getCategories();
    const newCat: Category = {
      ...category,
      id: `cat-${Date.now()}`,
    };
    setItem(STORAGE_KEYS.CATEGORIES, [...categories, newCat]);
    return newCat;
  },
  updateCategory(id: string, updates: Partial<Category>): Category | null {
    const categories = this.getCategories();
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    categories[idx] = { ...categories[idx], ...updates };
    setItem(STORAGE_KEYS.CATEGORIES, categories);
    return categories[idx];
  },
  deleteCategory(id: string): boolean {
    const categories = this.getCategories();
    const filtered = categories.filter(c => c.id !== id);
    if (filtered.length === categories.length) return false;
    setItem(STORAGE_KEYS.CATEGORIES, filtered);
    return true;
  },

  // REVIEWS CRUD
  getReviews(): Review[] {
    return getItem<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  },
  addReview(review: Omit<Review, 'id' | 'createdAt'>): Review {
    const reviews = this.getReviews();
    const newReview: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.REVIEWS, [newReview, ...reviews]);
    return newReview;
  },
  updateReview(id: string, updates: Partial<Review>): Review | null {
    const reviews = this.getReviews();
    const idx = reviews.findIndex(r => r.id === id);
    if (idx === -1) return null;
    reviews[idx] = { ...reviews[idx], ...updates };
    setItem(STORAGE_KEYS.REVIEWS, reviews);
    return reviews[idx];
  },
  deleteReview(id: string): boolean {
    const reviews = this.getReviews();
    const filtered = reviews.filter(r => r.id !== id);
    if (filtered.length === reviews.length) return false;
    setItem(STORAGE_KEYS.REVIEWS, filtered);
    return true;
  },

  // BANNERS CRUD
  getBanners(): HeroBanner[] {
    return getItem<HeroBanner[]>(STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
  },
  addBanner(banner: Omit<HeroBanner, 'id'>): HeroBanner {
    const banners = this.getBanners();
    const newBanner: HeroBanner = {
      ...banner,
      id: `ban-${Date.now()}`,
    };
    setItem(STORAGE_KEYS.BANNERS, [...banners, newBanner]);
    return newBanner;
  },
  updateBanner(id: string, updates: Partial<HeroBanner>): HeroBanner | null {
    const banners = this.getBanners();
    const idx = banners.findIndex(b => b.id === id);
    if (idx === -1) return null;
    banners[idx] = { ...banners[idx], ...updates };
    setItem(STORAGE_KEYS.BANNERS, banners);
    return banners[idx];
  },
  deleteBanner(id: string): boolean {
    const banners = this.getBanners();
    const filtered = banners.filter(b => b.id !== id);
    if (filtered.length === banners.length) return false;
    setItem(STORAGE_KEYS.BANNERS, filtered);
    return true;
  },

  // STORE SETTINGS
  getSettings(): StoreSettings {
    return getItem<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  updateSettings(updates: Partial<StoreSettings>): StoreSettings {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    setItem(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  // CURRENCY SELECTION
  getSelectedCurrency(): CurrencyCode {
    return getItem<CurrencyCode>(STORAGE_KEYS.SELECTED_CURRENCY, 'PKR');
  },
  setSelectedCurrency(code: CurrencyCode): void {
    setItem(STORAGE_KEYS.SELECTED_CURRENCY, code);
  },

  // RESET DATABASE TO SEED
  resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(INITIAL_VOUCHERS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
    localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(INITIAL_BANNERS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.removeItem(STORAGE_KEYS.CART);
    localStorage.removeItem(STORAGE_KEYS.WISHLIST);
    notifyDBChange();
  },

  // EXPORT / IMPORT BACKUP
  exportDatabaseJSON(): string {
    const data = {
      products: this.getProducts(),
      orders: this.getOrders(),
      customers: this.getCustomers(),
      vouchers: this.getVouchers(),
      categories: this.getCategories(),
      reviews: this.getReviews(),
      banners: this.getBanners(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
      app: 'Husn-e-Zar Beauty',
    };
    return JSON.stringify(data, null, 2);
  },

  importDatabaseJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'Invalid JSON format.' };
      }
      if (Array.isArray(parsed.products)) setItem(STORAGE_KEYS.PRODUCTS, parsed.products);
      if (Array.isArray(parsed.orders)) setItem(STORAGE_KEYS.ORDERS, parsed.orders);
      if (Array.isArray(parsed.customers)) setItem(STORAGE_KEYS.CUSTOMERS, parsed.customers);
      if (Array.isArray(parsed.vouchers)) setItem(STORAGE_KEYS.VOUCHERS, parsed.vouchers);
      if (Array.isArray(parsed.categories)) setItem(STORAGE_KEYS.CATEGORIES, parsed.categories);
      if (Array.isArray(parsed.reviews)) setItem(STORAGE_KEYS.REVIEWS, parsed.reviews);
      if (Array.isArray(parsed.banners)) setItem(STORAGE_KEYS.BANNERS, parsed.banners);
      if (parsed.settings) setItem(STORAGE_KEYS.SETTINGS, parsed.settings);

      notifyDBChange();
      return { success: true, message: 'Database successfully imported!' };
    } catch (err) {
      return { success: false, message: `Import failed: ${(err as Error).message}` };
    }
  }
};
