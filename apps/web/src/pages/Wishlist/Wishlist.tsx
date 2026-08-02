import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { useWishlist, useToggleWishlist } from "../../hooks/use-wishlist";
import { useAddToCart } from "../../hooks/use-cart";
import { useCartUIStore } from "../../stores/cart-ui-store";

export default function Wishlist() {
  const { data: items, isLoading } = useWishlist();
  const toggleWishlist = useToggleWishlist();
  const addToCart = useAddToCart();
  const openDrawer = useCartUIStore((s) => s.openDrawer);

  const handleAddToCart = (productId: string) => {
    addToCart.mutate(
      { productId },
      { onSuccess: () => openDrawer() }
    );
  };

  return (
    <>
      <PageHeader
        title="My Wishlist"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Wishlist" }]}
      />

      <section className="section-padding">
        <div className="container mx-auto px-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[320px] bg-background-secondary rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !items?.length ? (
            <div className="text-center py-20">
              <Heart size={56} className="mx-auto text-text-100 mb-4" />
              <h2 className="text-h4 font-semibold text-text-500 mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-text-300 text-body-md mb-8">
                Save your favorite products for later!
              </p>
              <Link
                to="/all-categories"
                className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg transition"
              >
                Explore Products
              </Link>
            </div>
          ) : (
            <>
              <p className="text-body-md text-text-300 mb-6">
                {items.length} saved item{items.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => {
                  const price = parseFloat(item.product.price);
                  const oldPrice = item.product.compareAtPrice
                    ? parseFloat(item.product.compareAtPrice)
                    : null;
                  const image = item.product.images?.[0]?.url;
                  const inStock = item.product.inventory
                    ? item.product.inventory.stockQuantity -
                        item.product.inventory.reservedQuantity >
                      0
                    : true;

                  return (
                    <div
                      key={item.id}
                      className="card p-4 flex flex-col"
                    >
                      {/* Image */}
                      <Link
                        to={`/product/${item.product.slug}`}
                        className="relative w-full h-[180px] bg-background-secondary rounded-lg flex items-center justify-center mb-4"
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={item.product.name}
                            className="max-h-[160px] object-contain"
                          />
                        ) : (
                          <ShoppingBag size={32} className="text-text-100" />
                        )}
                      </Link>

                      {/* Info */}
                      <div className="flex-1">
                        <p className="text-body-xs text-green-500 mb-1">
                          {item.product.category?.name}
                        </p>
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="text-body-md font-medium text-text-500 hover:text-green-600 transition line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-body-lg font-semibold text-text-500">
                            ${price.toFixed(2)}
                          </span>
                          {oldPrice && (
                            <span className="text-body-sm text-text-200 line-through">
                              ${oldPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {!inStock && (
                          <p className="text-body-xs text-red-500 font-medium mt-1">Out of stock</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleAddToCart(item.productId)}
                          disabled={!inStock || addToCart.isPending}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 rounded-lg transition text-body-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <ShoppingBag size={16} />
                          Add to Cart
                        </button>
                        <button
                          onClick={() =>
                            toggleWishlist.mutate({
                              productId: item.productId,
                              isInWishlist: true,
                            })
                          }
                          className="p-2.5 border border-text-100 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
