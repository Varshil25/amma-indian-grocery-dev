import { useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, Package, AlertTriangle, Search, History } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminInventory,
  useAdjustInventory,
  useUpdateInventorySettings,
  useInventoryHistory,
  type InventoryItem,
} from "../hooks/use-admin";
import Modal, { inputClass, labelClass, primaryBtn, secondaryBtn } from "../components/Modal";
import { errorMessage } from "../lib/utils";

const FILTERS = [
  { label: "All", value: "" },
  { label: "Low Stock", value: "low-stock" },
  { label: "Out of Stock", value: "out-of-stock" },
];

const ADD_TYPES = [
  ["RESTOCK", "Restock / delivery received"],
  ["RETURN", "Customer return"],
  ["CORRECTION", "Count correction"],
] as const;
const REMOVE_TYPES = [
  ["DAMAGE", "Damaged"],
  ["EXPIRED", "Expired"],
  ["CORRECTION", "Count correction"],
] as const;

export default function Inventory() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [qty, setQty] = useState("");
  const [type, setType] = useState("RESTOCK");
  const [reason, setReason] = useState("");
  const [threshold, setThreshold] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const { data, isLoading, isError, error } = useAdminInventory(page, filter || undefined, search || undefined);
  const adjust = useAdjustInventory();
  const saveSettings = useUpdateInventorySettings();
  const { data: history, isLoading: historyLoading } = useInventoryHistory(showHistory && selected ? selected.productId : null);

  const open = (item: InventoryItem) => {
    setSelected(item);
    setDirection("add");
    setType("RESTOCK");
    setQty("");
    setReason("");
    setThreshold(String(item.lowStockThreshold));
    setShowHistory(false);
  };

  const submitAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const n = parseInt(qty);
    if (!(n > 0)) return toast.error("Enter a quantity of 1 or more");
    adjust.mutate(
      { productId: selected.productId, quantity: direction === "add" ? n : -n, type, reason: reason.trim() || undefined },
      {
        onSuccess: (r) => {
          const res = r as { newQty: number };
          toast.success(`Stock is now ${res.newQty}`);
          setSelected((s) => (s ? { ...s, stockQuantity: res.newQty, available: res.newQty - s.reservedQuantity } : s));
          setQty("");
          setReason("");
        },
        onError: (err) => toast.error(errorMessage(err, "Failed to adjust stock")),
      }
    );
  };

  const submitThreshold = () => {
    if (!selected) return;
    const n = parseInt(threshold);
    if (!(n >= 0)) return toast.error("Enter 0 or more");
    saveSettings.mutate(
      { productId: selected.productId, lowStockThreshold: n },
      {
        onSuccess: () => toast.success("Low-stock alert level saved"),
        onError: (err) => toast.error(errorMessage(err)),
      }
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                filter === f.value ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
          className="relative ml-auto w-full sm:w-72"
        >
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search product or SKU, then Enter" className={`${inputClass} pl-8`} />
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          </div>
        ) : isError ? (
          <p className="px-4 py-12 text-center text-red-600 text-sm">{errorMessage(error, "Couldn't load inventory")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">In stock</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reserved</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Available</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((item) => {
                  const isOut = item.available <= 0;
                  const isLow = !isOut && item.available <= item.lowStockThreshold;
                  return (
                    <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                            {item.image ? <img src={item.image} alt="" className="w-full h-full object-contain p-0.5" /> : <Package size={14} className="text-gray-400" />}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 line-clamp-1">{item.productName}</span>
                            {!item.isActive && <span className="text-[10px] text-gray-400">hidden product</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.sku}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{item.stockQuantity}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{item.reservedQuantity}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${isOut ? "text-red-600" : isLow ? "text-orange-600" : "text-green-600"}`}>{item.available}</td>
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
                        <button onClick={() => open(item)} className="text-xs font-medium text-green-600 hover:underline" aria-label={`Adjust ${item.productName}`}>
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      {filter || search ? "Nothing matches" : "No products yet"}
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
              {(data.pagination.page - 1) * data.pagination.limit + 1}-{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40" aria-label="Previous page">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-700 px-2">
                {page} / {data.pagination.totalPages}
              </span>
              <button onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))} disabled={page === data.pagination.totalPages} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40" aria-label="Next page">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <Modal title={`Stock — ${selected.productName}`} onClose={() => setSelected(null)} size="md">
          <p className="text-sm text-gray-600 mb-4">
            In stock <strong>{selected.stockQuantity}</strong> · reserved by open orders <strong>{selected.reservedQuantity}</strong> · available{" "}
            <strong>{selected.stockQuantity - selected.reservedQuantity}</strong>
          </p>

          <form onSubmit={submitAdjust} className="space-y-3">
            <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-lg p-1">
              {(["add", "remove"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDirection(d);
                    setType(d === "add" ? "RESTOCK" : "DAMAGE");
                  }}
                  className={`py-1.5 text-sm font-medium rounded-md ${direction === d ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
                >
                  {d === "add" ? "Add stock" : "Remove stock"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="inv-qty">
                  Quantity
                </label>
                <input id="inv-qty" type="number" min="1" step="1" required value={qty} onChange={(e) => setQty(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="inv-type">
                  Reason
                </label>
                <select id="inv-type" value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
                  {(direction === "add" ? ADD_TYPES : REMOVE_TYPES).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Note (optional, e.g. supplier invoice #)" className={inputClass} />
            <button type="submit" disabled={adjust.isPending} className={`${primaryBtn} w-full`}>
              {adjust.isPending ? "Saving…" : direction === "add" ? "Add to stock" : "Remove from stock"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <label className={labelClass} htmlFor="inv-threshold">
              Low-stock alert when available is at or below
            </label>
            <div className="flex gap-2">
              <input id="inv-threshold" type="number" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} className={inputClass} />
              <button type="button" onClick={submitThreshold} disabled={saveSettings.isPending} className={secondaryBtn}>
                Save
              </button>
            </div>
          </div>

          <div className="mt-4">
            <button type="button" onClick={() => setShowHistory((v) => !v)} className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1">
              <History size={13} /> {showHistory ? "Hide" : "Show"} stock history
            </button>
            {showHistory && (
              <div className="mt-2 max-h-48 overflow-y-auto text-xs border border-gray-100 rounded-lg divide-y divide-gray-50">
                {historyLoading ? (
                  <div className="flex justify-center py-3">
                    <Loader2 size={14} className="animate-spin text-green-500" />
                  </div>
                ) : history && history.length ? (
                  history.map((h) => (
                    <div key={h.id} className="px-3 py-1.5 flex justify-between gap-2">
                      <span>
                        <span className={h.quantity > 0 ? "text-green-600" : "text-red-600"}>
                          {h.quantity > 0 ? "+" : ""}
                          {h.quantity}
                        </span>{" "}
                        {h.type.toLowerCase()} {h.reason ? `— ${h.reason}` : ""}
                      </span>
                      <span className="text-gray-400 whitespace-nowrap">
                        {h.previousQty}→{h.newQty} · {new Date(h.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="px-3 py-2 text-gray-400">No changes recorded yet</p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
