import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  Store,
  MapPin,
  Phone,
  Mail,
  Banknote,
  CreditCard,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminOrders, useAdminOrder, useUpdateOrderStatus, useMarkOrderPaid } from "../hooks/use-admin";
import Modal, { inputClass, primaryBtn, secondaryBtn } from "../components/Modal";
import { money, errorMessage, formatPhone } from "../lib/utils";

const STATUS_TABS = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  READY_FOR_PICKUP: "bg-indigo-100 text-indigo-700",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-600",
};

const statusIcons: Record<string, React.ElementType> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle,
  PROCESSING: Package,
  READY_FOR_PICKUP: Store,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
};

/** Button label for moving an order to a status */
function actionLabel(status: string, fulfillment: string) {
  switch (status) {
    case "CONFIRMED":
      return "Confirm order";
    case "PROCESSING":
      return "Start preparing";
    case "READY_FOR_PICKUP":
      return "Ready for pickup";
    case "OUT_FOR_DELIVERY":
      return "Out for delivery";
    case "DELIVERED":
      return fulfillment === "PICKUP" ? "Mark picked up" : "Mark delivered";
    default:
      return status.replace(/_/g, " ").toLowerCase();
  }
}

const paymentLabel = (method?: string) =>
  method === "CASH_ON_DELIVERY" ? "Pay on delivery/pickup" : method === "STRIPE" ? "Card (Stripe)" : method || "-";

export const fmtStatus = (s: string) => s.replace(/_/g, " ");

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const openId = params.get("order");

  const { data, isLoading, isError, error } = useAdminOrders(page, statusFilter === "ALL" ? undefined : statusFilter, search || undefined);

  const openOrder = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("order", id);
    else next.delete("order");
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Orders</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput.trim());
          setPage(1);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number, customer name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
        <button type="submit" className={primaryBtn}>
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setPage(1);
            }}
            className={secondaryBtn}
          >
            Clear
          </button>
        )}
      </form>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setStatusFilter(tab);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition ${
              statusFilter === tab ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {fmtStatus(tab)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          </div>
        ) : isError ? (
          <p className="px-4 py-12 text-center text-red-600 text-sm">{errorMessage(error, "Couldn't load orders")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-cards w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {data?.orders.map((order) => {
                  const Icon = statusIcons[order.status] || Clock;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => openOrder(order.id)}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900 whitespace-nowrap">#{order.orderNumber}</span>
                        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                      </td>
                      <td data-label="Customer" className="px-4 py-3">
                        <span className="text-gray-700">{order.customerName}</span>
                        <p className="text-xs text-gray-400">{order.customerEmail}</p>
                      </td>
                      <td data-label="Type" className="px-4 py-3">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{order.fulfillmentType}</span>
                      </td>
                      <td data-label="Items" className="px-4 py-3 text-center text-gray-600">{order.itemCount}</td>
                      <td data-label="Status" className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[order.status] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <Icon size={12} />
                          {fmtStatus(order.status)}
                        </span>
                      </td>
                      <td data-label="Payment" className="px-4 py-3">
                        {order.payment ? (
                          <span
                            className={`text-xs font-medium ${
                              order.payment.status === "COMPLETED"
                                ? "text-green-600"
                                : order.status === "CANCELLED"
                                  ? "text-gray-500"
                                  : order.payment.status === "FAILED"
                                    ? "text-red-600"
                                    : "text-yellow-600"
                            }`}
                          >
                            {order.payment.status === "COMPLETED"
                              ? "Paid"
                              : order.status === "CANCELLED"
                                ? "Not charged" // cancelled before payment — nothing failed
                                : order.payment.status === "FAILED"
                                  ? "Failed"
                                  : "Unpaid"}
                            <span className="block text-xs text-gray-400 font-normal">{paymentLabel(order.payment.method)}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-yellow-600">Awaiting card payment</span>
                        )}
                      </td>
                      <td data-label="Total" className="px-4 py-3 text-right font-medium text-gray-900">{money(order.totalAmount)}</td>
                    </tr>
                  );
                })}
                {data?.orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(data.pagination.page - 1) * data.pagination.limit + 1}-
              {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40" aria-label="Previous page">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-700 px-2">
                {page} / {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {openId && <OrderDetailModal orderId={openId} onClose={() => openOrder(null)} />}
    </div>
  );
}

function OrderDetailModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { data: order, isLoading, isError, error } = useAdminOrder(orderId);
  const updateStatus = useUpdateOrderStatus();
  const markPaid = useMarkOrderPaid();
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const change = (status: string, note?: string) =>
    updateStatus.mutate(
      { orderId, status, note },
      {
        onSuccess: () => {
          toast.success(`Order ${fmtStatus(status).toLowerCase()}`);
          setCancelling(false);
          setCancelReason("");
        },
        onError: (err) => toast.error(errorMessage(err, "Failed to update order")),
      }
    );

  const printInvoice = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/admin/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin-token")}` },
      });
      if (!res.ok) throw new Error("Couldn't load the invoice");
      const html = await res.text();
      const w = window.open("", "_blank");
      if (!w) throw new Error("Allow pop-ups to print the invoice");
      w.document.write(html);
      w.document.close();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Modal title={order ? `Order #${order.orderNumber}` : "Order"} onClose={onClose} size="xl">
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        </div>
      ) : isError || !order ? (
        <p className="text-sm text-red-600 py-8 text-center">{errorMessage(error, "Couldn't load this order")}</p>
      ) : (
        <div className="space-y-5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || "bg-gray-100"}`}>
              {fmtStatus(order.status)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              {order.fulfillmentType === "PICKUP" ? <Store size={12} /> : <Truck size={12} />}
              {order.fulfillmentType === "PICKUP" ? "Store pickup" : "Delivery"}
            </span>
            <span className="text-xs text-gray-400">Placed {new Date(order.createdAt).toLocaleString()}</span>
            <button onClick={printInvoice} className="ml-auto text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1">
              <Printer size={13} /> Invoice
            </button>
          </div>

          {/* Actions */}
          {(order.nextStatuses.length > 0 || (order.payment?.method === "CASH_ON_DELIVERY" && order.payment.status !== "COMPLETED" && order.status !== "CANCELLED")) && (
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                {order.nextStatuses
                  .filter((s) => s !== "CANCELLED")
                  .map((s) => (
                    <button key={s} onClick={() => change(s)} disabled={updateStatus.isPending} className={primaryBtn}>
                      {actionLabel(s, order.fulfillmentType)}
                    </button>
                  ))}
                {order.payment?.method === "CASH_ON_DELIVERY" && order.payment.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                  <button
                    onClick={() =>
                      markPaid.mutate(orderId, {
                        onSuccess: () => toast.success("Payment recorded"),
                        onError: (err) => toast.error(errorMessage(err)),
                      })
                    }
                    disabled={markPaid.isPending}
                    className={`${secondaryBtn} flex items-center gap-1.5`}
                  >
                    <Banknote size={14} /> Mark paid
                  </button>
                )}
                {order.nextStatuses.includes("CANCELLED") && !cancelling && (
                  <button onClick={() => setCancelling(true)} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                    Cancel order
                  </button>
                )}
              </div>
              {order.status === "PENDING" && order.payment?.method !== "CASH_ON_DELIVERY" && order.payment?.status !== "COMPLETED" && (
                <p className="text-xs text-yellow-700">Waiting for the customer's card payment — it confirms automatically once paid.</p>
              )}
              {cancelling && (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason (sent to the customer)"
                    className={inputClass}
                  />
                  <button
                    onClick={() => change("CANCELLED", cancelReason.trim() || undefined)}
                    disabled={updateStatus.isPending}
                    className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 shrink-0"
                  >
                    Confirm cancel
                  </button>
                  <button onClick={() => setCancelling(false)} className={secondaryBtn}>
                    Keep
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Customer</h4>
              <p className="font-medium text-gray-900">{order.customer.name}</p>
              <p className="text-gray-600 flex items-center gap-1">
                <Mail size={12} /> {order.customer.email}
              </p>
              {order.customer.phone && (
                <p className="text-gray-600 flex items-center gap-1">
                  <Phone size={12} /> {formatPhone(order.customer.phone)}
                </p>
              )}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                {order.fulfillmentType === "PICKUP" ? "Pickup" : "Deliver to"}
              </h4>
              {order.address ? (
                <div className="text-gray-700">
                  <p className="flex items-start gap-1">
                    <MapPin size={12} className="mt-1 shrink-0" />
                    <span>
                      {order.address.firstName} {order.address.lastName}
                      <br />
                      {order.address.addressLine1}
                      {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""}
                      <br />
                      {order.address.city}, {order.address.state} {order.address.zipCode}
                    </span>
                  </p>
                  {order.address.phone && <p className="text-gray-600 ml-4">{formatPhone(order.address.phone)}</p>}
                </div>
              ) : (
                <p className="text-gray-600">Customer collects in store</p>
              )}
            </div>
          </div>

          {order.notes && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
              <span className="text-xs font-semibold text-yellow-800">Customer note: </span>
              <span className="text-yellow-900">{order.notes}</span>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Items</h4>
            <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
              {order.items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="w-9 h-9 bg-gray-50 rounded flex items-center justify-center overflow-hidden shrink-0">
                    {i.productImage ? <img src={i.productImage} alt="" className="w-full h-full object-contain" /> : <Package size={14} className="text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 truncate">{i.productName}</p>
                    <p className="text-xs text-gray-400 font-mono">{i.productSku}</p>
                  </div>
                  <span className="text-gray-600">
                    {i.quantity} × {money(i.unitPrice)}
                  </span>
                  <span className="w-20 text-right font-medium">{money(i.totalPrice)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 ml-auto max-w-xs space-y-1">
              <Line label="Subtotal" value={money(order.subtotal)} />
              {order.discountAmount > 0 && <Line label={`Discount${order.coupon ? ` (${order.coupon.code})` : ""}`} value={`-${money(order.discountAmount)}`} />}
              {order.rewardDiscount > 0 && <Line label={`Points (${order.rewardPointsUsed})`} value={`-${money(order.rewardDiscount)}`} />}
              <Line label="Delivery" value={order.shippingAmount > 0 ? money(order.shippingAmount) : "Free"} />
              <Line label="Tax" value={money(order.taxAmount)} />
              <Line label="Total" value={money(order.totalAmount)} bold />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Payment</h4>
              <p className="flex items-center gap-1 text-gray-700">
                {order.payment?.method === "STRIPE" ? <CreditCard size={13} /> : <Banknote size={13} />}
                {order.payment ? paymentLabel(order.payment.method) : "Card — not paid yet"}
              </p>
              {order.payment && (
                <p className={order.payment.status === "COMPLETED" ? "text-green-600" : "text-yellow-600"}>
                  {order.payment.status === "COMPLETED"
                    ? `Paid${order.payment.paidAt ? ` ${new Date(order.payment.paidAt).toLocaleString()}` : ""}`
                    : order.payment.status === "FAILED"
                      ? "Not collected"
                      : "Not paid yet"}
                </p>
              )}
              {order.refunds.map((r) => (
                <p key={r.id} className="text-xs text-red-600">
                  Refund {money(r.amount)} — {r.status.toLowerCase()}
                  {r.status === "PENDING" ? " (complete it in Stripe / at the till)" : ""}
                </p>
              ))}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">History</h4>
              <ol className="space-y-1">
                {order.statusHistory.map((h, idx) => (
                  <li key={idx} className="text-xs">
                    <span className="font-medium text-gray-700">{fmtStatus(h.status)}</span>
                    <span className="text-gray-400"> · {new Date(h.createdAt).toLocaleString()}</span>
                    {h.note && <p className="text-gray-500">{h.note}</p>}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-gray-900 border-t border-gray-100 pt-1" : "text-gray-600"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
