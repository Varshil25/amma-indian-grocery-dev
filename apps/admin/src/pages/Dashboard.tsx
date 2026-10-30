import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDashboardStats } from "../hooks/use-admin";
import { errorMessage } from "../lib/utils";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-600",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useDashboardStats();

  if (isError) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-600 text-sm mb-3">{errorMessage(error, "Couldn't load the dashboard")}</p>
        <button onClick={() => refetch()} className="text-sm font-medium text-green-600 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  const { stats, recentOrders, daily } = data;

  const statCards = [
    {
      label: "Monthly Revenue",
      value: `$${stats.monthRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      change: stats.revenueChange,
      icon: DollarSign,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      change: stats.orderChange,
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      icon: Users,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Active Products",
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  const chartData = daily.map((d) => ({
    name: new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    orders: d.orders,
    revenue: d.revenue,
  }));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{card.label}</span>
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}
                >
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              {card.change !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  {card.change >= 0 ? (
                    <TrendingUp size={14} className="text-green-500" />
                  ) : (
                    <TrendingDown size={14} className="text-red-500" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      card.change >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {card.change >= 0 ? "+" : ""}
                    {card.change}% vs last month
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/orders" className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-green-300">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
            <Clock size={18} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Open Orders</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.pendingOrders}
            </p>
          </div>
        </Link>
        <Link to="/inventory" className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-green-300">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
            <AlertTriangle size={18} className="text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Low / Out of Stock</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.lowStockProducts}
            </p>
          </div>
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <ShoppingCart size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Today's Orders</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.todayOrders}
            </p>
          </div>
        </div>
        <Link to="/settings?tab=messages" className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-green-300">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <MessageSquare size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Unread Messages</p>
            <p className="text-xl font-bold text-gray-900">{stats.unreadMessages}</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Orders — last 14 days
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "revenue" ? [`$${value.toFixed(2)}`, "Revenue"] : [value, "Orders"]
                  }
                />
                <Bar dataKey="orders" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Recent Orders
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    Order
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/orders?order=${order.id}`)}
                  >
                    <td className="px-5 py-3">
                      <span className="font-medium text-gray-900">
                        #{order.orderNumber}
                      </span>
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-gray-700">
                        {order.customerName}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[order.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-8 text-center text-gray-400"
                    >
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
