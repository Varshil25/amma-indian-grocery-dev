import React from "react";
import { Heart } from "lucide-react";
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
  img?: string;
  imageUrl?: string;
  discount?: string;
  isOnSale?: boolean;
  inStock?: boolean;
}

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
  img,
  imageUrl,
  discount,
  isOnSale,
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
  const formattedOldPrice = displayOldPrice
    ? displayOldPrice.startsWith("$")
      ? displayOldPrice
      : `$${parseFloat(displayOldPrice).toFixed(2)}`
    : null;
  const displayImage = img || imageUrl || PLACEHOLDER_IMAGE;
  const productLink = slug ? `/product/${slug}` : `/product/${id}`;

  // Calculate discount badge
  let discountBadge = discount;
  if (!discountBadge && formattedOldPrice && displayPrice) {
    const priceParsed = parseFloat(displayPrice.replace("$", ""));
    const oldPriceParsed = parseFloat(formattedOldPrice.replace("$", ""));
    if (oldPriceParsed > priceParsed) {
      const pct = Math.round(((oldPriceParsed - priceParsed) / oldPriceParsed) * 100);
      discountBadge = `${pct}%`;
    }
  }

  return (
    <Link
      to={productLink}
      className="w-[280px] bg-white border border-[#e9e9e9] rounded-lg px-4 py-5 flex flex-col gap-4 cursor-pointer hover:shadow-md transition text-inherit no-underline"
      tabIndex={0}
    >
      <div className="relative flex justify-center">
        {discountBadge && inStock && (
          <span className="absolute top-2 left-2 text-[10px] bg-green-600 text-white rounded-full px-3 py-1">
            {discountBadge}
          </span>
        )}
        {!inStock && (
          <span className="absolute top-2 left-2 text-[10px] bg-red-500 text-white rounded-full px-3 py-1">
            Out of Stock
          </span>
        )}
        <img
          src={displayImage}
          className="w-[150px] h-[150px] object-contain"
          alt={name}
          loading="lazy"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith("placeholder.svg")) e.currentTarget.src = PLACEHOLDER_IMAGE;
          }}
        />
        <button
          type="button"
          aria-label={isInWishlist ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isAuthenticated) return requireLogin("Sign in to save items to your wishlist");
            toggleWishlist.mutate({ productId, isInWishlist });
          }}
          className={`absolute top-2 right-2 border rounded-full p-2 transition cursor-pointer ${
            isInWishlist
              ? "bg-red-50 border-red-300"
              : "border-text-100 hover:bg-red-50 hover:border-red-300"
          }`}
        >
          <Heart
            size={18}
            className={`transition ${
              isInWishlist ? "text-red-500 fill-red-500" : "text-text-300 hover:text-red-500"
            }`}
          />
        </button>
      </div>

      <div>
        {category && <p className="text-green-500 text-sm font-normal">{category}</p>}
        <h3 className="text-lg font-medium text-black">{name}</h3>
        {(weight || unit) && (
          <p className="text-sm text-text-200">{weight || unit}</p>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium text-black">{displayPrice}</span>
          {formattedOldPrice && (
            <span className="text-text-100 line-through">{formattedOldPrice}</span>
          )}
        </div>

        <button
          type="button"
          tabIndex={-1}
          aria-label={`Add ${name} to cart`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!productId) return;
            if (!isAuthenticated) return requireLogin("Sign in to add items to your cart");
            addToCart.mutate({ productId }, { onSuccess: () => openDrawer() });
          }}
          disabled={!inStock || addToCart.isPending}
          className="bg-green-50 text-green-500 text-[14px] font-medium px-5 py-2 rounded-full hover:bg-green-500 hover:text-white transition select-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!inStock ? "Sold out" : addToCart.isPending ? "..." : "Add"}
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
