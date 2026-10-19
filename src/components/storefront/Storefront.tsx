import React, { useState, useMemo } from 'react';
import { Product, Category, Review, HeroBanner, Order, CurrencyCode, StoreSettings } from '../../types';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { CartDrawer, CartItem } from './CartDrawer';
import { OrderTrackerModal } from './OrderTrackerModal';
import { AIBeautyAdvisorModal } from './AIBeautyAdvisorModal';
import { formatCurrency } from '../../utils/formatters';
import { Pagination } from '../common/Pagination';
import { 
  Search, Filter, Sparkles, Heart, ShoppingBag, Truck, Package, 
  Bot, ChevronRight, Star, ArrowRight, ShieldCheck, RefreshCw, CheckCircle2 
} from 'lucide-react';

interface Props {
  products: Product[];
  categories: Category[];
  banners: HeroBanner[];
  reviews: Review[];
  settings: StoreSettings;
  currency: CurrencyCode;
  onOpenAdmin: () => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const Storefront: React.FC<Props> = ({
  products,
  categories,
  banners,
  reviews,
  settings,
  currency,
  onOpenAdmin,
  addToast,
}) => {
  // Navigation / Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Cart & Wishlist State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Modals & Drawers
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState(false);
  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);

  // Active Hero Banner Index
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const activeBanners = banners.filter((b) => b.isActive).sort((a, b) => a.displayOrder - b.displayOrder);

  // Cart Functions
  const handleAddToCart = (product: Product, quantity = 1, shade?: string) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.shade === shade
      );
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, quantity, shade }];
      }
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number, shade?: string) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && item.shade === shade) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (productId: string, shade?: string) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.shade === shade))
    );
    addToast('info', 'Item Removed', 'Product removed from your shopping bag.');
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Wishlist Functions
  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        addToast('info', 'Removed from Wishlist', `${product.name} removed.`);
        return prev.filter((p) => p.id !== product.id);
      } else {
        addToast('success', 'Added to Wishlist', `${product.name} saved to your favorites.`);
        return [...prev, product];
      }
    });
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.status === 'active') // Only show active products to customers
      .filter((p) => {
        if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
        if (filterTag === 'bestsellers' && !p.isBestSeller) return false;
        if (filterTag === 'new' && !p.isNewArrival) return false;
        if (filterTag === 'organic' && !p.isOrganic) return false;
        if (filterTag === 'sale' && !p.salePriceUSD) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = p.name.toLowerCase().includes(q);
          const matchCategory = p.categoryName.toLowerCase().includes(q);
          const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
          return matchName || matchCategory || matchTags;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return (a.salePriceUSD ?? a.priceUSD) - (b.salePriceUSD ?? b.priceUSD);
        if (sortBy === 'price-desc') return (b.salePriceUSD ?? b.priceUSD) - (a.salePriceUSD ?? a.priceUSD);
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0; // Default featured
      });
  }, [products, selectedCategory, filterTag, searchQuery, sortBy]);

  // Paginated Products
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-50 text-neutral-900 flex flex-col font-sans">
      {/* 1. ANNOUNCEMENT BAR */}
      {settings.showAnnouncementBar && (
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-100 text-[11px] py-2 px-4 text-center font-medium tracking-wide flex items-center justify-between border-b border-amber-900">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span className="mx-auto flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {settings.announcementBarText}
            </span>
            <div className="hidden md:flex items-center gap-4 text-[10px] text-amber-200/80">
              <button onClick={() => setIsOrderTrackerOpen(true)} className="hover:underline flex items-center gap-1">
                <Package className="w-3 h-3" /> Track Order
              </button>
              <button onClick={() => setIsAIAdvisorOpen(true)} className="hover:underline flex items-center gap-1 text-amber-300 font-semibold">
                <Bot className="w-3 h-3" /> AI Concierge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-900/10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedCategory('all')}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-800 to-amber-950 text-amber-100 flex items-center justify-center font-serif text-xl font-bold border border-amber-500/30 shadow-sm">
              H
            </div>
            <div>
              <h1 className="font-serif font-extrabold text-xl tracking-tight text-neutral-900 leading-tight">
                {settings.storeName}
              </h1>
              <p className="text-[10px] font-medium tracking-widest text-amber-800 uppercase">
                Royal Botanical Cosmetics
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search saffron elixirs, velvet lipsticks, surma..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-neutral-100 border border-neutral-200 rounded-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-800 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Advisor Button */}
            <button
              onClick={() => setIsAIAdvisorOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-900/10 rounded-full text-xs font-semibold transition-colors"
            >
              <Bot className="w-4 h-4 text-amber-700" />
              <span>AI Advisor</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={() => setIsWishlistDrawerOpen(true)}
              className="relative p-2 text-neutral-700 hover:text-amber-900 transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Bag */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-amber-950 text-amber-100 hover:bg-amber-900 rounded-2xl transition-all shadow-sm flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold hidden sm:inline">Bag</span>
              {totalCartCount > 0 && (
                <span className="w-5 h-5 bg-amber-500 text-amber-950 rounded-full text-xs font-extrabold flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Switch to Admin Dashboard */}
            <button
              onClick={onOpenAdmin}
              className="ml-2 px-3 py-1.5 bg-neutral-900 text-amber-200 hover:bg-black rounded-xl text-xs font-semibold tracking-wider transition-all border border-amber-500/20 shadow-xs"
            >
              Admin Panel
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO BANNER CAROUSEL */}
      {activeBanners.length > 0 && (
        <section className="relative bg-amber-950 text-amber-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 z-10">
              <span className="inline-block px-3 py-1 bg-amber-800/60 text-amber-200 text-xs font-semibold tracking-widest uppercase rounded-full border border-amber-500/20">
                {activeBanners[activeBannerIdx].tag}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white">
                {activeBanners[activeBannerIdx].title}
              </h2>
              <p className="text-amber-100/80 text-sm md:text-base max-w-lg font-light leading-relaxed">
                {activeBanners[activeBannerIdx].subtitle}
              </p>

              <div className="pt-2 flex items-center gap-4">
                <button
                  onClick={() => {
                    const slug = activeBanners[activeBannerIdx].ctaCategorySlug;
                    const cat = categories.find((c) => c.slug === slug);
                    if (cat) setSelectedCategory(cat.id);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  {activeBanners[activeBannerIdx].ctaText} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Banner Image */}
            <div className="relative aspect-4/3 rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl">
              <img
                src={activeBanners[activeBannerIdx].imageUrl}
                alt={activeBanners[activeBannerIdx].title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Carousel Dots */}
          {activeBanners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveBannerIdx(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === activeBannerIdx ? 'bg-amber-400 w-6' : 'bg-amber-100/30 hover:bg-amber-100'
                  }`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. CATEGORIES PILLS BAR */}
      <section className="bg-white border-b border-amber-900/10 py-4 sticky top-20 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-900 text-amber-100 shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All Collections
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-amber-900 text-amber-100 shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* 5. FILTER & SORT CONTROLS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-amber-900/10 shadow-xs">
          {/* Quick Filter Tags */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-neutral-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'bestsellers', label: '★ Best Sellers' },
              { id: 'new', label: 'New Arrivals' },
              { id: 'organic', label: '100% Organic' },
              { id: 'sale', label: 'Special Offers' },
            ].map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  setFilterTag(tag.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  filterTag === tag.id
                    ? 'bg-amber-100 text-amber-950 font-bold'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <span className="text-neutral-400 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-1.5 font-medium focus:ring-1 focus:ring-amber-800"
            >
              <option value="featured">Featured Royal Selection</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Customer Rating</option>
            </select>
          </div>
        </div>
      </section>

      {/* 6. PRODUCTS GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 w-full">
        {paginatedProducts.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-amber-900/10 shadow-xs max-w-lg mx-auto my-8">
            <Search className="w-12 h-12 text-amber-800/40 mx-auto mb-3" />
            <h3 className="text-xl font-serif font-bold text-neutral-800">
              No products found
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Try resetting your search query or selecting a different category.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setFilterTag('all');
              }}
              className="mt-4 px-5 py-2.5 bg-amber-900 text-amber-100 rounded-xl text-xs font-semibold hover:bg-amber-950 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={currency}
                onQuickView={(p) => setQuickViewProduct(p)}
                onAddToCart={(p) => {
                  handleAddToCart(p, 1);
                  addToast('success', 'Added to Bag', `${p.name} added to your cart.`);
                }}
                isWishlisted={wishlist.some((w) => w.id === product.id)}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > pageSize && (
          <div className="mt-10">
            <Pagination
              currentPage={currentPage}
              totalCount={filteredProducts.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </main>

      {/* 7. WISHLIST DRAWER MODAL */}
      {isWishlistDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              <div className="p-5 bg-amber-950 text-amber-100 flex items-center justify-between border-b border-amber-900">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                  <h2 className="text-lg font-serif font-bold">
                    Saved Favorites ({wishlist.length})
                  </h2>
                </div>
                <button
                  onClick={() => setIsWishlistDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-amber-900 text-amber-300 hover:text-amber-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {wishlist.length === 0 ? (
                  <p className="text-center text-xs text-neutral-400 py-10">
                    Your wishlist is currently empty.
                  </p>
                ) : (
                  wishlist.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex gap-3 items-center"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-14 h-14 object-cover rounded-xl bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-serif font-bold text-neutral-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs font-bold text-amber-900 mt-0.5">
                          {formatCurrency(item.salePriceUSD ?? item.priceUSD, currency)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          handleAddToCart(item, 1);
                          addToast('success', 'Moved to Bag', `${item.name} added to cart.`);
                        }}
                        className="px-3 py-1.5 bg-amber-900 text-amber-100 text-xs font-semibold rounded-xl"
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <ProductDetailModal
        product={quickViewProduct}
        currency={currency}
        reviews={reviews}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        isWishlisted={wishlist.some((w) => w.id === quickViewProduct?.id)}
        onToggleWishlist={handleToggleWishlist}
        addToast={addToast}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        currency={currency}
        settings={settings}
        vouchers={[]}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        addToast={addToast}
        onOrderPlaced={() => {}}
      />

      <OrderTrackerModal
        isOpen={isOrderTrackerOpen}
        currency={currency}
        onClose={() => setIsOrderTrackerOpen(false)}
      />

      <AIBeautyAdvisorModal
        isOpen={isAIAdvisorOpen}
        products={products}
        currency={currency}
        onClose={() => setIsAIAdvisorOpen(false)}
        onAddToCart={(p) => {
          handleAddToCart(p, 1);
          addToast('success', 'Added to Bag', `${p.name} added to cart.`);
        }}
      />

      {/* 8. FOOTER */}
      <footer className="bg-amber-950 text-amber-100 border-t border-amber-900 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-amber-950 font-serif font-bold flex items-center justify-center">
                H
              </div>
              <span className="font-serif font-bold text-lg text-white">{settings.storeName}</span>
            </div>
            <p className="text-xs text-amber-200/70 leading-relaxed">{settings.tagline}</p>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm text-white mb-3">Customer Concierge</h4>
            <ul className="space-y-2 text-xs text-amber-200/80">
              <li>
                <button onClick={() => setIsOrderTrackerOpen(true)} className="hover:text-white">
                  Track Delivery
                </button>
              </li>
              <li>
                <button onClick={() => setIsAIAdvisorOpen(true)} className="hover:text-white">
                  AI Skincare Advisor
                </button>
              </li>
              <li>Email: {settings.contactEmail}</li>
              <li>Phone: {settings.contactPhone}</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm text-white mb-3">Royal Collections</h4>
            <ul className="space-y-2 text-xs text-amber-200/80">
              {categories.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <button onClick={() => setSelectedCategory(c.id)} className="hover:text-white">
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm text-white mb-3">Guaranteed Excellence</h4>
            <p className="text-xs text-amber-200/70 mb-3">
              Crafted in compliance with international botanical standards. 100% Cruelty-Free & Paraben-Free.
            </p>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 bg-amber-900/60 rounded text-[10px] text-amber-300 border border-amber-800">
                24K Gold Saffron
              </span>
              <span className="px-2.5 py-1 bg-amber-900/60 rounded text-[10px] text-amber-300 border border-amber-800">
                Organic Certified
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-amber-900/50 py-4 text-center text-[11px] text-amber-300/60">
          © {new Date().getFullYear()} {settings.storeName}. All Rights Reserved. Built for luxury e-commerce excellence.
        </div>
      </footer>
    </div>
  );
};
