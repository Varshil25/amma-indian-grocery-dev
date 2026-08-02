import { useState } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminInventory, useAdjustInventory } from "../hooks/use-admin";

const FILTERS = [
  { label: "All", value: "" },
  { label: "Low Stock", value: "low-stock" },
  { label: "Out of Stock", value: "out-of-stock" },
];

export default function Inventory() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [adjustModal, setAdjustModal] = useState<{ productId: string; name: string } | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const { data, isLoading } = useAdminInventory(page, filter || undefined);
  const adjust = useAdjustInventory();

  const handleAdjust = (isAdd: boolean) => {
    if (!adjustModal || !adjustQty) return;
    const qty = parseInt(adjustQty);
    if (isNaN(qty) || qty <= 0) return;

    adjust.mutate(
      {
        productId: adjustModal.productId,
        quantity: isAdd ? qty : -qty,
        type: isAdd ? "RESTOCK" : "DAMAGE",
        reason: adjustReason || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Inventory adjusted");
          setAdjustModal(null);
          setAdjustQty("");
          setAdjustReason("");
        },
        onError: () => toast.error("Failed to adjust inventory"),
      }
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>

      {/* Filter Tabs */}
      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              filter === f.value
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reserved</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Available</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((item) => {
                  const isLow = item.stockQuantity > 0 && item.stockQuantity <= item.lowStockThreshold;
                  const isOut = item.stockQuantity <= 0;
                  return (
                    <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                            {item.image ? (
                              <img src={item.image} alt="" className="w-full h-full object-contain p-0.5" />
                            ) : (
                              <Package size={14} className="text-gray-400" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 line-clamp-1">{item.productName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.sku}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{item.stockQuantity}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{item.reservedQuantity}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${isOut ? "text-red-600" : isLow ? "text-orange-600" : "text-green-600"}`}>
                        {item.available}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={11} /> Out
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={11} /> Low
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">OK</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setAdjustModal({ productId: item.productId, name: item.productName })}
                          className="text-xs font-medium text-green-600 hover:underline"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {data?.items.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No inventory items</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {(data.pagination.page - 1) * data.pagination.limit + 1}-
              {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-700 px-2">{page} / {data.pagination.totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))} disabled={page === data.pagination.totalPages} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Modal */}
      {adjustModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[80]" onClick={() => setAdjustModal(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl p-6 z-[90] shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Adjust Stock</h3>
            <p className="text-sm text-gray-500 mb-4">{adjustModal.name}</p>
            <input
              type="number"
              min="1"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              placeholder="Quantity"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAdjust(true)}
                disabled={!adjustQty || adjust.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                <Plus size={14} /> Add Stock
              </button>
              <button
                onClick={() => handleAdjust(false)}
                disabled={!adjustQty || adjust.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                <Minus size={14} /> Remove
              </button>
            </div>
            <button onClick={() => setAdjustModal(null)} className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
