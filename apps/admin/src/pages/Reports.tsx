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
import { useSalesReport, useInventoryReport } from "../hooks/use-admin";
import { apiClient } from "../lib/api-client";

const COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#6b7280"];

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export default function Reports() {
  const defaults = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [exporting, setExporting] = useState(false);

  const { data: sales, isLoading: salesLoading } = useSalesReport(startDate, endDate);
  const { data: inventory, isLoading: inventoryLoading } = useInventoryReport();

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("admin-token");
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      const res = await fetch(
        `${API_BASE}/admin/reports/export/orders?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
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
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            <Download size={14} />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Sales Cards */}
      {salesLoading ? (
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
    </div>
  );
}
