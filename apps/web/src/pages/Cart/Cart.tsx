import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, Tag } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
  useApplyCoupon,
} from "../../hooks/use-cart";

export default function Cart() {
  const { data: cart, isLoading } = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const clearMutation = useClearCart();
  const couponMutation = useApplyCoupon();
  const [couponCode, setCouponCode] = useState("");

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      couponMutation.mutate(couponCode.trim());
    }
  };

  return (
    <>
      <PageHeader
        title="Shopping Cart"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Cart" }]}
      />

      <section className="section-padding">
        <div className="container mx-auto px-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-background-secondary rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !cart?.items.length ? (
            <div className="text-center py-20">
              <ShoppingBag size={56} className="mx-auto text-text-100 mb-4" />
              <h2 className="text-h4 font-semibold text-text-500 mb-2">
                Your cart is empty
              </h2>
              <p className="text-text-300 text-body-md mb-8">
                Looks like you haven't added anything yet.
              </p>
              <Link
                to="/all-categories"
                className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg transition"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Cart Items */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-h5 font-semibold text-text-500">
                    {cart.itemCount} items in your cart
                  </h2>
                  <button
                    onClick={() => clearMutation.mutate()}
                    className="text-body-sm text-red-500 hover:text-red-600 font-medium transition"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-4">
                  {cart.items.map((item) => {
                    const image = item.product.images?.[0]?.url;
                    const price = parseFloat(item.product.price);

                    return (
                      <div
                        key={item.id}
                        className={`card p-4 flex gap-4 ${
                          !item.inStock ? "border-red-200 bg-red-50/30" : ""
                        }`}
                      >
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="w-24 h-24 shrink-0 rounded-lg bg-background-secondary flex items-center justify-center"
                        >
                          {image ? (
                            <img src={image} alt={item.product.name} className="w-full h-full object-contain p-2" />
                          ) : (
                            <ShoppingBag size={28} className="text-text-100" />
                          )}
                        </Link>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <Link
                                to={`/product/${item.product.slug}`}
                                className="text-body-md font-medium text-text-500 hover:text-green-600 transition"
                              >
                                {item.product.name}
                              </Link>
                              <p className="text-body-sm text-text-200 mt-0.5">
                                ${price.toFixed(2)} each
                              </p>
                              {!item.inStock && (
                                <p className="text-body-xs text-red-500 font-medium mt-1">Out of stock</p>
                              )}
                            </div>
                            <button
                              onClick={() => removeMutation.mutate(item.productId)}
                              aria-label={`Remove ${item.product.name} from cart`}
                              className="p-2 text-text-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1 border border-text-100 rounded-lg">
                              <button
                                onClick={() =>
                                  item.quantity > 1
                                    ? updateMutation.mutate({ productId: item.productId, quantity: item.quantity - 1 })
                                    : removeMutation.mutate(item.productId)
                                }
                                aria-label={`Decrease quantity of ${item.product.name}`}
                                className="w-9 h-9 flex items-center justify-center text-text-300 hover:text-green-600 transition"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="w-10 text-center font-semibold text-text-500">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateMutation.mutate({ productId: item.productId, quantity: item.quantity + 1 })
                                }
                                disabled={item.quantity >= item.availableQty}
                                aria-label={`Increase quantity of ${item.product.name}`}
                                className="w-9 h-9 flex items-center justify-center text-text-300 hover:text-green-600 transition disabled:opacity-30"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <span className="text-body-lg font-semibold text-text-500">
                              ${item.lineTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:w-96 shrink-0">
                <div className="card p-6 sticky top-24">
                  <h3 className="text-h5 font-semibold text-text-500 mb-6">
                    Order Summary
                  </h3>

                  {/* Coupon */}
                  <div className="mb-6">
                    <label className="input-label flex items-center gap-2">
                      <Tag size={14} />
                      Coupon Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input flex-1"
                        placeholder="Enter code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponMutation.isPending || !couponCode.trim()}
                        className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        Apply
                      </button>
                    </div>
                    {cart.coupon && (
                      <p className="text-body-sm text-green-600 mt-2">
                        {cart.coupon.code} applied! {cart.coupon.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 border-t border-text-50 pt-4">
                    <div className="flex justify-between text-body-md">
                      <span className="text-text-300">Subtotal</span>
                      <span className="text-text-500 font-medium">${cart.subtotal.toFixed(2)}</span>
                    </div>
                    {cart.discount && (
                      <div className="flex justify-between text-body-md text-green-600">
                        <span>Discount</span>
                        <span>-${cart.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-body-md">
                      <span className="text-text-300">Shipping</span>
                      <span className="text-text-200 text-body-sm">Calculated at checkout</span>
                    </div>
                    <div className="border-t border-text-50 pt-3 flex justify-between">
                      <span className="text-body-lg font-semibold text-text-500">Total</span>
                      <span className="text-body-lg font-bold text-green-600">
                        ${(cart.total ?? cart.subtotal).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/checkout"
                    className="block w-full text-center bg-green-500 text-white font-semibold py-3.5 rounded-lg hover:bg-green-600 transition mt-6"
                  >
                    Proceed to Checkout
                  </Link>

                  <Link
                    to="/all-categories"
                    className="block w-full text-center text-green-600 font-medium py-2 mt-3 hover:text-green-700 transition text-body-sm"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
