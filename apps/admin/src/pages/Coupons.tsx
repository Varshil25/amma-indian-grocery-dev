import { useState } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminCoupons, useCreateCoupon, useDeleteCoupon } from "../hooks/use-admin";

export default function Coupons() {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minimumOrder: "",
    usageLimit: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    isActive: true,
  });

  const { data, isLoading } = useAdminCoupons(page);
  const createCoupon = useCreateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCoupon.mutate(
      {
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minimumOrder: form.minimumOrder ? parseFloat(form.minimumOrder) : undefined,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
      },
      {
        onSuccess: () => {
          toast.success("Coupon created");
          setShowCreate(false);
          setForm({ code: "", discountType: "PERCENTAGE", discountValue: "", minimumOrder: "", usageLimit: "", startDate: new Date().toISOString().split("T")[0], endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], isActive: true });
        },
        onError: () => toast.error("Failed to create coupon"),
      }
    );
  };

  const handleDelete = (id: string, code: string) => {
    if (!confirm(`Delete coupon ${code}?`)) return;
    deleteCoupon.mutate(id, {
      onSuccess: () => toast.success("Coupon deleted"),
      onError: () => toast.error("Failed to delete coupon"),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Coupons</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          <Plus size={16} /> New Coupon
        </button>
      </div>

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
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Min Order</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Usage</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-green-500" />
                        <span className="font-mono font-medium text-gray-900">{coupon.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}%`
                        : coupon.discountType === "FREE_SHIPPING"
                        ? "Free Shipping"
                        : `$${coupon.discountValue.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {coupon.minimumOrder ? `$${coupon.minimumOrder.toFixed(2)}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        coupon.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(coupon.id, coupon.code)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {data?.coupons.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No coupons yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{data.pagination.total} coupons</p>
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

      {/* Create Modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[80]" onClick={() => setShowCreate(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl p-6 z-[90] shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-4">New Coupon</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Coupon code (e.g. SAVE20)"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed Amount</option>
                  <option value="FREE_SHIPPING">Free Shipping</option>
                </select>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  placeholder="Value"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  value={form.minimumOrder}
                  onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })}
                  placeholder="Min order ($)"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
                <input
                  type="number"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="Usage limit"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={createCoupon.isPending} className="flex-1 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                  {createCoupon.isPending ? "Creating..." : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
