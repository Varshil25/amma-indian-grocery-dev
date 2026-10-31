import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Loader2,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { useOrders, type OrderListItem } from "../../hooks/use-orders";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  PENDING: { color: "text-yellow-600 bg-yellow-50", icon: Clock, label: "Pending" },
  CONFIRMED: { color: "text-blue-600 bg-blue-50", icon: CheckCircle, label: "Confirmed" },
  PROCESSING: { color: "text-purple-600 bg-purple-50", icon: Package, label: "Processing" },
  READY_FOR_PICKUP: { color: "text-indigo-600 bg-indigo-50", icon: Package, label: "Ready for Pickup" },
  OUT_FOR_DELIVERY: { color: "text-orange-600 bg-orange-50", icon: Truck, label: "Out for Delivery" },
  DELIVERED: { color: "text-green-600 bg-green-50", icon: CheckCircle, label: "Delivered" },
  CANCELLED: { color: "text-red-600 bg-red-50", icon: XCircle, label: "Cancelled" },
  REFUNDED: { color: "text-gray-600 bg-gray-50", icon: XCircle, label: "Refunded" },
};

function OrderCard({ order }: { order: OrderListItem }) {
  const config = statusConfig[order.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  return (
    <Link
      to={`/orders/${order.id}`}
      className="card p-5 block hover:shadow-card-hover transition group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-body-sm font-semibold text-text-500">
            #{order.orderNumber}
          </p>
          <p className="text-body-xs text-text-200">
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-body-xs font-medium ${config.color}`}>
          <StatusIcon size={14} />
          {config.label}
        </span>
      </div>

      {/* Items preview */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex -space-x-2">
          {order.items.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="w-10 h-10 rounded-lg bg-background-secondary border-2 border-white overflow-hidden flex items-center justify-center"
            >
              {item.productImage ? (
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-full h-full object-contain p-0.5"
                />
              ) : (
                <Package size={14} className="text-text-100" />
              )}
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="w-10 h-10 rounded-lg bg-text-50 border-2 border-white flex items-center justify-center text-body-xs font-medium text-text-300">
              +{order.items.length - 3}
            </div>
          )}
        </div>
        <p className="text-body-xs text-text-200">
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-body-md font-semibold text-text-500">
          ${order.totalAmount.toFixed(2)}
        </p>
        <span className="text-body-xs text-green-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
          View Details <ChevronRight size={14} />
        </span>
      </div>
    </Link>
  );
}

export default function OrderHistory() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useOrders(page, statusFilter || undefined);

  return (
    <>
      <PageHeader
        title="My Orders"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Orders" }]}
      />

      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-body-sm font-medium whitespace-nowrap transition ${
                statusFilter === tab.value
                  ? "bg-green-500 text-white"
                  : "bg-text-50 text-text-300 hover:bg-text-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : !data?.orders.length ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-text-100 mb-4" />
            <p className="text-text-300 text-body-lg mb-2">No orders found</p>
            <p className="text-text-200 text-body-sm mb-6">
              {statusFilter
                ? "Try a different filter or place your first order!"
                : "Start shopping to see your orders here."}
            </p>
            <Link to="/all-categories" className="btn-primary inline-block">
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>

            {data.pagination.totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
