import { useState } from "react";
import {
  Search,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Star,
  Eye,
  EyeOff,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useAdminCategories,
} from "../hooks/use-admin";

interface ProductForm {
  name: string;
  slug: string;
  sku: string;
  description: string;
  categoryId: string;
  brand: string;
  unit: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  isFeatured: boolean;
  isActive: boolean;
}

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  categoryId: "",
  brand: "",
  unit: "each",
  price: "",
  compareAtPrice: "",
  costPrice: "",
  isFeatured: false,
  isActive: true,
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function Products() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const { data, isLoading } = useAdminProducts(page, search || undefined);
  const { data: categories } = useAdminCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    price: number;
    compareAtPrice: number | null;
    category: string;
    isActive: boolean;
    isFeatured: boolean;
  }) => {
    // Find categoryId from category name
    const allCats = flattenCategories(categories || []);
    const cat = allCats.find((c) => c.name === product.category);

    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: "",
      categoryId: cat?.id || "",
      brand: "",
      unit: "each",
      price: String(product.price),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
      costPrice: "",
      isFeatured: product.isFeatured,
      isActive: product.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      // Only send changed fields for update
      const payload: Record<string, unknown> = { id: editingId };
      if (form.name) payload.name = form.name;
      if (form.slug) payload.slug = form.slug;
      if (form.categoryId) payload.categoryId = form.categoryId;
      if (form.price) payload.price = parseFloat(form.price);
      if (form.compareAtPrice) payload.compareAtPrice = parseFloat(form.compareAtPrice);
      else payload.compareAtPrice = null;
      if (form.costPrice) payload.costPrice = parseFloat(form.costPrice);
      if (form.brand) payload.brand = form.brand;
      if (form.unit) payload.unit = form.unit;
      if (form.description) payload.description = form.description;
      payload.isFeatured = form.isFeatured;
      payload.isActive = form.isActive;

      updateProduct.mutate(payload as { id: string; [key: string]: unknown }, {
        onSuccess: () => {
          toast.success("Product updated — price synced to POS if linked");
          setShowModal(false);
        },
        onError: () => toast.error("Failed to update product"),
      });
    } else {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        sku: form.sku,
        description: form.description || undefined,
        categoryId: form.categoryId || undefined,
        brand: form.brand || undefined,
        unit: form.unit || "each",
        price: parseFloat(form.price),
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
      };

      createProduct.mutate(payload, {
        onSuccess: () => {
          toast.success("Product created");
          setShowModal(false);
          setForm(emptyForm);
        },
        onError: () => toast.error("Failed to create product"),
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Deactivate product "${name}"? It will be hidden from the store.`)) return;
    deleteProduct.mutate(id, {
      onSuccess: () => toast.success("Product deactivated"),
      onError: () => toast.error("Failed to deactivate product"),
    });
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  // Flatten nested categories for the select dropdown
  function flattenCategories(cats: { id: string; name: string; children?: { id: string; name: string }[] }[]): { id: string; name: string; isChild?: boolean }[] {
    const result: { id: string; name: string; isChild?: boolean }[] = [];
    for (const cat of cats) {
      result.push({ id: cat.id, name: cat.name });
      if (cat.children) {
        for (const child of cat.children) {
          result.push({ id: child.id, name: child.name, isChild: true });
        }
      }
    }
    return result;
  }

  const allCategories = flattenCategories(categories || []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Products</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            Clear
          </button>
        )}
      </form>

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
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Featured</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-contain p-0.5" />
                          ) : (
                            <Package size={16} className="text-gray-400" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900 line-clamp-1">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{product.sku}</td>
                    <td className="px-4 py-3 text-gray-600">{product.category}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-gray-900">${product.price.toFixed(2)}</span>
                      {product.compareAtPrice && (
                        <span className="text-xs text-gray-400 line-through ml-1">${product.compareAtPrice.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {product.stock !== null ? (
                        <span className={`font-medium ${product.stock <= 0 ? "text-red-600" : product.stock <= 10 ? "text-orange-600" : "text-gray-900"}`}>
                          {product.stock}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <Eye size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          <EyeOff size={12} /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.isFeatured && <Star size={16} className="text-yellow-500 fill-yellow-400 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(product)} className="text-blue-500 hover:text-blue-600 p-1" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(product.id, product.name)} className="text-red-500 hover:text-red-600 p-1" title="Deactivate">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.products.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">No products found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(data.pagination.page - 1) * data.pagination.limit + 1}-
              {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-700 px-2">{page} / {data.pagination.totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))} disabled={page === data.pagination.totalPages} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
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
                {editingId ? "Edit Product" : "New Product"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Product Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, slug: editingId ? form.slug : slugify(e.target.value) })}
                  placeholder="e.g. Basmati Rice 5kg"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              {/* SKU + Slug */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">SKU</label>
                  <input
                    required={!editingId}
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="e.g. RICE-BAS-5KG"
                    disabled={!!editingId}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-mono disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Slug (URL)</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="auto-generated"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-mono"
                  />
                </div>
              </div>

              {/* Category + Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  >
                    <option value="">Select category</option>
                    {allCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.isChild ? `  └ ${cat.name}` : cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Brand</label>
                  <input
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="e.g. MDH, Haldiram"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Price ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Compare At ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.compareAtPrice}
                    onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                    placeholder="Original price"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    placeholder="Your cost"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>

              {editingId && (
                <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                  Price changes are automatically pushed to Square POS if this product is linked.
                </p>
              )}

              {/* Unit */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Unit</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                >
                  <option value="each">Each</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="lb">Pound (lb)</option>
                  <option value="g">Gram (g)</option>
                  <option value="oz">Ounce (oz)</option>
                  <option value="pack">Pack</option>
                  <option value="bundle">Bundle</option>
                  <option value="liter">Liter</option>
                  <option value="ml">Milliliter (ml)</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Product description..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
                />
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-700">Featured</span>
                </label>
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
                    ? editingId ? "Updating..." : "Creating..."
                    : editingId ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
