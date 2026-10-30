import React from "react";
import { Heart, Plus, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useAddToCart } from "../../hooks/use-cart";
import { useToggleWishlist, useWishlistIds } from "../../hooks/use-wishlist";
import { useCartUIStore } from "../../stores/cart-ui-store";
import { useAuthStore } from "../../stores/auth-store";
import { useRequireLogin } from "../../hooks/use-auth";
import { PLACEHOLDER_IMAGE } from "../../lib/product-helpers";

interface ProductProps {
  id?: number | string;
  slug?: string;
  name: string;
  category?: string;
  weight?: string;
  unit?: string;
  price: string;
  oldPrice?: string;
  compareAtPrice?: string;
  rating?: number;
  avgRating?: string;
  reviewCount?: number;
  img?: string;
  imageUrl?: string;
  discount?: string;
  isOnSale?: boolean;
  inStock?: boolean;
}

/**
 * The one product card used everywhere (category pages, Hot Deals, related products and the home
 * page carousels). It fills the width it is given, so the grid or carousel decides how many fit:
 * two side by side on a phone, up to five on a wide screen.
 */
const ProductCard: React.FC<ProductProps> = ({
  id,
  slug,
  name,
  category,
  weight,
  unit,
  price,
  oldPrice,
  compareAtPrice,
  rating,
  avgRating,
  reviewCount = 0,
  img,
  imageUrl,
  discount,
  inStock = true,
}) => {
  const productId = (id || "") as string;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();
  const wishlistIds = useWishlistIds();
  const openDrawer = useCartUIStore((s) => s.openDrawer);
  const requireLogin = useRequireLogin();
  const isInWishlist = wishlistIds.includes(productId);

  const displayPrice = price.startsWith("$") ? price : `$${parseFloat(price).toFixed(2)}`;
  const displayOldPrice = oldPrice || compareAtPrice;
  let formattedOldPrice = displayOldPrice
    ? displayOldPrice.startsWith("$")
      ? displayOldPrice
      : `$${parseFloat(displayOldPrice).toFixed(2)}`
    : null;
  const displayImage = img || imageUrl || PLACEHOLDER_IMAGE;
  const productLink = slug ? `/product/${slug}` : `/product/${id}`;
  const stars = rating ?? (parseFloat(avgRating || "") || 0);

  // Discount badge, only when the old price really is higher
  let discountBadge = discount;
  if (formattedOldPrice) {
    const priceParsed = parseFloat(displayPrice.replace("$", ""));
    const oldPriceParsed = parseFloat(formattedOldPrice.replace("$", ""));
    if (oldPriceParsed > priceParsed) {
      if (!discountBadge) discountBadge = `${Math.round(((oldPriceParsed - priceParsed) / oldPriceParsed) * 100)}% off`;
    } else {
      formattedOldPrice = null;
    }
  }

  return (
    <Link
      to={productLink}
      className="group h-full w-full bg-white border border-text-50 rounded-xl p-3 sm:p-4 flex flex-col gap-3 hover:shadow-card-hover transition text-inherit no-underline"
    >
      {/* Image, with the badge and wishlist button on top of it */}
      <div className="relative aspect-square rounded-lg bg-background-secondary/60 flex items-center justify-center overflow-hidden">
        <img
          src={displayImage}
          className="w-full h-full object-contain p-2 sm:p-3 transition-transform duration-300 group-hover:scale-105"
          alt={name}
          loading="lazy"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith("placeholder.svg")) e.currentTarget.src = PLACEHOLDER_IMAGE;
          }}
        />
        {!inStock ? (
          <span className="absolute top-2 left-2 text-body-xs font-medium bg-red-500 text-white rounded-full px-2.5 py-0.5">
            Out of stock
          </span>
        ) : discountBadge ? (
          <span className="absolute top-2 left-2 text-body-xs font-medium bg-green-600 text-white rounded-full px-2.5 py-0.5">
            {discountBadge}
          </span>
        ) : null}
        <button
          type="button"
          aria-label={isInWishlist ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          aria-pressed={isInWishlist}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isAuthenticated) return requireLogin("Sign in to save items to your wishlist");
            toggleWishlist.mutate({ productId, isInWishlist });
          }}
          className={`absolute top-1.5 right-1.5 w-9 h-9 rounded-full border flex items-center justify-center transition ${
            isInWishlist
              ? "bg-red-50 border-red-300"
              : "bg-white/90 border-text-50 hover:bg-red-50 hover:border-red-300"
          }`}
        >
          <Heart
            size={18}
            className={isInWishlist ? "text-red-500 fill-red-500" : "text-text-300"}
          />
        </button>
      </div>

      {/* Name and details */}
      <div className="flex-1 min-w-0">
        {(category || reviewCount > 0) && (
          <div className="flex items-center justify-between gap-2">
            {category && <p className="text-body-xs sm:text-body-sm text-green-600 line-clamp-1">{category}</p>}
            {reviewCount > 0 && (
              <span className="shrink-0 inline-flex items-center gap-1 text-body-xs sm:text-body-sm font-medium text-text-400">
                <Star size={14} className="text-yellow-500 fill-yellow-500" aria-hidden="true" />
                {stars.toFixed(1)}
              </span>
            )}
          </div>
        )}
        <h3 className="mt-1 text-body-sm sm:text-body-md font-medium text-text-500 line-clamp-2 group-hover:text-green-600 transition">
          {name}
        </h3>
        {(weight || unit) && <p className="text-body-xs sm:text-body-sm text-text-200 mt-0.5">{weight || unit}</p>}
      </div>

      {/* Price and add button: stacked on narrow phone cards, side by side from 640px */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-baseline flex-wrap gap-x-1.5">
          <span className="text-body-md sm:text-title font-semibold text-text-500">{displayPrice}</span>
          {formattedOldPrice && (
            <span className="text-body-xs sm:text-body-sm text-text-200 line-through">{formattedOldPrice}</span>
          )}
        </div>

        <button
          type="button"
          aria-label={`Add ${name} to cart`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!productId) return;
            if (!isAuthenticated) return requireLogin("Sign in to add items to your cart");
            addToCart.mutate({ productId }, { onSuccess: () => openDrawer() });
          }}
          disabled={!inStock || addToCart.isPending}
          className="h-10 w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1 rounded-full bg-green-50 text-green-600 px-4 text-body-sm font-medium hover:bg-green-500 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-50 disabled:hover:text-green-600"
        >
          {!inStock ? (
            "Sold out"
          ) : addToCart.isPending ? (
            "Adding…"
          ) : (
            <>
              <Plus size={16} aria-hidden="true" /> Add
            </>
          )}
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
