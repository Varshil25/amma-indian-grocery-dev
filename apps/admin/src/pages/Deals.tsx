import { useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Flame, X } from "lucide-react";
import { toast } from "sonner";
import { useAdminDeals, useCreateDeal, useUpdateDeal, useDeleteDeal, useAdminProducts, type AdminDeal } from "../hooks/use-admin";
import Modal, { inputClass, labelClass, primaryBtn, secondaryBtn } from "../components/Modal";
import ImageInput from "../components/ImageInput";
import { slugify, money, errorMessage, toDateInput, startOfDayISO, endOfDayISO, todayInput, daysFromNowInput } from "../lib/utils";

interface DealForm {
  name: string;
  slug: string;
  description: string;
  bannerImage: string[];
  discountType: string;
  discountValue: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  productIds: string[];
}

const newForm = (): DealForm => ({
  name: "",
  slug: "",
  description: "",
  bannerImage: [],
  discountType: "PERCENTAGE",
  discountValue: "",
  startDate: todayInput(),
  endDate: daysFromNowInput(14),
  isActive: true,
  productIds: [],
});

function dealState(d: AdminDeal) {
  const now = new Date();
  if (new Date(d.endDate) < now) return { label: "Ended", cls: "bg-red-50 text-red-600" };
  if (!d.isActive) return { label: "Paused", cls: "bg-gray-100 text-gray-500" };
  if (new Date(d.startDate) > now) return { label: "Scheduled", cls: "bg-yellow-50 text-yellow-700" };
  return { label: "Live", cls: "bg-green-50 text-green-700" };
}

export default function Deals() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminDeal | "new" | null>(null);
  const [form, setForm] = useState<DealForm>(newForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  // Names of picked products, so chips show even when they aren't in the current search results
  const [pickedNames, setPickedNames] = useState<Record<string, string>>({});

  const { data, isLoading, isError, error } = useAdminDeals(page);
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();
  const { data: productsData, isFetching: productsLoading } = useAdminProducts(1, productSearch.trim() || undefined, "active", 50);

  const openCreate = () => {
    setForm(newForm());
    setSlugTouched(false);
    setPickedNames({});
    setProductSearch("");
    setEditing("new");
  };

  const openEdit = (d: AdminDeal) => {
    setForm({
      name: d.name,
      slug: d.slug,
      description: d.description || "",
      bannerImage: d.bannerImage ? [d.bannerImage] : [],
      discountType: d.discountType === "FIXED" ? "FIXED_AMOUNT" : d.discountType,
      discountValue: String(d.discountValue),
      startDate: toDateInput(d.startDate),
      endDate: toDateInput(d.endDate),
      isActive: d.isActive,
      productIds: d.productIds || [],
    });
    setSlugTouched(true);
    setPickedNames({});
    setProductSearch("");
    setEditing(d);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.endDate < form.startDate) return toast.error("End date must be on or after the start date");
    const value = form.discountType === "FREE_SHIPPING" ? 0 : Number(form.discountValue);
    if (form.discountType !== "FREE_SHIPPING" && !(value > 0)) return toast.error("Enter a discount greater than 0");
    if (form.discountType === "PERCENTAGE" && value > 100) return toast.error("A percentage can't be more than 100");
    if (form.productIds.length === 0) return toast.error("Pick at least one product for this deal");

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || null,
      bannerImage: form.bannerImage[0] || null,
      discountType: form.discountType,
      discountValue: value,
      startDate: startOfDayISO(form.startDate),
      endDate: endOfDayISO(form.endDate),
      isActive: form.isActive,
      productIds: form.productIds,
    };
    const opts = {
      onSuccess: () => {
        toast.success(editing === "new" ? "Deal created" : "Deal updated");
        setEditing(null);
      },
      onError: (err: Error) => toast.error(errorMessage(err, "Failed to save deal")),
    };
    if (editing === "new") createDeal.mutate(payload, opts);
    else if (editing) updateDeal.mutate({ id: editing.id, ...payload }, opts);
  };

  const handleDelete = (d: AdminDeal) => {
    if (!confirm(`Delete deal "${d.name}"? Product prices go back to normal.`)) return;
    deleteDeal.mutate(d.id, {
      onSuccess: () => toast.success("Deal deleted"),
      onError: (err) => toast.error(errorMessage(err, "Failed to delete deal")),
    });
  };

  const toggleProduct = (id: string, name: string) => {
    setPickedNames((m) => ({ ...m, [id]: name }));
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id) ? f.productIds.filter((x) => x !== id) : [...f.productIds, id],
    }));
  };

  const nameFor = (id: string) => pickedNames[id] || productsData?.products.find((p) => p.id === id)?.name || "Product";
  const isPending = createDeal.isPending || updateDeal.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Hot Deals</h2>
        <button onClick={openCreate} className={`${primaryBtn} flex items-center gap-1.5`}>
          <Plus size={16} /> New Deal
        </button>
      </div>
      <p className="text-sm text-gray-500">
        While a deal is live, its products sell at the deal price (regular price shown struck through) and appear on the Hot
        Deals page. Prices go back automatically when the deal ends, is paused or deleted.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          </div>
        ) : isError ? (
          <p className="px-4 py-12 text-center text-red-600 text-sm">{errorMessage(error, "Couldn't load deals")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Deal</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Products</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Runs</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.deals.map((deal) => {
                  const st = dealState(deal);
                  return (
                    <tr key={deal.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Flame size={14} className="text-orange-500" />
                          <div>
                            <p className="font-medium text-gray-900">{deal.name}</p>
                            <p className="text-xs text-gray-400">{deal.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {deal.discountType === "PERCENTAGE"
                          ? `${deal.discountValue}% off`
                          : deal.discountType === "FREE_SHIPPING"
                            ? "Free delivery"
                            : `${money(deal.discountValue)} off`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {deal.productCount} items
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(deal.startDate).toLocaleDateString()} – {new Date(deal.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(deal)} className="text-blue-500 hover:text-blue-600 p-1" aria-label={`Edit ${deal.name}`}>
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(deal)} className="text-red-500 hover:text-red-600 p-1" aria-label={`Delete ${deal.name}`}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data?.deals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      No deals yet. Create your first hot deal!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{data.pagination.total} deals</p>
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
        <Modal title={editing === "new" ? "New Deal" : "Edit Deal"} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className={labelClass} htmlFor="d-name">
                Deal name *
              </label>
              <input
                id="d-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
                placeholder="e.g. Diwali Sweets Sale"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="d-slug">
                URL slug
              </label>
              <input
                id="d-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm({ ...form, slug: e.target.value });
                }}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="d-desc">
                Description
              </label>
              <textarea id="d-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="d-type">
                  Discount type
                </label>
                <select id="d-type" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className={inputClass}>
                  <option value="PERCENTAGE">Percentage off</option>
                  <option value="FIXED_AMOUNT">Fixed amount off each item</option>
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="d-value">
                  {form.discountType === "PERCENTAGE" ? "Percent (%)" : "Amount ($)"}
                </label>
                <input id="d-value" required type="number" step="0.01" min="0" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} placeholder="e.g. 20" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="d-start">
                  Starts
                </label>
                <input id="d-start" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="d-end">
                  Ends (inclusive)
                </label>
                <input id="d-end" type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} />
              </div>
            </div>
            <ImageInput value={form.bannerImage} onChange={(bannerImage) => setForm({ ...form, bannerImage })} max={1} label="Banner image (optional, shown on the home page)" />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-green-500" />
              Active (untick to pause)
            </label>

            <div>
              <span className={labelClass}>Products in this deal * ({form.productIds.length} selected)</span>
              {form.productIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {form.productIds.map((id) => (
                    <span key={id} className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                      {nameFor(id)}
                      <button type="button" onClick={() => toggleProduct(id, nameFor(id))} aria-label="Remove">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products to add..." className={`${inputClass} mb-2`} />
              <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg">
                {productsLoading && !productsData ? (
                  <div className="flex justify-center py-4">
                    <Loader2 size={16} className="animate-spin text-green-500" />
                  </div>
                ) : (
                  productsData?.products.map((product) => (
                    <label key={product.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                      <input
                        type="checkbox"
                        checked={form.productIds.includes(product.id)}
                        onChange={() => toggleProduct(product.id, product.name)}
                        className="w-4 h-4 rounded border-gray-300 text-green-500"
                      />
                      {product.image && <img src={product.image} alt="" className="w-8 h-8 rounded object-contain bg-gray-50" />}
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-400">{money(product.regularPrice)} regular</p>
                      </div>
                    </label>
                  ))
                )}
                {productsData?.products.length === 0 && <p className="text-xs text-gray-400 text-center py-3">No products found</p>}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)} className={`${secondaryBtn} flex-1`}>
                Cancel
              </button>
              <button type="submit" disabled={isPending} className={`${primaryBtn} flex-1`}>
                {isPending ? "Saving…" : editing === "new" ? "Create Deal" : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
