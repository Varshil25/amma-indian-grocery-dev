import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
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
  Banknote,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { useCart } from "../../hooks/use-cart";
import { useAddresses, useAddAddress } from "../../hooks/use-user";
import { useCreateOrder, useCreatePaymentIntent, useConfirmPayment, useOrderPreview } from "../../hooks/use-orders";
import { useStoreSettings } from "../../hooks/use-content";
import { useCartUIStore } from "../../stores/cart-ui-store";
import { PLACEHOLDER_IMAGE } from "../../lib/product-helpers";
import { ApiError } from "../../lib/api-client";

const STEPS = [
  { label: "Review", icon: ShoppingBag },
  { label: "Delivery", icon: MapPin },
  { label: "Payment", icon: CreditCard },
  { label: "Done", icon: CheckCircle },
];

type Fulfillment = "DELIVERY" | "PICKUP";
type PayMethod = "PAY_ON_DELIVERY" | "CARD";

interface OrderAddress {
  id: string;
  label?: string;
  firstName?: string;
  lastName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}

let stripePromise: Promise<Stripe | null> | null = null;
let stripeKey = "";
function getStripe(key: string) {
  if (!stripePromise || stripeKey !== key) {
    stripeKey = key;
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

export default function Checkout() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [fulfillmentType, setFulfillmentType] = useState<Fulfillment>("DELIVERY");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null);
  const [placed, setPlaced] = useState<{ id: string; orderNumber: string; paid: boolean; method: PayMethod } | null>(null);
  const [cardOrder, setCardOrder] = useState<{ id: string; orderNumber: string; clientSecret: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);

  const couponCode = useCartUIStore((s) => s.couponCode);
  const setCouponCode = useCartUIStore((s) => s.setCouponCode);
  const closeDrawer = useCartUIStore((s) => s.closeDrawer);

  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses } = useAddresses();
  const { data: settings } = useStoreSettings();
  const { data: preview, isFetching: previewLoading, isError: previewError } = useOrderPreview(
    { fulfillmentType, couponCode },
    !placed && !cardOrder
  );
  const createOrder = useCreateOrder();
  const createPaymentIntent = useCreatePaymentIntent();

  const items = cart?.items || [];
  const deliveryEnabled = preview?.deliveryEnabled ?? true;
  const pickupEnabled = preview?.pickupEnabled ?? true;

  // Default to whichever fulfilment the store offers
  useEffect(() => {
    if (!preview) return;
    if (fulfillmentType === "DELIVERY" && !preview.deliveryEnabled && preview.pickupEnabled) setFulfillmentType("PICKUP");
    if (fulfillmentType === "PICKUP" && !preview.pickupEnabled && preview.deliveryEnabled) setFulfillmentType("DELIVERY");
  }, [preview, fulfillmentType]);

  // Default payment method: pay on delivery if offered, else card
  useEffect(() => {
    if (!preview || payMethod) return;
    if (preview.payOnDeliveryEnabled) setPayMethod("PAY_ON_DELIVERY");
    else if (preview.onlinePaymentsEnabled) setPayMethod("CARD");
  }, [preview, payMethod]);

  // Auto-select default address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const def = (addresses as OrderAddress[]).find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  // An invalid coupon (expired, min order no longer met…) is dropped with a message
  useEffect(() => {
    if (preview?.couponError && couponCode) {
      toast.error(`${couponCode}: ${preview.couponError}`);
      setCouponCode(null);
    }
  }, [preview?.couponError, couponCode, setCouponCode]);

  const unavailable = items.filter((i) => !i.inStock || i.availableQty < i.quantity);
  const canContinueFromReview = items.length > 0 && unavailable.length === 0;
  const canContinueFromDelivery = fulfillmentType === "PICKUP" || (!!selectedAddressId && !!addresses?.length);
  const noPaymentMethod = preview && !preview.payOnDeliveryEnabled && !preview.onlinePaymentsEnabled;

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponCode(code);
    setCouponInput("");
  };

  const handlePlaceOrder = async () => {
    if (!payMethod) return;
    setIsProcessing(true);
    try {
      const orderRes = await createOrder.mutateAsync({
        fulfillmentType,
        addressId: fulfillmentType === "DELIVERY" ? selectedAddressId : undefined,
        notes: notes.trim() || undefined,
        couponCode: couponCode || undefined,
        paymentMethod: payMethod,
      });
      const { id, orderNumber } = orderRes.data;

      if (payMethod === "PAY_ON_DELIVERY") {
        setCouponCode(null);
        closeDrawer();
        setPlaced({ id, orderNumber, paid: false, method: "PAY_ON_DELIVERY" });
        setStep(3);
        return;
      }

      // Card: open Stripe's card form for this order
      const intent = await createPaymentIntent.mutateAsync(id);
      setCardOrder({ id, orderNumber, clientSecret: intent.data.clientSecret });
    } catch {
      // the mutation hooks already show the error
    } finally {
      setIsProcessing(false);
    }
  };

  const onCardPaid = (paid: boolean) => {
    if (!cardOrder) return;
    setCouponCode(null);
    closeDrawer();
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    setPlaced({ id: cardOrder.id, orderNumber: cardOrder.orderNumber, paid, method: "CARD" });
    setCardOrder(null);
    setStep(3);
  };

  if (cartLoading) {
    return (
      <>
        <PageHeader title="Checkout" breadcrumbs={[{ label: "Home", href: "/" }, { label: "Checkout" }]} />
        <div className="container mx-auto px-4 sm:px-6 py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      </>
    );
  }

  if (items.length === 0 && step < 3 && !cardOrder) {
    return (
      <>
        <PageHeader title="Checkout" breadcrumbs={[{ label: "Home", href: "/" }, { label: "Checkout" }]} />
        <div className="container mx-auto px-4 sm:px-6 py-20 text-center">
          <ShoppingBag size={48} className="mx-auto text-text-100 mb-4" />
          <p className="text-text-300 text-body-lg mb-4">Your cart is empty</p>
          <Link to="/all-categories" className="btn-primary inline-block">
            Browse Products
          </Link>
        </div>
      </>
    );
  }

  const storeAddress = settings?.store_address;

  return (
    <>
      <PageHeader title="Checkout" breadcrumbs={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]} />

      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Progress */}
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
                      isComplete ? "bg-green-500 text-white" : isActive ? "bg-green-100 text-green-600 ring-2 ring-green-500" : "bg-text-50 text-text-200"
                    }`}
                  >
                    {isComplete ? <CheckCircle size={20} /> : <Icon size={20} />}
                  </div>
                  <span className={`text-body-xs mt-1 ${isActive || isComplete ? "text-green-600 font-medium" : "text-text-200"}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-5 sm:w-20 h-0.5 mx-1 sm:mx-2 mt-[-14px] ${isComplete ? "bg-green-500" : "bg-text-50"}`} />}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            {/* Step 0: Review */}
            {step === 0 && (
              <div className="card p-4 sm:p-6">
                <h2 className="text-h6 font-semibold text-text-500 mb-4">Review Your Items</h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 py-3 border-b border-text-50 last:border-0">
                      <div className="w-16 h-16 rounded-lg bg-background-secondary flex items-center justify-center overflow-hidden shrink-0">
                        <img src={item.product.images?.[0]?.url || PLACEHOLDER_IMAGE} alt={item.product.name} className="w-full h-full object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-text-500 line-clamp-2">{item.product.name}</p>
                        <p className="text-body-xs text-text-200">
                          Qty: {item.quantity} × ${parseFloat(item.product.price).toFixed(2)}
                        </p>
                        {!item.inStock ? (
                          <p className="text-body-xs text-red-500 font-medium">No longer available — remove it in your cart</p>
                        ) : item.availableQty < item.quantity ? (
                          <p className="text-body-xs text-red-500 font-medium">Only {item.availableQty} left — reduce the quantity in your cart</p>
                        ) : null}
                      </div>
                      <p className="text-body-sm font-semibold text-text-500">${item.lineTotal.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Delivery / pickup */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="card p-4 sm:p-6">
                  <h2 className="text-h6 font-semibold text-text-500 mb-4">How would you like to get your order?</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {(
                      [
                        ["DELIVERY", "Delivery", Truck, deliveryEnabled],
                        ["PICKUP", "Store Pickup", Store, pickupEnabled],
                      ] as const
                    ).map(([value, label, Icon, enabled]) => (
                      <button
                        key={value}
                        type="button"
                        disabled={!enabled}
                        onClick={() => setFulfillmentType(value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                          fulfillmentType === value ? "border-green-500 bg-green-50" : "border-text-50 hover:border-text-100"
                        }`}
                      >
                        <Icon size={28} className={fulfillmentType === value ? "text-green-600" : "text-text-200"} />
                        <span className={`text-body-sm font-medium ${fulfillmentType === value ? "text-green-600" : "text-text-300"}`}>{label}</span>
                        {!enabled && <span className="text-body-xs text-text-200">Not available</span>}
                      </button>
                    ))}
                  </div>
                  {fulfillmentType === "PICKUP" && storeAddress && (
                    <p className="text-body-sm text-text-300 mt-4 flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-green-600" /> Pick up at {storeAddress}
                    </p>
                  )}
                </div>

                {fulfillmentType === "DELIVERY" && (
                  <div className="card p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-h6 font-semibold text-text-500">Delivery Address</h2>
                      {!showAddressForm && (
                        <button type="button" onClick={() => setShowAddressForm(true)} className="text-body-sm text-green-600 hover:text-green-700 flex items-center gap-1">
                          <Plus size={14} /> Add New
                        </button>
                      )}
                    </div>

                    {showAddressForm && (
                      <InlineAddressForm
                        onDone={(id) => {
                          setShowAddressForm(false);
                          if (id) setSelectedAddressId(id);
                        }}
                      />
                    )}

                    {!showAddressForm && (!addresses || addresses.length === 0) ? (
                      <p className="text-text-200 text-body-sm">
                        No saved addresses yet.{" "}
                        <button type="button" onClick={() => setShowAddressForm(true)} className="text-green-600 hover:underline">
                          Add an address
                        </button>{" "}
                        to continue.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {(addresses as OrderAddress[] | undefined)?.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition ${
                              selectedAddressId === addr.id ? "border-green-500 bg-green-50/50" : "border-text-50 hover:border-text-100"
                            }`}
                          >
                            {addr.label && (
                              <span className="text-body-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full mb-1 inline-block">{addr.label}</span>
                            )}
                            {(addr.firstName || addr.lastName) && (
                              <p className="text-body-sm font-medium text-text-500">
                                {addr.firstName} {addr.lastName}
                              </p>
                            )}
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

                <div className="card p-4 sm:p-6">
                  <h2 className="text-h6 font-semibold text-text-500 mb-3">Order Notes (Optional)</h2>
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
              <div className="card p-4 sm:p-6">
                <h2 className="text-h6 font-semibold text-text-500 mb-4">Payment</h2>

                {cardOrder ? (
                  <CardPayment order={cardOrder} publishableKey={settings?.stripe_publishable_key || ""} onDone={onCardPaid} />
                ) : (
                  <>
                    {noPaymentMethod ? (
                      <p className="text-body-sm text-red-600 bg-red-50 rounded-lg p-4">
                        The store isn't accepting online orders right now. Please contact the store.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {preview?.payOnDeliveryEnabled && (
                          <PayOption
                            selected={payMethod === "PAY_ON_DELIVERY"}
                            onSelect={() => setPayMethod("PAY_ON_DELIVERY")}
                            icon={Banknote}
                            title={fulfillmentType === "PICKUP" ? "Pay at pickup" : "Pay on delivery"}
                            subtitle={`Pay when you ${fulfillmentType === "PICKUP" ? "collect your order in store" : "receive your order"}.`}
                          />
                        )}
                        {preview?.onlinePaymentsEnabled && (
                          <PayOption
                            selected={payMethod === "CARD"}
                            onSelect={() => setPayMethod("CARD")}
                            icon={CreditCard}
                            title="Pay now by card"
                            subtitle="Secure card payment processed by Stripe."
                          />
                        )}
                      </div>
                    )}

                    <button
                      onClick={handlePlaceOrder}
                      disabled={isProcessing || !payMethod || !preview || previewLoading || !!noPaymentMethod}
                      className="w-full mt-6 bg-green-500 text-white font-semibold py-3.5 rounded-lg hover:bg-green-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={20} className="animate-spin" /> Placing order...
                        </>
                      ) : payMethod === "CARD" ? (
                        <>Continue to card payment · ${preview?.totalAmount.toFixed(2) ?? "…"}</>
                      ) : (
                        <>Place Order · ${preview?.totalAmount.toFixed(2) ?? "…"}</>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && placed && (
              <div className="card p-5 sm:p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-h4 font-semibold text-text-500 mb-2">
                  {placed.method === "CARD" && !placed.paid ? "Order placed — payment processing" : "Order Placed Successfully!"}
                </h2>
                <p className="text-body-md text-text-200 mb-1">Your order number is:</p>
                <p className="text-h5 font-bold text-green-600 mb-6">{placed.orderNumber}</p>
                <p className="text-body-sm text-text-200 mb-8">
                  {placed.method === "PAY_ON_DELIVERY"
                    ? `You'll pay when you ${fulfillmentType === "PICKUP" ? "pick up" : "receive"} your order. We'll email you when the store confirms it.`
                    : placed.paid
                      ? "Your payment was received. We'll email you as your order progresses."
                      : "We're waiting for confirmation from the card processor — your order page will update shortly."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to={`/orders/${placed.id}`} className="bg-green-500 text-white font-semibold py-3 px-8 rounded-lg hover:bg-green-600 transition">
                    View Order Details
                  </Link>
                  <Link to="/all-categories" className="border-2 border-green-500 text-green-600 font-semibold py-3 px-8 rounded-lg hover:bg-green-50 transition">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            )}

            {/* Navigation */}
            {step < 3 && !cardOrder && (
              <div className="flex justify-between mt-6">
                {step > 0 ? (
                  <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-text-300 hover:text-text-500 transition font-medium">
                    <ChevronLeft size={18} /> Back
                  </button>
                ) : (
                  <Link to="/cart" className="flex items-center gap-2 text-text-300 hover:text-text-500 transition font-medium">
                    <ChevronLeft size={18} /> Back to Cart
                  </Link>
                )}

                {step < 2 && (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={(step === 0 && !canContinueFromReview) || (step === 1 && !canContinueFromDelivery)}
                    className="flex items-center gap-2 bg-green-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                  >
                    Continue <ChevronRight size={18} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          {step < 3 && (
            <div className="lg:col-span-1">
              <div className="card p-4 sm:p-6 sticky top-24">
                <h3 className="text-h6 font-semibold text-text-500 mb-4">Order Summary</h3>

                {previewError ? (
                  <p className="text-body-sm text-red-600">Couldn't calculate totals. Please refresh the page.</p>
                ) : !preview ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-green-500" />
                  </div>
                ) : (
                  <div className={`space-y-3 text-body-sm ${previewLoading ? "opacity-60" : ""}`}>
                    <div className="flex justify-between">
                      <span className="text-text-200">
                        Subtotal ({preview.itemCount} {preview.itemCount === 1 ? "item" : "items"})
                      </span>
                      <span className="text-text-500 font-medium">${preview.subtotal.toFixed(2)}</span>
                    </div>
                    {preview.coupon && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">
                          <Tag size={13} /> {preview.coupon.code}
                          {!cardOrder && (
                            <button onClick={() => setCouponCode(null)} aria-label="Remove coupon" className="text-text-200 hover:text-red-500">
                              <X size={13} />
                            </button>
                          )}
                        </span>
                        <span className="font-medium">
                          {preview.discountAmount > 0 ? `-$${preview.discountAmount.toFixed(2)}` : preview.coupon.discountType === "FREE_SHIPPING" ? "Free delivery" : ""}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-text-200">{fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"}</span>
                      <span className="text-text-500 font-medium">
                        {preview.shippingAmount === 0 ? <span className="text-green-600">Free</span> : `$${preview.shippingAmount.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-200">Tax ({+(preview.taxRate * 100).toFixed(3)}%)</span>
                      <span className="text-text-500 font-medium">${preview.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-text-50 pt-3 flex justify-between">
                      <span className="text-text-500 font-semibold">Total</span>
                      <span className="text-h6 font-bold text-green-600">${preview.totalAmount.toFixed(2)}</span>
                    </div>

                    {fulfillmentType === "DELIVERY" && preview.shippingAmount > 0 && preview.subtotal < preview.freeDeliveryThreshold && (
                      <p className="text-body-xs text-text-200 bg-yellow-50 p-2 rounded-lg">
                        Add ${(preview.freeDeliveryThreshold - preview.subtotal).toFixed(2)} more for free delivery!
                      </p>
                    )}

                    {!preview.coupon && !cardOrder && (
                      <div className="flex gap-2 pt-2">
                        <input
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                          placeholder="Coupon code"
                          aria-label="Coupon code"
                          className="input flex-1 text-body-sm"
                        />
                        <button type="button" onClick={applyCoupon} disabled={!couponInput.trim()} className="px-3 rounded-lg border border-green-500 text-green-600 text-body-sm font-medium disabled:opacity-50">
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PayOption({
  selected,
  onSelect,
  icon: Icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition ${selected ? "border-green-500 bg-green-50" : "border-text-50 hover:border-text-100"}`}
    >
      <Icon size={26} className={selected ? "text-green-600" : "text-text-200"} />
      <div>
        <p className={`text-body-md font-medium ${selected ? "text-green-700" : "text-text-500"}`}>{title}</p>
        <p className="text-body-xs text-text-200">{subtitle}</p>
      </div>
    </button>
  );
}

/** Stripe card form for an order that has a PaymentIntent */
function CardPayment({
  order,
  publishableKey,
  onDone,
}: {
  order: { id: string; orderNumber: string; clientSecret: string };
  publishableKey: string;
  onDone: (paid: boolean) => void;
}) {
  const stripe = useMemo(() => (publishableKey ? getStripe(publishableKey) : null), [publishableKey]);
  if (!stripe) {
    return <p className="text-body-sm text-red-600">Card payments aren't set up correctly. Please choose another payment method or contact the store.</p>;
  }
  return (
    <Elements stripe={stripe} options={{ clientSecret: order.clientSecret, appearance: { theme: "stripe" } }}>
      <CardPaymentForm orderId={order.id} orderNumber={order.orderNumber} onDone={onDone} />
    </Elements>
  );
}

function CardPaymentForm({ orderId, orderNumber, onDone }: { orderId: string; orderNumber: string; onDone: (paid: boolean) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const confirmPayment = useConfirmPayment();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: `${window.location.origin}${import.meta.env.BASE_URL}orders/${orderId}` },
    });
    if (result.error) {
      setError(result.error.message || "Your card couldn't be charged");
      setSubmitting(false);
      return;
    }
    try {
      const r = await confirmPayment.mutateAsync(orderId);
      onDone(r.data.status === "confirmed" || r.data.status === "already_confirmed");
    } catch (err) {
      // The webhook will still confirm the order; don't make the shopper pay twice
      if (err instanceof ApiError) toast.info("Payment received — your order will update shortly.");
      onDone(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-body-sm text-text-300">
        Order <strong>{orderNumber}</strong> is reserved. Enter your card details to pay.
      </p>
      <PaymentElement />
      {error && <p className="text-body-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full bg-green-500 text-white font-semibold py-3.5 rounded-lg hover:bg-green-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 size={20} className="animate-spin" /> Paying...
          </>
        ) : (
          "Pay now"
        )}
      </button>
      <p className="text-body-xs text-text-200">If you leave without paying, the order is cancelled automatically after an hour.</p>
    </form>
  );
}

const US_STATE = /^[A-Za-z]{2}$/;

function InlineAddressForm({ onDone }: { onDone: (newId?: string) => void }) {
  const addAddress = useAddAddress();
  const [form, setForm] = useState({ label: "Home", addressLine1: "", addressLine2: "", city: "", state: "", zipCode: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!US_STATE.test(form.state.trim())) return toast.error("Use the 2-letter state code, e.g. PA");
    addAddress.mutate(
      { ...form, state: form.state.trim().toUpperCase(), addressLine2: form.addressLine2 || undefined, isDefault: false } as never,
      {
        onSuccess: (res) => onDone((res as { data?: { id?: string } })?.data?.id),
      }
    );
  };

  return (
    <form onSubmit={submit} className="space-y-3 mb-5 p-4 rounded-xl bg-background-secondary">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input required placeholder="Street address" value={form.addressLine1} onChange={set("addressLine1")} className="input sm:col-span-2" aria-label="Street address" />
        <input placeholder="Apt, suite (optional)" value={form.addressLine2} onChange={set("addressLine2")} className="input sm:col-span-2" aria-label="Apartment or suite" />
        <input required placeholder="City" value={form.city} onChange={set("city")} className="input" aria-label="City" />
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="State (PA)" maxLength={2} value={form.state} onChange={set("state")} className="input uppercase" aria-label="State" />
          <input required placeholder="ZIP" inputMode="numeric" value={form.zipCode} onChange={set("zipCode")} className="input" aria-label="ZIP code" />
        </div>
        <input placeholder="Label (Home, Work…)" value={form.label} onChange={set("label")} className="input" aria-label="Address label" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={addAddress.isPending} className="bg-green-500 text-white text-body-sm font-medium py-2 px-4 rounded-lg disabled:opacity-60">
          {addAddress.isPending ? "Saving..." : "Save address"}
        </button>
        <button type="button" onClick={() => onDone()} className="text-body-sm text-text-300 px-3">
          Cancel
        </button>
      </div>
    </form>
  );
}
