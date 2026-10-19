import React from 'react';
import { Product, CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Star, ShoppingBag, Eye, Heart, Sparkles, Check } from 'lucide-react';

interface Props {
  product: Product;
  currency: CurrencyCode;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, shade?: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
}

export const ProductCard: React.FC<Props> = ({
  product,
  currency,
  onQuickView,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}) => {
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 15;

  return (
    <div className="group relative bg-white rounded-2xl border border-amber-900/10 hover:border-amber-500/30 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full overflow-hidden bg-amber-50/50">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {product.isBestSeller && (
            <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase bg-amber-600 text-white rounded-full shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Best Seller
            </span>
          )}
          {product.isNewArrival && (
            <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase bg-emerald-700 text-white rounded-full shadow-sm">
              New
            </span>
          )}
          {product.salePriceUSD && (
            <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase bg-rose-700 text-white rounded-full shadow-sm">
              Sale
            </span>
          )}
        </div>

        {/* Wishlist Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-10 shadow-sm ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600'
              : 'bg-white/80 text-neutral-600 hover:text-rose-600 hover:bg-white'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
        </button>

        {/* Quick View Floating Action */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 flex gap-2 z-10">
          <button
            onClick={() => onQuickView(product)}
            className="flex-1 py-2 px-3 bg-white/95 backdrop-blur-md hover:bg-amber-950 hover:text-amber-200 text-neutral-800 text-xs font-semibold rounded-xl transition-colors duration-200 shadow-md flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> Quick View
          </button>
        </div>
      </div>

      {/* Product Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <span className="font-medium text-amber-800/80 uppercase tracking-wider text-[11px]">
              {product.categoryName}
            </span>
            <div className="flex items-center gap-1 text-amber-500 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-neutral-400 text-[10px]">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Title & Subtitle */}
          <h3
            onClick={() => onQuickView(product)}
            className="font-serif font-bold text-neutral-900 hover:text-amber-700 transition-colors cursor-pointer line-clamp-1 text-base"
          >
            {product.name}
          </h3>
          <p className="text-xs text-neutral-500 line-clamp-1 mb-2 font-light">
            {product.subtitle}
          </p>

          {/* Shades preview if available */}
          {product.shades && product.shades.length > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider mr-1">Shades:</span>
              <div className="flex -space-x-1 overflow-hidden">
                {product.shades.slice(0, 4).map((shade, idx) => (
                  <span
                    key={idx}
                    className="inline-block w-3.5 h-3.5 rounded-full border border-white shadow-xs bg-gradient-to-br from-amber-700 to-rose-900"
                    title={shade}
                  />
                ))}
                {product.shades.length > 4 && (
                  <span className="text-[9px] text-neutral-500 pl-1 self-center font-medium">
                    +{product.shades.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Price & Add to Cart */}
        <div className="pt-2 border-t border-amber-900/5 flex items-center justify-between mt-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-serif font-bold text-amber-900">
                {formatCurrency(product.salePriceUSD ?? product.priceUSD, currency)}
              </span>
              {product.salePriceUSD && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatCurrency(product.priceUSD, currency)}
                </span>
              )}
            </div>

            {isLowStock && (
              <span className="text-[10px] font-medium text-amber-600 block">
                Only {product.stockQuantity} left
              </span>
            )}
            {isOutOfStock && (
              <span className="text-[10px] font-medium text-rose-600 block">
                Out of stock
              </span>
            )}
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className={`p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
              isOutOfStock
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : 'bg-amber-900 hover:bg-amber-950 text-amber-100 active:scale-95 shadow-sm'
            }`}
            title="Add to Cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
