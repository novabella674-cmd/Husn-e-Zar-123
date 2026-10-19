import React, { useState } from 'react';
import { Product, Review, CurrencyCode } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  X, Star, ShoppingBag, Heart, ShieldCheck, Truck, RotateCcw, 
  Sparkles, Check, Info, Leaf 
} from 'lucide-react';

interface Props {
  product: Product | null;
  currency: CurrencyCode;
  reviews: Review[];
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, shade?: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const ProductDetailModal: React.FC<Props> = ({
  product,
  currency,
  reviews,
  onClose,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  addToast,
}) => {
  if (!product) return null;

  const [selectedShade, setSelectedShade] = useState<string>(
    product.shades && product.shades.length > 0 ? product.shades[0] : ''
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'ingredients' | 'howToUse' | 'reviews'>('details');

  const productReviews = reviews.filter(r => r.productId === product.id && r.status === 'Approved');

  const handleAddToCart = () => {
    if (product.stockQuantity <= 0) {
      addToast('error', 'Out of Stock', 'This item is currently sold out.');
      return;
    }
    onAddToCart(product, quantity, selectedShade || undefined);
    addToast('success', 'Added to Cart', `${quantity}x ${product.name} added to your bag.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 border border-amber-900/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-neutral-400 hover:text-neutral-900 bg-white/80 backdrop-blur-md rounded-full transition-colors shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Image */}
          <div className="relative bg-amber-50/50 p-6 flex items-center justify-center min-h-[340px] md:min-h-[480px]">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="max-h-[420px] w-auto object-contain drop-shadow-xl transition-transform hover:scale-105 duration-300"
            />
            {product.isOrganic && (
              <span className="absolute top-4 left-4 bg-emerald-800 text-emerald-100 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 shadow-sm">
                <Leaf className="w-3.5 h-3.5" /> 100% Organic Botanical
              </span>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="p-6 md:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-widest bg-amber-100/60 px-2.5 py-0.5 rounded-full">
                  {product.categoryName}
                </span>
                <span className="text-xs text-neutral-400">SKU: {product.sku}</span>
              </div>

              <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-1">
                {product.name}
              </h2>
              <p className="text-sm text-neutral-500 mb-3 font-light">
                {product.subtitle}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4 text-sm">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-neutral-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-neutral-800">{product.rating.toFixed(1)}</span>
                <span className="text-neutral-400">•</span>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-amber-800 underline hover:text-amber-950 font-medium text-xs"
                >
                  {productReviews.length} Verified Reviews
                </button>
              </div>

              {/* Pricing */}
              <div className="flex items-baseline gap-3 mb-6 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-900/10">
                <span className="text-2xl font-serif font-bold text-amber-950">
                  {formatCurrency(product.salePriceUSD ?? product.priceUSD, currency)}
                </span>
                {product.salePriceUSD && (
                  <span className="text-sm text-neutral-400 line-through">
                    {formatCurrency(product.priceUSD, currency)}
                  </span>
                )}
                {product.salePriceUSD && (
                  <span className="ml-auto text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                    Save {Math.round((1 - product.salePriceUSD / product.priceUSD) * 100)}%
                  </span>
                )}
              </div>

              {/* Shade Selection */}
              {product.shades && product.shades.length > 0 && (
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                    Select Shade: <span className="text-amber-800 normal-case font-bold">{selectedShade}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.shades.map((shade) => (
                      <button
                        key={shade}
                        onClick={() => setSelectedShade(shade)}
                        className={`px-3 py-1.5 text-xs rounded-xl font-medium border transition-all ${
                          selectedShade === shade
                            ? 'border-amber-900 bg-amber-900 text-amber-100 shadow-sm'
                            : 'border-neutral-200 hover:border-amber-700 text-neutral-700 bg-white'
                        }`}
                      >
                        {shade}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector & Add to Cart */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center border border-neutral-300 rounded-xl bg-neutral-50 overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-neutral-600 hover:bg-neutral-200 transition-colors font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-sm font-semibold text-neutral-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                    className="px-3 py-2 text-neutral-600 hover:bg-neutral-200 transition-colors font-bold text-sm"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stockQuantity <= 0}
                  className={`flex-1 py-3 px-6 rounded-2xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                    product.stockQuantity <= 0
                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      : 'bg-amber-900 hover:bg-amber-950 text-amber-100 active:scale-98'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {product.stockQuantity <= 0 ? 'Out of Stock' : 'Add to Bag'}
                </button>

                <button
                  onClick={() => onToggleWishlist(product)}
                  className={`p-3 rounded-2xl border transition-colors ${
                    isWishlisted
                      ? 'border-rose-300 bg-rose-50 text-rose-600'
                      : 'border-neutral-200 text-neutral-600 hover:text-rose-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                </button>
              </div>

              {/* Tabs: Description / Ingredients / How to Use / Reviews */}
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex border-b border-neutral-200 text-xs font-semibold gap-4 mb-3">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`pb-2 border-b-2 transition-colors ${
                      activeTab === 'details'
                        ? 'border-amber-800 text-amber-900 font-bold'
                        : 'border-transparent text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Description
                  </button>
                  <button
                    onClick={() => setActiveTab('ingredients')}
                    className={`pb-2 border-b-2 transition-colors ${
                      activeTab === 'ingredients'
                        ? 'border-amber-800 text-amber-900 font-bold'
                        : 'border-transparent text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Ingredients
                  </button>
                  <button
                    onClick={() => setActiveTab('howToUse')}
                    className={`pb-2 border-b-2 transition-colors ${
                      activeTab === 'howToUse'
                        ? 'border-amber-800 text-amber-900 font-bold'
                        : 'border-transparent text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    How to Use
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-2 border-b-2 transition-colors ${
                      activeTab === 'reviews'
                        ? 'border-amber-800 text-amber-900 font-bold'
                        : 'border-transparent text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Reviews ({productReviews.length})
                  </button>
                </div>

                <div className="text-xs text-neutral-600 leading-relaxed min-h-[80px]">
                  {activeTab === 'details' && <p>{product.description}</p>}
                  {activeTab === 'ingredients' && <p>{product.ingredients}</p>}
                  {activeTab === 'howToUse' && <p>{product.howToUse}</p>}
                  {activeTab === 'reviews' && (
                    <div className="space-y-3 max-h-[140px] overflow-y-auto pr-1">
                      {productReviews.length === 0 ? (
                        <p className="text-neutral-400 italic">No reviews yet for this product.</p>
                      ) : (
                        productReviews.map((r) => (
                          <div key={r.id} className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-neutral-800">{r.customerName}</span>
                              <span className="text-[10px] text-neutral-400">{formatDate(r.createdAt)}</span>
                            </div>
                            <div className="flex items-center text-amber-500 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-amber-400' : 'text-neutral-200'}`} />
                              ))}
                            </div>
                            <p className="font-semibold text-neutral-900 text-[11px]">{r.title}</p>
                            <p className="text-neutral-600 text-[11px]">{r.comment}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Badges Guarantee */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-neutral-100 text-[10px] text-neutral-500 text-center">
              <div className="flex items-center justify-center gap-1">
                <Truck className="w-3.5 h-3.5 text-amber-800" /> Free Global Express
              </div>
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-800" /> 100% Authentic
              </div>
              <div className="flex items-center justify-center gap-1">
                <RotateCcw className="w-3.5 h-3.5 text-amber-800" /> Easy 30-Day Return
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
