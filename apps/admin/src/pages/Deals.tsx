import { useState } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Flame,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminDeals,
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal,
  useAdminProducts,
} from "../hooks/use-admin";

interface DealForm {
  name: string;
  slug: string;
  description: string;
  discountType: string;
  discountValue: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  productIds: string[];
}

const emptyForm: DealForm = {
  name: "",
  slug: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  isActive: true,
  productIds: [],
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function Deals() {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DealForm>(emptyForm);
  const [productSearch, setProductSearch] = useState("");

  const { data, isLoading } = useAdminDeals(page);
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();

  // Product picker data
  const { data: productsData } = useAdminProducts(1, productSearch || undefined);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (deal: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    discountType: string;
    discountValue: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    productIds: string[];
  }) => {
    setEditingId(deal.id);
    setForm({
      name: deal.name,
      slug: deal.slug,
      description: deal.description || "",
      discountType: deal.discountType,
      discountValue: String(deal.discountValue),
      startDate: deal.startDate.split("T")[0],
      endDate: deal.endDate.split("T")[0],
      isActive: deal.isActive,
      productIds: deal.productIds || [],
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: form.isActive,
      productIds: editingId ? form.productIds : (form.productIds.length > 0 ? form.productIds : undefined),
    };

    if (editingId) {
      updateDeal.mutate(
        { id: editingId, ...payload },
        {
          onSuccess: () => {
            toast.success("Deal updated");
            setShowModal(false);
          },
          onError: () => toast.error("Failed to update deal"),
        }
      );
    } else {
      createDeal.mutate(payload, {
        onSuccess: () => {
          toast.success("Deal created");
          setShowModal(false);
          setForm(emptyForm);
        },
        onError: () => toast.error("Failed to create deal"),
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete deal "${name}"?`)) return;
    deleteDeal.mutate(id, {
      onSuccess: () => toast.success("Deal deleted"),
      onError: () => toast.error("Failed to delete deal"),
    });
  };

  const toggleProduct = (productId: string) => {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(productId)
        ? f.productIds.filter((id) => id !== productId)
        : [...f.productIds, productId],
    }));
  };

  const isPending = createDeal.isPending || updateDeal.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Hot Deals</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          <Plus size={16} /> New Deal
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Deal</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Products</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.deals.map((deal) => {
                  const now = new Date();
                  const start = new Date(deal.startDate);
                  const end = new Date(deal.endDate);
                  const isExpired = end < now;
                  const isUpcoming = start > now;

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
                          ? "Free Shipping"
                          : `$${deal.discountValue.toFixed(2)} off`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {deal.productCount} items
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <p>{start.toLocaleDateString()} –</p>
                        <p>{end.toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isExpired ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">Expired</span>
                        ) : isUpcoming ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">Upcoming</span>
                        ) : deal.isActive ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">Active</span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(deal)}
                            className="text-blue-500 hover:text-blue-600 p-1"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(deal.id, deal.name)}
                            className="text-red-500 hover:text-red-600 p-1"
                            title="Delete"
                          >
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

      {/* Create / Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[80]" onClick={() => setShowModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl p-6 z-[90] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                {editingId ? "Edit Deal" : "New Deal"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Deal Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })
                  }
                  placeholder="e.g. Summer Sale 2026"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Slug (URL)</label>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="summer-sale-2026"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-mono"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe this deal..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
                />
              </div>

              {/* Discount type & value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Discount Value</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    placeholder="e.g. 20"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Dates */}
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

              {/* Active toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>

              {/* Product Picker */}
              <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Add Products to Deal ({form.productIds.length} selected)
                  </label>
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products to add..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 mb-2"
                  />
                  <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg">
                    {productsData?.products.map((product) => (
                      <label
                        key={product.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={form.productIds.includes(product.id)}
                          onChange={() => toggleProduct(product.id)}
                          className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-500"
                        />
                        <div className="flex items-center gap-2 min-w-0">
                          {product.image && (
                            <img src={product.image} alt="" className="w-8 h-8 rounded object-cover" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-400">${Number(product.price).toFixed(2)}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                    {productsData?.products.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-3">No products found</p>
                    )}
                  </div>
                </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {isPending
                    ? editingId
                      ? "Updating..."
                      : "Creating..."
                    : editingId
                    ? "Update Deal"
                    : "Create Deal"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
