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
        <div className="container mx-auto px-4 sm:px-6">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-background-secondary rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !items?.length ? (
            <div className="text-center py-20">
              <Heart size={56} className="mx-auto text-text-100 mb-4" />
              <h2 className="text-h5 font-semibold text-text-500 mb-2">
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
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
                      className="card p-3 sm:p-4 flex flex-col"
                    >
                      {/* Image, with the remove button where product cards have the heart */}
                      <div className="relative mb-3">
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="w-full aspect-square bg-background-secondary rounded-lg flex items-center justify-center"
                        >
                          {image ? (
                            <img
                              src={image}
                              alt={item.product.name}
                              className="w-full h-full object-contain p-2 sm:p-3"
                            />
                          ) : (
                            <ShoppingBag size={32} className="text-text-100" />
                          )}
                        </Link>
                        <button
                          onClick={() =>
                            toggleWishlist.mutate({
                              productId: item.productId,
                              isInWishlist: true,
                            })
                          }
                          aria-label={`Remove ${item.product.name} from wishlist`}
                          className="absolute top-1.5 right-1.5 w-9 h-9 flex items-center justify-center bg-white/90 border border-text-50 rounded-full text-red-400 hover:bg-red-50 hover:text-red-500 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <p className="text-body-xs sm:text-body-sm text-green-600 mb-1 line-clamp-1">
                          {item.product.category?.name}
                        </p>
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="text-body-sm sm:text-body-md font-medium text-text-500 hover:text-green-600 transition line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <div className="flex flex-wrap items-baseline gap-x-2 mt-2">
                          <span className="text-body-md sm:text-title font-semibold text-text-500">
                            ${price.toFixed(2)}
                          </span>
                          {oldPrice && (
                            <span className="text-body-xs sm:text-body-sm text-text-200 line-through">
                              ${oldPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {!inStock && (
                          <p className="text-body-xs text-red-500 font-medium mt-1">Out of stock</p>
                        )}
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => handleAddToCart(item.productId)}
                        disabled={!inStock || addToCart.isPending}
                        className="mt-3 sm:mt-4 w-full h-10 bg-green-500 hover:bg-green-600 text-white font-medium px-2 rounded-lg transition text-body-sm whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {/* the icon is dropped on the narrowest phones so the label always fits */}
                        <ShoppingBag size={16} className="shrink-0 hidden min-[400px]:block" aria-hidden="true" />
                        Add to Cart
                      </button>
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
