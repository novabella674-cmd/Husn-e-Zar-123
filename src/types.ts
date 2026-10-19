export type CurrencyCode = 'PKR' | 'USD' | 'AED' | 'GBP' | 'EUR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rateToUSD: number; // USD as base rate
  prefix: boolean;
}

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product {
  id: string;
  sku: string;
  name: string;
  subtitle: string;
  categoryId: string;
  categoryName: string;
  priceUSD: number;
  salePriceUSD?: number;
  stockQuantity: number;
  status: ProductStatus;
  description: string;
  ingredients: string;
  howToUse: string;
  imageUrl: string;
  shades?: string[]; // Shade name/hex codes
  rating: number; // 1 to 5
  reviewsCount: number;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOrganic?: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  priceUSD: number;
  quantity: number;
  shade?: string;
  imageUrl: string;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface Order {
  id: string; // e.g. HZB-10892
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotalUSD: number;
  discountUSD: number;
  shippingFeeUSD: number;
  totalUSD: number;
  voucherCodeUsed?: string;
  status: OrderStatus;
  paymentMethod: 'Cash on Delivery' | 'Credit / Debit Card' | 'Apple Pay / Wallet';
  paymentStatus: 'Paid' | 'Unpaid' | 'Refunded';
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerTier = 'Standard' | 'Silver' | 'Gold' | 'VIP Royal';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  tier: CustomerTier;
  loyaltyPoints: number;
  totalOrdersCount: number;
  totalSpentUSD: number;
  isActive: boolean;
  notes?: string;
  joinedAt: string;
}

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';

export interface Voucher {
  id: string;
  code: string; // e.g. "LUXURY20"
  description: string;
  discountType: DiscountType;
  discountValue: number; // percentage e.g. 20 for 20%, or fixed USD value
  minPurchaseUSD: number;
  maxDiscountUSD?: number;
  usageCount: number;
  usageLimit: number;
  isActive: boolean;
  startDate: string;
  expiryDate: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  productCount?: number;
  isActive: boolean;
  displayOrder: number;
}

export type ReviewStatus = 'Approved' | 'Pending' | 'Flagged';

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  status: ReviewStatus;
  adminReply?: string;
  createdAt: string;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  ctaText: string;
  ctaCategorySlug: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  announcementBarText: string;
  showAnnouncementBar: boolean;
  contactEmail: string;
  contactPhone: string;
  freeShippingThresholdUSD: number;
  flatShippingRateUSD: number;
  taxPercentage: number;
  primaryCurrency: CurrencyCode;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

export type AdminTab = 
  | 'overview' 
  | 'products' 
  | 'orders' 
  | 'customers' 
  | 'vouchers' 
  | 'categories' 
  | 'reviews' 
  | 'banners' 
  | 'database';
