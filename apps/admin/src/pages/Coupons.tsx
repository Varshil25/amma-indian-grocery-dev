import { useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, Plus, Trash2, Tag, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAdminCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, type AdminCoupon } from "../hooks/use-admin";
import Modal, { inputClass, labelClass, primaryBtn, secondaryBtn } from "../components/Modal";
import { errorMessage, money, toDateInput, startOfDayISO, endOfDayISO, todayInput, daysFromNowInput } from "../lib/utils";

interface CouponForm {
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  discountValue: string;
  minimumOrder: string;
  maximumDiscount: string;
  usageLimit: string;
  perUserLimit: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const newForm = (): CouponForm => ({
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minimumOrder: "",
  maximumDiscount: "",
  usageLimit: "",
  perUserLimit: "1",
  startDate: todayInput(),
  endDate: daysFromNowInput(30),
  isActive: true,
});

const describe = (c: Pick<AdminCoupon, "discountType" | "discountValue">) =>
  c.discountType === "PERCENTAGE" ? `${c.discountValue}% off` : c.discountType === "FREE_SHIPPING" ? "Free delivery" : `${money(c.discountValue)} off`;

function couponState(c: AdminCoupon) {
  const now = new Date();
  if (!c.isActive) return { label: "Inactive", cls: "bg-gray-100 text-gray-500" };
  if (new Date(c.endDate) < now) return { label: "Expired", cls: "bg-red-50 text-red-600" };
  if (new Date(c.startDate) > now) return { label: "Scheduled", cls: "bg-yellow-50 text-yellow-700" };
  if (c.usageLimit && c.usedCount >= c.usageLimit) return { label: "Used up", cls: "bg-orange-50 text-orange-700" };
  return { label: "Active", cls: "bg-green-50 text-green-700" };
}

const optNum = (v: string) => (v.trim() === "" ? null : Number(v));

export default function Coupons() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminCoupon | "new" | null>(null);
  const [form, setForm] = useState<CouponForm>(newForm);

  const { data, isLoading, isError, error } = useAdminCoupons(page);
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const openCreate = () => {
    setForm(newForm());
    setEditing("new");
  };
  const openEdit = (c: AdminCoupon) => {
    setForm({
      code: c.code,
      description: c.description || "",
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minimumOrder: c.minimumOrder !== null ? String(c.minimumOrder) : "",
      maximumDiscount: c.maximumDiscount !== null ? String(c.maximumDiscount) : "",
      usageLimit: c.usageLimit !== null ? String(c.usageLimit) : "",
      perUserLimit: String(c.perUserLimit),
      startDate: toDateInput(c.startDate),
      endDate: toDateInput(c.endDate),
      isActive: c.isActive,
    });
    setEditing(c);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.endDate < form.startDate) return toast.error("End date must be on or after the start date");
    const value = form.discountType === "FREE_SHIPPING" ? 0 : Number(form.discountValue);
    if (form.discountType !== "FREE_SHIPPING" && !(value > 0)) return toast.error("Enter a discount greater than 0");
    if (form.discountType === "PERCENTAGE" && value > 100) return toast.error("A percentage can't be more than 100");
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discountType: form.discountType,
      discountValue: value,
      minimumOrder: optNum(form.minimumOrder),
      maximumDiscount: form.discountType === "PERCENTAGE" ? optNum(form.maximumDiscount) : null,
      usageLimit: optNum(form.usageLimit),
      perUserLimit: Math.max(1, parseInt(form.perUserLimit) || 1),
      startDate: startOfDayISO(form.startDate),
      endDate: endOfDayISO(form.endDate),
      isActive: form.isActive,
    };
    const opts = {
      onSuccess: () => {
        toast.success(editing === "new" ? "Coupon created" : "Coupon updated");
        setEditing(null);
      },
      onError: (err: Error) => toast.error(errorMessage(err, "Failed to save coupon")),
    };
    if (editing === "new") createCoupon.mutate(payload, opts);
    else if (editing) updateCoupon.mutate({ id: editing.id, ...payload }, opts);
  };

  const handleDelete = (c: AdminCoupon) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    deleteCoupon.mutate(c.id, {
      onSuccess: (r) => toast.success(r.message || "Coupon deleted"),
      onError: (err) => toast.error(errorMessage(err, "Failed to delete coupon")),
    });
  };

  const pending = createCoupon.isPending || updateCoupon.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Coupons</h2>
        <button onClick={openCreate} className={`${primaryBtn} flex items-center gap-1.5`}>
          <Plus size={16} /> New Coupon
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          </div>
        ) : isError ? (
          <p className="px-4 py-12 text-center text-red-600 text-sm">{errorMessage(error, "Couldn't load coupons")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Min Order</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Used</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Valid</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.coupons.map((c) => {
                  const st = couponState(c);
                  return (
                    <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-green-500" />
                          <div>
                            <span className="font-mono font-medium text-gray-900">{c.code}</span>
                            {c.description && <p className="text-xs text-gray-400">{c.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {describe(c)}
                        {c.maximumDiscount ? <span className="text-xs text-gray-400"> (max {money(c.maximumDiscount)})</span> : null}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{c.minimumOrder ? money(c.minimumOrder) : "-"}</td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {c.usedCount}
                        {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(c.startDate).toLocaleDateString()} – {new Date(c.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            updateCoupon.mutate(
                              { id: c.id, isActive: !c.isActive },
                              { onError: (err) => toast.error(errorMessage(err)) }
                            )
                          }
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}
                          title={c.isActive ? "Click to deactivate" : "Click to activate"}
                        >
                          {st.label}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(c)} className="text-blue-500 hover:text-blue-600 p-1" aria-label={`Edit ${c.code}`}>
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(c)} className="text-red-500 hover:text-red-600 p-1" aria-label={`Delete ${c.code}`}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data?.coupons.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      No coupons yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{data.pagination.total} coupons</p>
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

      {editing && (
        <Modal title={editing === "new" ? "New Coupon" : `Edit ${editing.code}`} onClose={() => setEditing(null)} size="md">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className={labelClass} htmlFor="cp-code">
                Code *
              </label>
              <input
                id="cp-code"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. DIWALI10"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="cp-desc">
                Description (shown to shoppers)
              </label>
              <input id="cp-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="cp-type">
                  Type
                </label>
                <select
                  id="cp-type"
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value as CouponForm["discountType"] })}
                  className={inputClass}
                >
                  <option value="PERCENTAGE">Percentage off</option>
                  <option value="FIXED_AMOUNT">Fixed amount off</option>
                  <option value="FREE_SHIPPING">Free delivery</option>
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="cp-value">
                  {form.discountType === "PERCENTAGE" ? "Percent (%)" : "Amount ($)"}
                </label>
                <input
                  id="cp-value"
                  type="number"
                  step="0.01"
                  min="0"
                  required={form.discountType !== "FREE_SHIPPING"}
                  disabled={form.discountType === "FREE_SHIPPING"}
                  value={form.discountType === "FREE_SHIPPING" ? "" : form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="cp-min">
                  Minimum order ($)
                </label>
                <input id="cp-min" type="number" step="0.01" min="0" value={form.minimumOrder} onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })} className={inputClass} />
              </div>
              {form.discountType === "PERCENTAGE" && (
                <div>
                  <label className={labelClass} htmlFor="cp-max">
                    Max discount ($)
                  </label>
                  <input id="cp-max" type="number" step="0.01" min="0" value={form.maximumDiscount} onChange={(e) => setForm({ ...form, maximumDiscount: e.target.value })} className={inputClass} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="cp-limit">
                  Total uses (blank = unlimited)
                </label>
                <input id="cp-limit" type="number" min="1" step="1" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="cp-peruser">
                  Uses per customer
                </label>
                <input id="cp-peruser" type="number" min="1" step="1" value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="cp-start">
                  Starts
                </label>
                <input id="cp-start" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="cp-end">
                  Ends (inclusive)
                </label>
                <input id="cp-end" type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-green-500" />
              Active
            </label>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)} className={`${secondaryBtn} flex-1`}>
                Cancel
              </button>
              <button type="submit" disabled={pending} className={`${primaryBtn} flex-1`}>
                {pending ? "Saving…" : editing === "new" ? "Create Coupon" : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
