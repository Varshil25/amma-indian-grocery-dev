import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  MapPin,
  CreditCard,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Truck,
  Store,
  Plus,
  Loader2,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { useCart } from "../../hooks/use-cart";
import { useAddresses } from "../../hooks/use-user";
import { useCreateOrder, useCreatePaymentIntent, useConfirmPayment } from "../../hooks/use-orders";
import { useCartUIStore } from "../../stores/cart-ui-store";

const STEPS = [
  { label: "Review", icon: ShoppingBag },
  { label: "Shipping", icon: MapPin },
  { label: "Payment", icon: CreditCard },
  { label: "Confirmation", icon: CheckCircle },
];

export default function Checkout() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [fulfillmentType, setFulfillmentType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses } = useAddresses();
  const createOrder = useCreateOrder();
  const createPaymentIntent = useCreatePaymentIntent();
  const confirmPayment = useConfirmPayment();
  const closeDrawer = useCartUIStore((s) => s.closeDrawer);

  // Auto-select default address
  if (addresses && addresses.length > 0 && !selectedAddressId) {
    const defaultAddr = addresses.find((a: { isDefault: boolean }) => a.isDefault) || addresses[0];
    setSelectedAddressId(defaultAddr.id);
  }

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const discount = cart?.discount || 0;
  const couponCode = cart?.coupon?.code;
  const shippingFee = fulfillmentType === "PICKUP" || subtotal >= 50 ? 0 : 5.99;
  const tax = parseFloat(((subtotal - discount) * 0.08).toFixed(2));
  const total = parseFloat((subtotal - discount + tax + shippingFee).toFixed(2));

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      // Step 1: Create the order
      const orderRes = await createOrder.mutateAsync({
        fulfillmentType,
        addressId: fulfillmentType === "DELIVERY" ? selectedAddressId : undefined,
        notes: notes || undefined,
        couponCode: couponCode || undefined,
      });

      const newOrderId = orderRes.data.id;
      const newOrderNumber = orderRes.data.orderNumber;
      setOrderId(newOrderId);
      setOrderNumber(newOrderNumber);

      // Step 2: Create payment intent
      const paymentRes = await createPaymentIntent.mutateAsync(newOrderId);
      const clientSecret = paymentRes.data.clientSecret;

      if (clientSecret) {
        // In production, you'd use Stripe Elements here.
        // For now, simulate payment confirmation.
        await confirmPayment.mutateAsync(newOrderId);
      }

      closeDrawer();
      setStep(3); // Move to confirmation
    } catch {
      // Error is already handled by the mutation's onError
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartLoading) {
    return (
      <>
        <PageHeader title="Checkout" breadcrumbs={[{ label: "Home", path: "/" }, { label: "Checkout" }]} />
        <div className="container mx-auto px-6 py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      </>
    );
  }

  if (items.length === 0 && step < 3) {
    return (
      <>
        <PageHeader title="Checkout" breadcrumbs={[{ label: "Home", path: "/" }, { label: "Checkout" }]} />
        <div className="container mx-auto px-6 py-20 text-center">
          <ShoppingBag size={48} className="mx-auto text-text-100 mb-4" />
          <p className="text-text-300 text-body-lg mb-4">Your cart is empty</p>
          <Link to="/all-categories" className="btn-primary inline-block">
            Browse Products
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Checkout"
        breadcrumbs={[{ label: "Home", path: "/" }, { label: "Cart", path: "/cart" }, { label: "Checkout" }]}
      />

      <div className="container mx-auto px-6 py-10">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isComplete = i < step;
            return (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                      isComplete
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-green-100 text-green-600 ring-2 ring-green-500"
                        : "bg-text-50 text-text-200"
                    }`}
                  >
                    {isComplete ? <CheckCircle size={20} /> : <Icon size={20} />}
                  </div>
                  <span
                    className={`text-body-xs mt-1 ${
                      isActive || isComplete ? "text-green-600 font-medium" : "text-text-200"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-12 sm:w-20 h-0.5 mx-2 mt-[-14px] ${
                      isComplete ? "bg-green-500" : "bg-text-50"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 0: Cart Review */}
            {step === 0 && (
              <div className="card p-6">
                <h2 className="text-h5 font-semibold text-text-500 mb-4">Review Your Items</h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 py-3 border-b border-text-50 last:border-0">
                      <div className="w-16 h-16 rounded-lg bg-background-secondary flex items-center justify-center overflow-hidden shrink-0">
                        {item.product.images?.[0]?.url ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <ShoppingBag size={20} className="text-text-100" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-text-500 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-body-xs text-text-200">
                          Qty: {item.quantity} × ${parseFloat(item.product.price).toFixed(2)}
                        </p>
                        {!item.inStock && (
                          <p className="text-body-xs text-red-500 font-medium">Out of stock</p>
                        )}
                      </div>
                      <p className="text-body-sm font-semibold text-text-500">
                        ${item.lineTotal.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Shipping / Pickup */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Fulfillment Type */}
                <div className="card p-6">
                  <h2 className="text-h5 font-semibold text-text-500 mb-4">Fulfillment Method</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setFulfillmentType("DELIVERY")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                        fulfillmentType === "DELIVERY"
                          ? "border-green-500 bg-green-50"
                          : "border-text-50 hover:border-text-100"
                      }`}
                    >
                      <Truck size={28} className={fulfillmentType === "DELIVERY" ? "text-green-600" : "text-text-200"} />
                      <span className={`text-body-sm font-medium ${fulfillmentType === "DELIVERY" ? "text-green-600" : "text-text-300"}`}>
                        Delivery
                      </span>
                    </button>
                    <button
                      onClick={() => setFulfillmentType("PICKUP")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                        fulfillmentType === "PICKUP"
                          ? "border-green-500 bg-green-50"
                          : "border-text-50 hover:border-text-100"
                      }`}
                    >
                      <Store size={28} className={fulfillmentType === "PICKUP" ? "text-green-600" : "text-text-200"} />
                      <span className={`text-body-sm font-medium ${fulfillmentType === "PICKUP" ? "text-green-600" : "text-text-300"}`}>
                        Store Pickup
                      </span>
                    </button>
                  </div>
                </div>

                {/* Address Selection (for delivery) */}
                {fulfillmentType === "DELIVERY" && (
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-h5 font-semibold text-text-500">Delivery Address</h2>
                      <Link
                        to="/profile"
                        className="text-body-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                      >
                        <Plus size={14} /> Add New
                      </Link>
                    </div>

                    {!addresses || addresses.length === 0 ? (
                      <p className="text-text-200 text-body-sm">
                        No addresses found.{" "}
                        <Link to="/profile" className="text-green-600 hover:underline">
                          Add an address
                        </Link>{" "}
                        to continue.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {addresses.map((addr: OrderAddress) => (
                          <button
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition ${
                              selectedAddressId === addr.id
                                ? "border-green-500 bg-green-50/50"
                                : "border-text-50 hover:border-text-100"
                            }`}
                          >
                            {addr.label && (
                              <span className="text-body-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full mb-1 inline-block">
                                {addr.label}
                              </span>
                            )}
                            <p className="text-body-sm font-medium text-text-500">
                              {addr.firstName} {addr.lastName}
                            </p>
                            <p className="text-body-xs text-text-200">
                              {addr.addressLine1}
                              {addr.addressLine2 && `, ${addr.addressLine2}`}
                            </p>
                            <p className="text-body-xs text-text-200">
                              {addr.city}, {addr.state} {addr.zipCode}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Order Notes */}
                <div className="card p-6">
                  <h2 className="text-h5 font-semibold text-text-500 mb-3">Order Notes (Optional)</h2>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions for your order..."
                    className="input h-24 resize-none"
                    maxLength={500}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="card p-6">
                <h2 className="text-h5 font-semibold text-text-500 mb-4">Payment</h2>
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <CreditCard size={40} className="mx-auto text-green-600 mb-3" />
                  <p className="text-body-md text-text-500 font-medium mb-1">
                    Secure Payment via Stripe
                  </p>
                  <p className="text-body-sm text-text-200 mb-4">
                    Your payment details are processed securely by Stripe.
                  </p>
                  <p className="text-h4 font-bold text-green-600">
                    ${total.toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full mt-6 bg-green-500 text-white font-semibold py-3.5 rounded-lg hover:bg-green-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Place Order · ${total.toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="card p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-h4 font-semibold text-text-500 mb-2">
                  Order Placed Successfully!
                </h2>
                <p className="text-body-md text-text-200 mb-1">
                  Your order number is:
                </p>
                <p className="text-h5 font-bold text-green-600 mb-6">
                  {orderNumber}
                </p>
                <p className="text-body-sm text-text-200 mb-8">
                  We'll send you updates about your order status. You can track your order
                  in the order history.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to={`/orders/${orderId}`}
                    className="bg-green-500 text-white font-semibold py-3 px-8 rounded-lg hover:bg-green-600 transition"
                  >
                    View Order Details
                  </Link>
                  <Link
                    to="/all-categories"
                    className="border-2 border-green-500 text-green-600 font-semibold py-3 px-8 rounded-lg hover:bg-green-50 transition"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {step < 3 && (
              <div className="flex justify-between mt-6">
                {step > 0 ? (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex items-center gap-2 text-text-300 hover:text-text-500 transition font-medium"
                  >
                    <ChevronLeft size={18} /> Back
                  </button>
                ) : (
                  <Link
                    to="/cart"
                    className="flex items-center gap-2 text-text-300 hover:text-text-500 transition font-medium"
                  >
                    <ChevronLeft size={18} /> Back to Cart
                  </Link>
                )}

                {step < 2 && (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={
                      step === 1 &&
                      fulfillmentType === "DELIVERY" &&
                      (!selectedAddressId || !addresses?.length)
                    }
                    className="flex items-center gap-2 bg-green-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                  >
                    Continue <ChevronRight size={18} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          {step < 3 && (
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h3 className="text-h6 font-semibold text-text-500 mb-4">Order Summary</h3>

                <div className="space-y-3 text-body-sm">
                  <div className="flex justify-between">
                    <span className="text-text-200">
                      Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)
                    </span>
                    <span className="text-text-500 font-medium">${subtotal.toFixed(2)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount {couponCode && `(${couponCode})`}</span>
                      <span className="font-medium">-${discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-text-200">Shipping</span>
                    <span className="text-text-500 font-medium">
                      {shippingFee === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `$${shippingFee.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-text-200">Tax (8%)</span>
                    <span className="text-text-500 font-medium">${tax.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-text-50 pt-3 flex justify-between">
                    <span className="text-text-500 font-semibold">Total</span>
                    <span className="text-h5 font-bold text-green-600">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {subtotal < 50 && fulfillmentType === "DELIVERY" && (
                  <p className="text-body-xs text-text-200 mt-3 bg-yellow-50 p-2 rounded-lg">
                    Add ${(50 - subtotal).toFixed(2)} more for free delivery!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface OrderAddress {
  id: string;
  label?: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  isDefault?: boolean;
}
