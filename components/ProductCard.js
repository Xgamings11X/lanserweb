// components/ProductCard.js
import { ShoppingCart, Zap } from 'lucide-react';

const BADGE_STYLES = {
  orange: 'badge-orange',
  red: 'badge-red',
  purple: 'badge-purple',
  blue: 'badge-blue',
  green: 'badge-green',
  yellow: 'badge-yellow',
};

export default function ProductCard({ product, onBuy, index }) {
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  const features = (() => {
    try {
      return typeof product.features === 'string'
        ? JSON.parse(product.features)
        : product.features || [];
    } catch { return []; }
  })();

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(product.price);

  const formattedOriginal = product.original_price
    ? new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
      }).format(product.original_price)
    : null;

  return (
    <div
      className="relative bg-dark-3 border border-orange-500/10 rounded-2xl overflow-hidden card-hover flex flex-col animate-fade-up"
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}>

      {/* Badge */}
      {product.badge && (
        <div className={`absolute top-3 right-3 z-10 ribbon text-xs font-bold tracking-widest rounded-full px-2 py-0.5 font-ui ${BADGE_STYLES[product.badge_color] || 'badge-orange'}`}>
          {product.badge}
        </div>
      )}

      {/* Discount Badge */}
      {discount && (
        <div className="absolute top-3 left-3 z-10 bg-red-500/90 text-white text-xs font-bold font-ui rounded-full px-2 py-0.5">
          -{discount}%
        </div>
      )}

      {/* Product Image */}
      <div className="relative h-44 bg-dark-4 overflow-hidden flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle at center, rgba(249,115,22,0.08) 0%, #1a1a25 70%)',
        }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain p-4 hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-7xl filter drop-shadow-lg">
            {product.category_slug === 'rank' ? '👑' :
             product.category_slug === 'weapon' ? '⚔️' :
             product.category_slug === 'sellwand' ? '🪄' :
             product.category_slug === 'auraskills' ? '✨' :
             product.category_slug === 'crate-key' ? '🗝️' :
             product.category_slug === 'kit' ? '🎒' : '📦'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-1">
          <span className="text-xs font-ui text-orange-400/60 tracking-widest uppercase">
            {product.category_name}
          </span>
        </div>

        <h3 className="font-display text-lg font-bold text-white mb-2 leading-tight">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-gray-500 font-body text-sm mb-3 leading-relaxed line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Features */}
        {features.length > 0 && (
          <ul className="mb-4 space-y-1">
            {features.slice(0, 4).map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-xs font-body text-gray-400">
                <Zap size={10} className="text-orange-400 mt-1 flex-shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
            {features.length > 4 && (
              <li className="text-xs text-orange-400/50 font-ui pl-4">
                +{features.length - 4} fitur lainnya
              </li>
            )}
          </ul>
        )}

        {/* Price & Buy Button */}
        <div className="mt-auto pt-4 border-t border-orange-500/10">
          <div className="flex items-end justify-between mb-3">
            <div>
              {formattedOriginal && (
                <div className="text-xs text-gray-600 line-through font-body">{formattedOriginal}</div>
              )}
              <div className="font-display text-xl font-bold"
                style={{ color: '#f97316', textShadow: '0 0 10px rgba(249,115,22,0.3)' }}>
                {formattedPrice}
              </div>
            </div>
          </div>

          <button
            onClick={() => onBuy(product)}
            className="btn-primary w-full rounded-xl py-3 text-sm flex items-center justify-center gap-2">
            <ShoppingCart size={15} />
            Beli Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
