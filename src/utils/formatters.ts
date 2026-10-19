import { CurrencyCode, CurrencyConfig, OrderStatus, CustomerTier } from '../types';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  PKR: { code: 'PKR', symbol: 'Rs.', rateToUSD: 278.50, prefix: true },
  USD: { code: 'USD', symbol: '$', rateToUSD: 1.00, prefix: true },
  AED: { code: 'AED', symbol: 'AED ', rateToUSD: 3.67, prefix: true },
  GBP: { code: 'GBP', symbol: '£', rateToUSD: 0.78, prefix: true },
  EUR: { code: 'EUR', symbol: '€', rateToUSD: 0.92, prefix: true },
};

export function formatCurrency(amountUSD: number, currencyCode: CurrencyCode = 'USD'): string {
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const converted = amountUSD * config.rateToUSD;

  // For PKR, round to integer for clean presentation, else 2 decimals
  const formattedNumber = currencyCode === 'PKR' 
    ? Math.round(converted).toLocaleString() 
    : converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (config.prefix) {
    return `${config.symbol}${formattedNumber}`;
  }
  return `${formattedNumber} ${config.symbol}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getOrderStatusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case 'Pending':
      return 'bg-amber-100 text-amber-800 border border-amber-300';
    case 'Processing':
      return 'bg-blue-100 text-blue-800 border border-blue-300';
    case 'Shipped':
      return 'bg-purple-100 text-purple-800 border border-purple-300';
    case 'Delivered':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    case 'Cancelled':
      return 'bg-rose-100 text-rose-800 border border-rose-300';
    default:
      return 'bg-zinc-100 text-zinc-800 border border-zinc-300';
  }
}

export function getCustomerTierBadgeClass(tier: CustomerTier): string {
  switch (tier) {
    case 'VIP Royal':
      return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold shadow-xs';
    case 'Gold':
      return 'bg-amber-100 text-amber-900 border border-amber-400 font-medium';
    case 'Silver':
      return 'bg-slate-200 text-slate-800 border border-slate-300 font-medium';
    case 'Standard':
    default:
      return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
  }
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  // Allow digits, spaces, plus signs, hyphens, and parentheses; minimum 7 chars
  const re = /^[\d\+\-\s\(\)]{7,20}$/;
  return re.test(phone.trim());
}

export function generateSKU(categoryName: string): string {
  const code = categoryName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'HZB');
  const rand = Math.floor(100 + Math.random() * 900);
  return `HZB-${code}-${rand}`;
}

export function generateOrderID(): string {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `HZB-${rand}`;
}
