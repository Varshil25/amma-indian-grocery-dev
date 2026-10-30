import { useState } from "react";
import {
  Loader2,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { useSalesReport, useInventoryReport, useCustomerReport } from "../hooks/use-admin";
import { startOfDayISO, endOfDayISO, toDateInput, money, errorMessage } from "../lib/utils";

const COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#6b7280"];

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return { startDate: toDateInput(start), endDate: toDateInput(end) };
}

export default function Reports() {
  const defaults = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [exporting, setExporting] = useState(false);

  const rangeValid = !!startDate && !!endDate && startDate <= endDate;
  const startISO = rangeValid ? startOfDayISO(startDate) : "";
  const endISO = rangeValid ? endOfDayISO(endDate) : "";
  const { data: sales, isLoading: salesLoading, isError: salesError, error: salesErr } = useSalesReport(startISO, endISO);
  const { data: inventory, isLoading: inventoryLoading } = useInventoryReport();
  const { data: customers } = useCustomerReport(startISO, endISO);

  const handleExport = async () => {
    if (!rangeValid) return toast.error("Pick a valid date range first");
    setExporting(true);
    try {
      const token = localStorage.getItem("admin-token");
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      const res = await fetch(
        `${API_BASE}/admin/reports/export/orders?startDate=${encodeURIComponent(startISO)}&endDate=${encodeURIComponent(endISO)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (err) {
      toast.error(errorMessage(err, "Export failed"));
    }
    setExporting(false);
  };

  const inventoryChartData = inventory
    ? [
        { name: "In Stock", value: inventory.inStock },
        { name: "Low Stock", value: inventory.lowStock },
        { name: "Out of Stock", value: inventory.outOfStock },
      ]
    : [];

  const salesCards = sales
    ? [
        { label: "Total Revenue", value: `$${sales.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "bg-green-50 text-green-600" },
        { label: "Total Orders", value: sales.totalOrders.toString(), icon: ShoppingCart, color: "bg-blue-50 text-blue-600" },
        { label: "Avg Order Value", value: `$${sales.avgOrderValue.toFixed(2)}`, icon: DollarSign, color: "bg-purple-50 text-purple-600" },
        { label: "Total Discount", value: `$${sales.totalDiscount.toFixed(2)}`, icon: DollarSign, color: "bg-orange-50 text-orange-600" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            aria-label="From date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            aria-label="To date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-3 py-2 sm:py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            <Download size={14} />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {!rangeValid && <p className="text-sm text-red-600">The start date must be on or before the end date.</p>}
      {salesError && <p className="text-sm text-red-600">{errorMessage(salesErr, "Couldn't load the sales report")}</p>}

      {/* Sales Cards */}
      {salesLoading && rangeValid ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-green-500" /></div>
      ) : sales && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {salesCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{card.label}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon size={15} />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Breakdown */}
        {sales && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Revenue", amount: sales.totalRevenue },
                    { name: "Tax", amount: sales.totalTax },
                    { name: "Shipping", amount: sales.totalShipping },
                    { name: "Discounts", amount: sales.totalDiscount },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Inventory Status */}
        {inventoryLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          </div>
        ) : inventory && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Inventory Status</h3>
            <div className="flex items-center gap-6">
              <div className="h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={inventoryChartData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                      {inventoryChartData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-green-500" />
                  <span className="text-sm text-gray-600">In Stock: <strong>{inventory.inStock}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-yellow-500" />
                  <span className="text-sm text-gray-600">Low Stock: <strong>{inventory.lowStock}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-sm text-gray-600">Out of Stock: <strong>{inventory.outOfStock}</strong></span>
                </div>
                <div className="pt-1 text-xs text-gray-400">Total: {inventory.totalProducts} products</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {sales && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue by day</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sales.daily.map((d) => ({ ...d, label: new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} />
                <Tooltip formatter={(value: number, name: string) => (name === "revenue" ? [`$${value.toFixed(2)}`, "Revenue"] : [value, "Orders"])} />
                <Bar dataKey="revenue" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sales && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Top products</h3>
            {sales.topProducts.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase">
                    <th className="text-left pb-2">Product</th>
                    <th className="text-right pb-2">Sold</th>
                    <th className="text-right pb-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.topProducts.map((p) => (
                    <tr key={p.productId} className="border-t border-gray-50">
                      <td className="py-1.5 text-gray-800">{p.name}</td>
                      <td className="py-1.5 text-right text-gray-600">{p.quantity}</td>
                      <td className="py-1.5 text-right font-medium">{money(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-400">No sales in this period</p>
            )}
          </div>
        )}
        {customers && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Customers</h3>
            <p className="text-sm text-gray-500 mb-3">
              {customers.newCustomers} new in this period · {customers.totalCustomers} total
            </p>
            {customers.topCustomers.length ? (
              <ul className="text-sm divide-y divide-gray-50">
                {customers.topCustomers.map((c) => (
                  <li key={c.id} className="py-1.5 flex justify-between">
                    <span className="text-gray-800">
                      {c.name} <span className="text-gray-400 text-xs">{c.email}</span>
                    </span>
                    <span className="text-gray-600">{c.orderCount} orders</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No orders yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
