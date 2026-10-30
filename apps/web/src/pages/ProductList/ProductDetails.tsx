import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import SEO from "../../components/SEO";
import { HiMinus, HiPlus } from "react-icons/hi";
import { AiFillStar } from "react-icons/ai";
import { Link, useParams } from "react-router-dom";
import { useProductDetail } from "../../hooks/use-products";
import { useAddToCart } from "../../hooks/use-cart";
import { useCartUIStore } from "../../stores/cart-ui-store";
import { useAuthStore } from "../../stores/auth-store";
import ProductCard from "./ProductCard";
import SectionHeading from "../../components/SectionHeading";
import { mapProductToCard, PLACEHOLDER_IMAGE, formatUnit } from "../../lib/product-helpers";
import { useRequireLogin } from "../../hooks/use-auth";
import { ApiError } from "../../lib/api-client";

const ProductDetails: React.FC = () => {
  const { productId } = useParams();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addToCart = useAddToCart();
  const openDrawer = useCartUIStore((s) => s.openDrawer);
  const requireLogin = useRequireLogin();

  const { data, isLoading, isError, error, refetch } = useProductDetail(productId || "");

  const product = data?.product;
  const relatedProducts = data?.relatedProducts || [];

  if (isLoading) {
    return (
      <>
        <PageHeader title="Loading…" titleAs="p" breadcrumbs={[{ label: "Home", href: "/" }]} />
        <div className="container mx-auto px-4 sm:px-6 py-8 md:py-14">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <div className="w-full lg:w-[480px] h-[300px] sm:h-[400px] lg:h-[480px] bg-background-secondary rounded-xl animate-pulse" />
            <div className="flex-1 space-y-4">
              <div className="h-6 w-32 bg-background-secondary rounded animate-pulse" />
              <div className="h-10 w-64 bg-background-secondary rounded animate-pulse" />
              <div className="h-6 w-48 bg-background-secondary rounded animate-pulse" />
              <div className="h-24 w-full bg-background-secondary rounded animate-pulse" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isError || !product) {
    const notFound = !isError || (error instanceof ApiError && error.status === 404);
    return (
      <>
        <PageHeader
          title={notFound ? "Product not found" : "Something went wrong"}
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Product" }]}
        />
        <div className="container mx-auto px-4 sm:px-6 py-16 md:py-20 text-center">
          <p className="text-text-300 text-body-lg mb-6">
            {notFound
              ? "This product isn't available any more, or the link is wrong."
              : (error as Error)?.message || "We couldn't load this product right now."}
          </p>
          {notFound ? (
            <Link to="/all-categories" className="btn-primary inline-block">
              Browse products
            </Link>
          ) : (
            <button onClick={() => refetch()} className="btn-primary">
              Try again
            </button>
          )}
        </div>
      </>
    );
  }

  const images = product.images || [];
  const primaryImage = images[selectedImage]?.url || PLACEHOLDER_IMAGE;
  const price = parseFloat(product.price);
  const compareAtPrice = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;
  const rating = parseFloat(product.avgRating) || 0;
  const available = product.inventory
    ? product.inventory.stockQuantity - product.inventory.reservedQuantity
    : 99;
  const inStock = available > 0;
  const maxQty = Math.max(1, Math.min(99, available));
  const unitLabel = formatUnit(product.unit, product.unitValue);

  return (
    <>
      <SEO
        title={product.name}
        description={product.description || `Buy ${product.name} at Amma Indian Grocery.`}
        keywords={`${product.name}, ${product.category.name}, indian grocery`}
      />
      {/* The banner shows the category; the product name is the page's h1 below */}
      <PageHeader
        title={product.category.name}
        titleAs="p"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "All Categories", href: "/all-categories" },
          { label: product.category.name, href: `/categories/${product.category.slug}` },
          { label: product.name },
        ]}
      />

      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-14">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* IMAGE BOX */}
          <div className="w-full lg:w-[480px]">
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-[300px] sm:h-[400px] lg:h-[480px] object-contain border border-text-50 rounded-xl bg-white p-4"
            />
            {images.length > 1 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {images.map((img: any, i: number) => (
                  <button
                    key={img.id || i}
                    onClick={() => setSelectedImage(i)}
                    aria-label={`Show photo ${i + 1}`}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 overflow-hidden ${
                      i === selectedImage ? "border-green-500" : "border-text-50"
                    }`}
                  >
                    <img src={img.url} alt={img.altText || ""} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT INFO */}
          <div className="w-full lg:flex-1 lg:max-w-[600px]">
            <p className="text-green-700 text-body-md mb-2">{product.category.name}</p>
            <h1 className="text-h4 font-semibold text-text-500 mb-2 [overflow-wrap:anywhere]">{product.name}</h1>
            {(product.brand || unitLabel) && (
              <p className="text-text-300 text-body-lg mb-3">{[product.brand, unitLabel].filter(Boolean).join(" · ")}</p>
            )}

            <div className="flex items-center gap-2 mb-4">
              {Array(5).fill(null).map((_, i) => (
                <AiFillStar
                  key={i}
                  className={`text-xl sm:text-2xl ${i < Math.round(rating) ? "text-yellow-500" : "text-text-100"}`}
                />
              ))}
              <span className="text-body-lg font-medium ml-1">{rating.toFixed(1)}</span>
              <span className="text-text-200 text-body-sm">({product.reviewCount} reviews)</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5">
              <span className="text-h6 font-semibold text-text-500">${price.toFixed(2)}</span>
              {compareAtPrice && compareAtPrice > price && (
                <span className="text-title font-medium line-through text-text-200">${compareAtPrice.toFixed(2)}</span>
              )}
              {compareAtPrice && compareAtPrice > price && (
                <span className="bg-green-100 text-green-700 text-body-sm font-medium px-3 py-1 rounded-full">
                  {Math.round(((compareAtPrice - price) / compareAtPrice) * 100)}% off
                </span>
              )}
            </div>

            {!inStock ? (
              <div className="mb-4">
                <span className="bg-red-100 text-red-700 text-body-sm font-medium px-3 py-1 rounded-full">Out of Stock</span>
              </div>
            ) : available <= 5 ? (
              <p className="mb-4 text-orange-600 text-body-sm font-medium">Only {available} left</p>
            ) : null}

            {product.description && (
              <p className="text-text-300 text-body-lg mb-6">{product.description}</p>
            )}

            {product.variants?.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                {product.variants.map((v: any) => (
                  <span key={v.id} className="text-body-md text-text-500 font-medium bg-background-secondary px-4 py-2 rounded-md border border-text-50 cursor-pointer hover:border-green-500 transition">
                    {v.name}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <button
                className="w-11 h-11 border border-text-100 rounded-lg flex items-center justify-center bg-background-secondary hover:bg-text-50"
                aria-label="Decrease quantity"
                onClick={() => setQty(qty > 1 ? qty - 1 : 1)}
              >
                <HiMinus className="text-text-300" size={20} />
              </button>
              <span className="min-w-[2ch] text-center text-title font-semibold text-green-700" aria-live="polite">{qty}</span>
              <button
                className="w-11 h-11 border border-text-100 rounded-lg flex items-center justify-center bg-background-secondary hover:bg-text-50 disabled:opacity-40"
                disabled={qty >= maxQty}
                aria-label="Increase quantity"
                onClick={() => setQty(Math.min(maxQty, qty + 1))}
              >
                <HiPlus className="text-green-700" size={20} />
              </button>
            </div>

            <button
              disabled={!inStock || addToCart.isPending}
              onClick={() => {
                if (!product) return;
                if (!isAuthenticated) return requireLogin("Sign in to add items to your cart");
                addToCart.mutate(
                  { productId: product.id, quantity: qty },
                  { onSuccess: () => openDrawer() }
                );
              }}
              className="w-full h-12 sm:h-14 bg-green-50 border border-green-700 text-green-700 text-body-lg font-medium rounded-xl hover:bg-green-700 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!inStock ? "Out of Stock" : addToCart.isPending ? "Adding..." : "Add to Cart"}
            </button>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-14 md:mt-20">
            <SectionHeading title="You may also" highlight="like" align="left" className="mb-6 md:mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} {...mapProductToCard(p)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductDetails;
