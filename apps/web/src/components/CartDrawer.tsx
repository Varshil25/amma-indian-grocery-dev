import { Link } from "react-router-dom";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartUIStore } from "../stores/cart-ui-store";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "../hooks/use-cart";
import { useAuthStore } from "../stores/auth-store";

export default function CartDrawer() {
  const { isDrawerOpen, closeDrawer } = useCartUIStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: cart, isLoading } = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();

  if (!isDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[60] transition-opacity"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-text-50">
          <div className="flex items-center gap-3">
            <ShoppingBag size={22} className="text-green-600" />
            <h2 className="text-h6 font-semibold text-text-500">
              Your Cart
              {cart?.itemCount ? (
                <span className="text-body-sm text-text-200 font-normal ml-2">
                  ({cart.itemCount} items)
                </span>
              ) : null}
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 rounded-lg hover:bg-background-secondary transition"
          >
            <X size={20} className="text-text-300" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={48} className="text-text-100 mb-4" />
              <p className="text-text-300 text-body-lg mb-4">
                Please login to view your cart
              </p>
              <Link
                to="/login"
                onClick={closeDrawer}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-6 rounded-lg transition"
              >
                Login
              </Link>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-20 h-20 bg-background-secondary rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-background-secondary rounded w-3/4" />
                    <div className="h-4 bg-background-secondary rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !cart?.items.length ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={48} className="text-text-100 mb-4" />
              <p className="text-text-300 text-body-lg mb-2">Your cart is empty</p>
              <p className="text-text-200 text-body-sm mb-6">
                Add some products to get started!
              </p>
              <Link
                to="/all-categories"
                onClick={closeDrawer}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-6 rounded-lg transition"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => {
                const image = item.product.images?.[0]?.url;
                const price = parseFloat(item.product.price);

                return (
                  <div
                    key={item.id}
                    className={`flex gap-4 p-3 rounded-xl border ${
                      !item.inStock ? "border-red-200 bg-red-50/50" : "border-text-50"
                    }`}
                  >
                    {/* Image */}
                    <Link
                      to={`/product/${item.product.slug}`}
                      onClick={closeDrawer}
                      className="w-20 h-20 shrink-0 rounded-lg bg-background-secondary flex items-center justify-center overflow-hidden"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={item.product.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <ShoppingBag size={24} className="text-text-100" />
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${item.product.slug}`}
                        onClick={closeDrawer}
                        className="text-body-sm font-medium text-text-500 hover:text-green-600 transition line-clamp-2"
                      >
                        {item.product.name}
                      </Link>

                      {!item.inStock && (
                        <p className="text-body-xs text-red-500 font-medium mt-0.5">
                          Out of stock
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity */}
                        <div className="flex items-center gap-1 border border-text-100 rounded-lg">
                          <button
                            onClick={() =>
                              item.quantity > 1
                                ? updateMutation.mutate({
                                    productId: item.productId,
                                    quantity: item.quantity - 1,
                                  })
                                : removeMutation.mutate(item.productId)
                            }
                            className="w-8 h-8 flex items-center justify-center text-text-300 hover:text-green-600 transition"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-body-sm font-semibold text-text-500">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateMutation.mutate({
                                productId: item.productId,
                                quantity: item.quantity + 1,
                              })
                            }
                            disabled={item.quantity >= item.availableQty}
                            className="w-8 h-8 flex items-center justify-center text-text-300 hover:text-green-600 transition disabled:opacity-30"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Price + Remove */}
                        <div className="flex items-center gap-3">
                          <span className="text-body-sm font-semibold text-text-500">
                            ${item.lineTotal.toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeMutation.mutate(item.productId)}
                            className="p-1 text-text-200 hover:text-red-500 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {isAuthenticated && cart && cart.items.length > 0 && (
          <div className="border-t border-text-50 px-6 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-body-md text-text-300">Subtotal</span>
              <span className="text-body-lg font-semibold text-text-500">
                ${cart.subtotal.toFixed(2)}
              </span>
            </div>
            {cart.discount && (
              <div className="flex items-center justify-between text-green-600">
                <span className="text-body-sm">
                  Discount ({cart.coupon?.code})
                </span>
                <span className="text-body-sm font-medium">
                  -${cart.discount.toFixed(2)}
                </span>
              </div>
            )}
            <Link
              to="/cart"
              onClick={closeDrawer}
              className="block w-full text-center bg-white border-2 border-green-500 text-green-600 font-semibold py-3 rounded-lg hover:bg-green-50 transition"
            >
              View Cart
            </Link>
            <Link
              to="/checkout"
              onClick={closeDrawer}
              className="block w-full text-center bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-600 transition"
            >
              Checkout · ${(cart.total ?? cart.subtotal).toFixed(2)}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
