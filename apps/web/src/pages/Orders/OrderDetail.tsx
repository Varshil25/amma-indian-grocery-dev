import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Package,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { useOrderDetail, useCancelOrder } from "../../hooks/use-orders";

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  PENDING: { color: "text-yellow-600", bgColor: "bg-yellow-500", icon: Clock, label: "Pending" },
  CONFIRMED: { color: "text-blue-600", bgColor: "bg-blue-500", icon: CheckCircle, label: "Confirmed" },
  PROCESSING: { color: "text-purple-600", bgColor: "bg-purple-500", icon: Package, label: "Processing" },
  READY_FOR_PICKUP: { color: "text-indigo-600", bgColor: "bg-indigo-500", icon: Package, label: "Ready for Pickup" },
  OUT_FOR_DELIVERY: { color: "text-orange-600", bgColor: "bg-orange-500", icon: Truck, label: "Out for Delivery" },
  DELIVERED: { color: "text-green-600", bgColor: "bg-green-500", icon: CheckCircle, label: "Delivered" },
  CANCELLED: { color: "text-red-600", bgColor: "bg-red-500", icon: XCircle, label: "Cancelled" },
  REFUNDED: { color: "text-gray-600", bgColor: "bg-gray-500", icon: XCircle, label: "Refunded" },
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrderDetail(id || "");
  const cancelOrder = useCancelOrder();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const handleCancel = () => {
    if (!id || !cancelReason.trim()) return;
    cancelOrder.mutate(
      { orderId: id, reason: cancelReason },
      {
        onSuccess: () => {
          setShowCancelModal(false);
          navigate("/orders");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Order Details" breadcrumbs={[{ label: "Home", path: "/" }, { label: "Orders", path: "/orders" }, { label: "Details" }]} />
        <div className="container mx-auto px-6 py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <PageHeader title="Order Not Found" breadcrumbs={[{ label: "Home", path: "/" }, { label: "Orders", path: "/orders" }, { label: "Not Found" }]} />
        <div className="container mx-auto px-6 py-20 text-center">
          <Package size={48} className="mx-auto text-text-100 mb-4" />
          <p className="text-text-300 text-body-lg mb-4">Order not found</p>
          <Link to="/orders" className="btn-primary inline-block">
            View All Orders
          </Link>
        </div>
      </>
    );
  }

  const config = statusConfig[order.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;
  const canCancel = ["PENDING", "CONFIRMED"].includes(order.status);

  return (
    <>
      <PageHeader
        title={`Order #${order.orderNumber}`}
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Orders", path: "/orders" },
          { label: `#${order.orderNumber}` },
        ]}
      />

      <div className="container mx-auto px-6 py-10">
        {/* Back link */}
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-body-sm text-text-300 hover:text-green-600 transition mb-6"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Header */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color} bg-opacity-10`}>
                    <StatusIcon size={22} />
                  </div>
                  <div>
                    <h2 className={`text-h5 font-semibold ${config.color}`}>
                      {config.label}
                    </h2>
                    <p className="text-body-xs text-text-200">
                      Placed on{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {canCancel && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="text-body-sm text-red-500 hover:text-red-600 font-medium transition"
                  >
                    Cancel Order
                  </button>
                )}
              </div>

              {order.estimatedDelivery && !order.deliveredAt && order.status !== "CANCELLED" && (
                <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2 text-body-sm text-blue-700">
                  <Truck size={16} />
                  Estimated delivery:{" "}
                  {new Date(order.estimatedDelivery).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              )}

              {order.cancelReason && (
                <div className="bg-red-50 rounded-lg p-3 flex items-start gap-2 text-body-sm text-red-700 mt-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>Cancelled: {order.cancelReason}</span>
                </div>
              )}
            </div>

            {/* Status Timeline */}
            {order.statusHistory.length > 0 && (
              <div className="card p-6">
                <h3 className="text-h6 font-semibold text-text-500 mb-4">Order Timeline</h3>
                <div className="space-y-0">
                  {order.statusHistory.map((entry, idx) => {
                    const entryConfig = statusConfig[entry.status] || statusConfig.PENDING;
                    const isLast = idx === order.statusHistory.length - 1;
                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              isLast ? entryConfig.bgColor : "bg-text-100"
                            }`}
                          />
                          {!isLast && <div className="w-0.5 h-8 bg-text-50" />}
                        </div>
                        <div className="pb-6">
                          <p className={`text-body-sm font-medium ${isLast ? entryConfig.color : "text-text-300"}`}>
                            {entryConfig.label}
                          </p>
                          {entry.note && (
                            <p className="text-body-xs text-text-200">{entry.note}</p>
                          )}
                          <p className="text-body-xs text-text-100">
                            {new Date(entry.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="card p-6">
              <h3 className="text-h6 font-semibold text-text-500 mb-4">
                Items ({order.items.length})
              </h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-3 border-b border-text-50 last:border-0">
                    <Link
                      to={item.productSlug ? `/product/${item.productSlug}` : "#"}
                      className="w-16 h-16 rounded-lg bg-background-secondary overflow-hidden flex items-center justify-center shrink-0"
                    >
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Package size={18} className="text-text-100" />
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={item.productSlug ? `/product/${item.productSlug}` : "#"}
                        className="text-body-sm font-medium text-text-500 hover:text-green-600 transition line-clamp-1"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-body-xs text-text-200">
                        Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-body-sm font-semibold text-text-500">
                      ${item.totalPrice.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="card p-6">
              <h3 className="text-h6 font-semibold text-text-500 mb-4">Payment Summary</h3>
              <div className="space-y-2 text-body-sm">
                <div className="flex justify-between">
                  <span className="text-text-200">Subtotal</span>
                  <span className="text-text-500">${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Discount {order.coupon && `(${order.coupon.code})`}
                    </span>
                    <span>-${order.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {order.rewardPointsUsed > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Rewards ({order.rewardPointsUsed} pts)</span>
                    <span>-${order.rewardDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-200">Shipping</span>
                  <span className="text-text-500">
                    {order.shippingAmount === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `$${order.shippingAmount.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-200">Tax</span>
                  <span className="text-text-500">${order.taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-text-50 pt-2 flex justify-between">
                  <span className="font-semibold text-text-500">Total</span>
                  <span className="text-h5 font-bold text-green-600">
                    ${order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {order.payment && (
                <div className="mt-4 pt-3 border-t border-text-50">
                  <div className="flex items-center gap-2 text-body-xs text-text-200">
                    <CreditCard size={14} />
                    {order.payment.method} · {order.payment.status}
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Address */}
            {order.address && (
              <div className="card p-6">
                <h3 className="text-h6 font-semibold text-text-500 mb-3 flex items-center gap-2">
                  <MapPin size={16} /> Delivery Address
                </h3>
                <div className="text-body-sm text-text-300">
                  <p className="font-medium text-text-500">
                    {order.address.firstName} {order.address.lastName}
                  </p>
                  <p>{order.address.addressLine1}</p>
                  {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                  <p>
                    {order.address.city}, {order.address.state} {order.address.zipCode}
                  </p>
                  {order.address.phone && <p className="mt-1">{order.address.phone}</p>}
                </div>
              </div>
            )}

            {/* Order Notes */}
            {order.notes && (
              <div className="card p-6">
                <h3 className="text-h6 font-semibold text-text-500 mb-2">Notes</h3>
                <p className="text-body-sm text-text-300">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[80]"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl p-6 z-[90] shadow-2xl">
            <h3 className="text-h5 font-semibold text-text-500 mb-2">
              Cancel Order
            </h3>
            <p className="text-body-sm text-text-200 mb-4">
              Are you sure you want to cancel order #{order.orderNumber}? This action cannot be undone.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
              className="input h-24 resize-none mb-4"
              maxLength={500}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-text-100 text-text-300 font-medium hover:bg-text-50 transition"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim() || cancelOrder.isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition disabled:opacity-50"
              >
                {cancelOrder.isPending ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
