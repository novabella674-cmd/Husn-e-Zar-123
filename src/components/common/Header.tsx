import React from 'react';
import { CurrencyCode, StoreSettings } from '../../types';
import { CURRENCIES } from '../../utils/formatters';
import { 
  Sparkles, ShoppingBag, Heart, Shield, Store, Globe, Search, Menu, X, Bot
} from 'lucide-react';

interface Props {
  viewMode: 'storefront' | 'admin';
  setViewMode: (mode: 'storefront' | 'admin') => void;
  selectedCurrency: CurrencyCode;
  onSelectCurrency: (code: CurrencyCode) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenBeautyAdvisor: () => void;
  onOpenOrderLookup: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  settings: StoreSettings;
}

export const Header: React.FC<Props> = ({
  viewMode,
  setViewMode,
  selectedCurrency,
  onSelectCurrency,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenBeautyAdvisor,
  onOpenOrderLookup,
  searchQuery,
  setSearchQuery,
  settings,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EEEEEE] text-[#1A1A1A] shadow-xs">
      {/* Announcement Bar */}
      {settings.showAnnouncementBar && settings.announcementBarText && (
        <div className="bg-[#F5F5F5] border-b border-[#EEEEEE] py-2 px-4 text-center text-xs text-[#1A1A1A] font-medium tracking-wide flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#B88E8D] shrink-0" />
          <span>{settings.announcementBarText}</span>
        </div>
      )}

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode('storefront')}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[#B88E8D] flex items-center justify-center text-white font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
              HZ
            </div>
            <div>
              <h1 className="text-lg font-light tracking-[0.2em] text-[#B88E8D] group-hover:text-[#A27675] transition-colors uppercase">
                {settings.storeName || 'Husn-e-Zar'}
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-[#999999] hidden sm:block">
                Global Luxury Beauty
              </p>
            </div>
          </button>
        </div>

        {/* Center Search Bar (Storefront view) */}
        {viewMode === 'storefront' && (
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, SKUs, or categories..."
              className="w-full bg-[#F9F9F9] border border-[#EEEEEE] text-[#1A1A1A] text-xs rounded-full pl-10 pr-8 py-2 focus:outline-none focus:border-[#B88E8D] focus:bg-white transition-all placeholder:text-[#999999]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#1A1A1A] text-xs"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Shade Advisor Button */}
          <button
            onClick={onOpenBeautyAdvisor}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-[#1A1A1A] text-xs font-medium transition-all cursor-pointer border border-[#EEEEEE]"
            title="AI Beauty Advisor"
          >
            <Bot className="w-3.5 h-3.5 text-[#B88E8D]" />
            <span>AI Matcher</span>
          </button>

          {/* Currency Switcher */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 text-[#999999] absolute left-2.5 pointer-events-none" />
            <select
              value={selectedCurrency}
              onChange={(e) => onSelectCurrency(e.target.value as CurrencyCode)}
              className="bg-[#F9F9F9] border border-[#EEEEEE] text-[#1A1A1A] text-xs font-medium rounded-full pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#B88E8D] cursor-pointer"
            >
              {Object.keys(CURRENCIES).map((code) => (
                <option key={code} value={code}>
                  {code} ({CURRENCIES[code as CurrencyCode].symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher: Storefront <-> Admin */}
          <button
            onClick={() => setViewMode(viewMode === 'storefront' ? 'admin' : 'storefront')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer border ${
              viewMode === 'admin'
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs hover:bg-[#333333]'
                : 'bg-white text-[#1A1A1A] border-[#EEEEEE] hover:bg-[#F5F5F5]'
            }`}
          >
            {viewMode === 'admin' ? (
              <>
                <Store className="w-3.5 h-3.5 text-[#B88E8D]" />
                <span className="hidden sm:inline uppercase text-[11px] tracking-wider">Storefront</span>
                <span className="sm:hidden">Store</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5 text-[#B88E8D]" />
                <span className="hidden sm:inline uppercase text-[11px] tracking-wider">Admin Portal</span>
                <span className="sm:hidden">Admin</span>
              </>
            )}
          </button>

          {/* Wishlist Button (Storefront) */}
          {viewMode === 'storefront' && (
            <button
              onClick={onOpenWishlist}
              className="relative p-2 rounded-full text-[#1A1A1A] hover:bg-[#F5F5F5] transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5 text-[#1A1A1A]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#B88E8D] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          {/* Cart Button (Storefront) */}
          {viewMode === 'storefront' && (
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A] hover:bg-[#333333] text-white font-medium text-xs transition-all shadow-xs cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#B88E8D]" />
              <span className="hidden sm:inline uppercase tracking-wider text-[11px]">Bag</span>
              {cartCount > 0 && (
                <span className="bg-[#B88E8D] text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#1A1A1A] hover:bg-[#F5F5F5] rounded-full"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#EEEEEE] bg-white p-4 space-y-3 animate-in slide-in-from-top-2">
          {viewMode === 'storefront' && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#999999]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search beauty items..."
                className="w-full bg-[#F9F9F9] border border-[#EEEEEE] text-[#1A1A1A] text-xs rounded-full pl-9 pr-3 py-2"
              />
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                onOpenOrderLookup();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F5F5F5] rounded-lg flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-[#B88E8D]" />
              <span>Track Order Status</span>
            </button>

            <button
              onClick={() => {
                onOpenBeautyAdvisor();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#1A1A1A] bg-[#FAFAFA] border border-[#EEEEEE] rounded-lg flex items-center gap-2"
            >
              <Bot className="w-4 h-4 text-[#B88E8D]" />
              <span>AI Shade Matcher</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
