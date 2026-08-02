import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import SEO from "../../components/SEO";
import { HiMinus, HiPlus } from "react-icons/hi";
import { AiFillStar } from "react-icons/ai";
import { useParams } from "react-router-dom";
import { useProductDetail } from "../../hooks/use-products";
import { useAddToCart } from "../../hooks/use-cart";
import { useCartUIStore } from "../../stores/cart-ui-store";
import { useAuthStore } from "../../stores/auth-store";
import ProductCard from "./ProductCard";
import { mapProductToCard } from "../../lib/product-helpers";

// Fallback
import orange from "../../assets/Images/Homepage/orange.png";

const mockProduct = {
  category: "Vegetables & Fruits",
  title: "Fresh Oranges",
  price: 8.0,
  oldPrice: 10.0,
  rating: 4.8,
  weight: "1.0 kg",
  description:
    "Freshness you can trust, prices you'll love, everything you need, all in one place.",
  image: orange,
};

const ProductDetails: React.FC = () => {
  const { productId } = useParams();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addToCart = useAddToCart();
  const openDrawer = useCartUIStore((s) => s.openDrawer);

  const { data, isLoading, isError } = useProductDetail(productId || "");

  const product = data?.product;
  const relatedProducts = data?.relatedProducts || [];

  if (isLoading) {
    return (
      <>
        <PageHeader title="Loading..." breadcrumbs={[{ label: "Home", href: "/" }]} />
        <div className="container mx-auto px-4 py-14">
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="w-full lg:w-[480px] h-[480px] bg-background-secondary rounded-xl animate-pulse" />
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
    return (
      <>
        <PageHeader
          title={mockProduct.title}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: mockProduct.category },
            { label: mockProduct.title },
          ]}
        />
        <div className="container mx-auto px-4 py-14">
          <div className="flex flex-col lg:flex-row gap-10 justify-between">
            <div className="w-full lg:w-[480px]">
              <img src={mockProduct.image} alt={mockProduct.title} className="w-full h-[480px] object-contain border border-text-50 rounded-xl bg-white p-4" />
            </div>
            <div className="w-full lg:w-[590px]">
              <p className="text-green-700 text-base mb-2">{mockProduct.category}</p>
              <h1 className="text-4xl md:text-5xl font-semibold text-text-500 mb-3">{mockProduct.title}</h1>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-2xl font-semibold text-text-500">${mockProduct.price.toFixed(2)}</span>
                <span className="text-2xl line-through text-text-200">${mockProduct.oldPrice.toFixed(2)}</span>
              </div>
              <p className="text-text-300 text-lg mb-6">{mockProduct.description}</p>
              <button className="w-full h-[55px] bg-green-50 border border-green-700 text-green-700 text-lg font-medium rounded-xl hover:bg-green-700 hover:text-white transition">Add to Cart</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const images = product.images || [];
  const primaryImage = images[selectedImage]?.url || orange;
  const price = parseFloat(product.price);
  const compareAtPrice = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;
  const rating = parseFloat(product.avgRating) || 0;
  const inStock = product.inventory
    ? product.inventory.stockQuantity - product.inventory.reservedQuantity > 0
    : true;

  return (
    <>
      <SEO
        title={product.name}
        description={product.description || `Buy ${product.name} at Amma Indian Grocery.`}
        keywords={`${product.name}, ${product.category.name}, indian grocery`}
      />
      <PageHeader
        title={product.name}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "All Categories", href: "/all-categories" },
          { label: product.category.name, href: `/categories/${product.category.slug}` },
          { label: product.name },
        ]}
      />

      <div className="container mx-auto px-4 py-14">
        <div className="flex flex-col lg:flex-row gap-10 justify-between">
          {/* IMAGE BOX */}
          <div className="w-full lg:w-[480px]">
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-[480px] object-contain border border-text-50 rounded-xl bg-white p-4"
            />
            {images.length > 1 && (
              <div className="flex gap-3 mt-4">
                {images.map((img: any, i: number) => (
                  <button
                    key={img.id || i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-lg border-2 overflow-hidden ${
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
          <div className="w-full lg:w-[590px]">
            <p className="text-green-700 text-base font-normal mb-2">{product.category.name}</p>
            <h1 className="text-4xl md:text-5xl font-semibold text-text-500 mb-3">{product.name}</h1>

            <div className="flex items-center gap-2 mb-4">
              {Array(5).fill(null).map((_, i) => (
                <AiFillStar
                  key={i}
                  className={`text-2xl ${i < Math.round(rating) ? "text-yellow-500" : "text-text-100"}`}
                />
              ))}
              <span className="text-xl font-medium">{rating.toFixed(1)}</span>
              <span className="text-text-200 text-body-sm">({product.reviewCount} reviews)</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-2xl font-semibold text-text-500">${price.toFixed(2)}</span>
              {compareAtPrice && (
                <span className="text-2xl font-medium line-through text-text-200">${compareAtPrice.toFixed(2)}</span>
              )}
              {compareAtPrice && (
                <span className="bg-green-100 text-green-700 text-body-sm font-medium px-3 py-1 rounded-full">
                  {Math.round(((compareAtPrice - price) / compareAtPrice) * 100)}% off
                </span>
              )}
            </div>

            {!inStock && (
              <div className="mb-4">
                <span className="bg-red-100 text-red-700 text-body-sm font-medium px-3 py-1 rounded-full">Out of Stock</span>
              </div>
            )}

            {product.description && (
              <p className="text-text-300 text-lg leading-relaxed mb-6">{product.description}</p>
            )}

            {product.variants?.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                {product.variants.map((v: any) => (
                  <span key={v.id} className="text-lg text-text-500 font-medium bg-background-secondary px-4 py-2 rounded-md border border-text-50 cursor-pointer hover:border-green-500 transition">
                    {v.name}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mb-8">
              <button className="w-10 h-10 border border-text-100 rounded flex items-center justify-center bg-background-secondary hover:bg-text-50" onClick={() => setQty(qty > 1 ? qty - 1 : 1)}>
                <HiMinus className="text-text-300" size={20} />
              </button>
              <span className="text-2xl font-semibold text-green-700">{qty}</span>
              <button className="w-10 h-10 border border-text-100 rounded flex items-center justify-center bg-background-secondary hover:bg-text-50" onClick={() => setQty(qty + 1)}>
                <HiPlus className="text-green-700" size={20} />
              </button>
            </div>

            <button
              disabled={!inStock || addToCart.isPending}
              onClick={() => {
                if (!isAuthenticated || !product) return;
                addToCart.mutate(
                  { productId: product.id, quantity: qty },
                  { onSuccess: () => openDrawer() }
                );
              }}
              className="w-full h-[55px] bg-green-50 border border-green-700 text-green-700 text-lg font-medium rounded-xl hover:bg-green-700 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!inStock ? "Out of Stock" : addToCart.isPending ? "Adding..." : "Add to Cart"}
            </button>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="text-h4 font-semibold text-text-500 mb-8">You may also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
              {relatedProducts.slice(0, 4).map((p) => (
                <div className="flex justify-center" key={p.id}>
                  <ProductCard {...mapProductToCard(p)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductDetails;
