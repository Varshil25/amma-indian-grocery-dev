import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { Link } from "react-router-dom";

import { FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { AiFillStar } from "react-icons/ai";
import { HiChevronLeft, HiChevronRight, HiPlus } from "react-icons/hi";

import type { ProductListItem } from "../../../hooks/use-products";
import { useAddToCart } from "../../../hooks/use-cart";
import { useToggleWishlist, useWishlistIds } from "../../../hooks/use-wishlist";
import { useCartUIStore } from "../../../stores/cart-ui-store";
import { useAuthStore } from "../../../stores/auth-store";
import { useRequireLogin } from "../../../hooks/use-auth";
import { PLACEHOLDER_IMAGE, formatUnit } from "../../../lib/product-helpers";

const HomeProductCard: React.FC<{ p: ProductListItem }> = ({ p }) => {
  const price = parseFloat(p.price);
  const oldPrice = p.compareAtPrice ? parseFloat(p.compareAtPrice) : null;
  const showOld = oldPrice !== null && oldPrice > price;
  const rating = parseFloat(p.avgRating) || 0;
  const image = p.images?.[0]?.url || PLACEHOLDER_IMAGE;
  const discount = showOld ? `${Math.round(((oldPrice! - price) / oldPrice!) * 100)}% off` : null;
  const inStock = p.inventory ? p.inventory.stockQuantity - p.inventory.reservedQuantity > 0 : true;
  const unit = formatUnit(p.unit, p.unitValue);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const requireLogin = useRequireLogin();
  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();
  const wishlistIds = useWishlistIds();
  const openDrawer = useCartUIStore((s) => s.openDrawer);
  const isInWishlist = wishlistIds.includes(p.id);

  return (
    <Link to={`/product/${p.slug}`} className="block text-inherit no-underline">
      <div className="bg-white border border-black-100 rounded-2xl p-4 md:p-5 flex flex-col">
        <div className="flex justify-between items-start">
          {!inStock ? (
            <span className="inline-block bg-red-500 text-white text-[10px] font-medium px-3 py-1 rounded-full">Out of stock</span>
          ) : discount ? (
            <span className="inline-block bg-green-500 text-white text-[10px] font-medium px-3 py-1 rounded-full">{discount}</span>
          ) : (
            <div />
          )}
          <button
            aria-label={isInWishlist ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isAuthenticated) return requireLogin("Sign in to save items to your wishlist");
              toggleWishlist.mutate({ productId: p.id, isInWishlist });
            }}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition ${
              isInWishlist ? "bg-red-50 border-red-300" : "border-black-100 text-text-200 hover:bg-red-50"
            }`}
          >
            {isInWishlist ? <FaHeart className="w-5 h-5 text-red-500" /> : <FiHeart className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center mt-4 mb-4 h-[220px]">
          <img src={image} alt={p.name} loading="lazy" className="max-h-[220px] object-contain" />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-caption text-green-500">{p.category?.name}</p>
          {p.reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <AiFillStar className="text-yellow-500 w-4 h-4" />
              <p className="text-lg font-medium">{rating.toFixed(1)}</p>
            </div>
          )}
        </div>
        <div className="mt-3">
          <h3 className="text-lg md:text-xl font-medium text-text-500 line-clamp-1">{p.name}</h3>
          {unit && <p className="text-sm text-text-300 mt-1">{unit}</p>}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold text-text-500">${price.toFixed(2)}</span>
            {showOld && <span className="text-base text-text-300 line-through">${oldPrice!.toFixed(2)}</span>}
          </div>
          <button
            aria-label={`Add ${p.name} to cart`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isAuthenticated) return requireLogin("Sign in to add items to your cart");
              addToCart.mutate({ productId: p.id }, { onSuccess: () => openDrawer() });
            }}
            disabled={addToCart.isPending || !inStock}
            className="flex items-center gap-2 bg-green-50 text-green-600 rounded-full px-4 py-2 text-sm font-medium hover:bg-green-100 transition disabled:opacity-50"
          >
            <HiPlus className="w-5 h-5" /> {addToCart.isPending ? "..." : "Add"}
          </button>
        </div>
      </div>
    </Link>
  );
};

interface Props {
  /** unique prefix for the swiper nav buttons */
  id: string;
  eyebrow: string;
  title: string;
  highlight: string;
  products: ProductListItem[] | undefined;
  isLoading: boolean;
  viewAllHref: string;
  background?: string;
}

/** Home page product carousel. Renders nothing when there are no real products to show. */
export default function ProductCarousel({ id, eyebrow, title, highlight, products, isLoading, viewAllHref, background = "bg-background-secondary" }: Props) {
  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <section className={`w-full ${background} py-20 select-none`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-caption text-text-300">{eyebrow}</p>
            <h2 className="text-body2 md:text-4xl font-semibold">
              {title} <span className="text-green-500">{highlight}</span>
            </h2>
          </div>
          <Link to={viewAllHref} className="bg-green-500 text-white px-4 py-2 text-sm rounded-full hover:bg-green-700 flex items-center gap-2 sm:px-5 sm:py-3 sm:text-base">
            View All <HiChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[420px] bg-white/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="relative">
            <button className={`${id}-prev absolute -left-6 md:-left-10 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md w-10 h-10 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white transition hidden sm:flex`} type="button" aria-label="Previous">
              <HiChevronLeft className="text-xl" />
            </button>
            <button className={`${id}-next absolute -right-6 md:-right-10 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md w-10 h-10 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white transition hidden sm:flex`} type="button" aria-label="Next">
              <HiChevronRight className="text-xl" />
            </button>

            <Swiper
              modules={[Navigation, Autoplay]}
              autoplay={{ delay: 2500, disableOnInteraction: false }}
              navigation={{ nextEl: `.${id}-next`, prevEl: `.${id}-prev` }}
              // looping needs more slides than are visible
              loop={(products?.length ?? 0) > 3}
              breakpoints={{
                320: { slidesPerView: 1.2, spaceBetween: 16 },
                640: { slidesPerView: 2, spaceBetween: 18 },
                1024: { slidesPerView: 3, spaceBetween: 24 },
              }}
              className="pt-6"
            >
              {products!.map((p) => (
                <SwiperSlide key={p.id}>
                  <HomeProductCard p={p} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
    </section>
  );
}
