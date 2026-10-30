import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  RotateCcw,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminProducts,
  useAdminProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useAdminCategories,
  type AdminCategory,
} from "../hooks/use-admin";
import Modal, { inputClass, labelClass, primaryBtn, secondaryBtn } from "../components/Modal";
import ImageInput from "../components/ImageInput";
import { slugify, money, errorMessage } from "../lib/utils";

interface ProductForm {
  name: string;
  slug: string;
  sku: string;
  barcode: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  brand: string;
  unit: string;
  unitValue: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  tags: string;
  images: string[];
  initialStock: string;
  lowStockThreshold: string;
  isFeatured: boolean;
  isActive: boolean;
  isOnSale: boolean;
  isPerishable: boolean;
}

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  sku: "",
  barcode: "",
  description: "",
  shortDescription: "",
  categoryId: "",
  brand: "",
  unit: "each",
  unitValue: "",
  price: "",
  compareAtPrice: "",
  costPrice: "",
  tags: "",
  images: [],
  initialStock: "0",
  lowStockThreshold: "10",
  isFeatured: false,
  isActive: true,
  isOnSale: false,
  isPerishable: false,
};

const UNITS = [
  ["each", "Each"],
  ["kg", "Kilogram (kg)"],
  ["g", "Gram (g)"],
  ["lb", "Pound (lb)"],
  ["oz", "Ounce (oz)"],
  ["l", "Liter (l)"],
  ["ml", "Milliliter (ml)"],
  ["pack", "Pack"],
  ["bundle", "Bundle"],
  ["dozen", "Dozen"],
] as const;

function flattenCategories(cats: AdminCategory[]) {
  const out: { id: string; name: string; isChild: boolean; isActive: boolean }[] = [];
  for (const c of cats) {
    out.push({ id: c.id, name: c.name, isChild: false, isActive: c.isActive });
    for (const ch of c.children || []) out.push({ id: ch.id, name: ch.name, isChild: true, isActive: ch.isActive });
  }
  return out;
}

const optNum = (v: string) => (v.trim() === "" ? null : Number(v));

export default function Products() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; id: string } | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);

  const { data, isLoading, isError, error } = useAdminProducts(page, search || undefined, status || undefined);
  const { data: categories } = useAdminCategories();
  const editingId = modal?.mode === "edit" ? modal.id : null;
  const { data: detail, isLoading: detailLoading } = useAdminProduct(editingId);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // Load the saved product into the form when editing
  useEffect(() => {
    if (!detail || detail.id !== editingId) return;
    setForm({
      name: detail.name,
      slug: detail.slug,
      sku: detail.sku,
      barcode: detail.barcode || "",
      description: detail.description || "",
      shortDescription: detail.shortDescription || "",
      categoryId: detail.categoryId,
      brand: detail.brand || "",
      unit: detail.unit || "each",
      unitValue: detail.unitValue !== null ? String(detail.unitValue) : "",
      price: String(detail.price),
      compareAtPrice: detail.compareAtPrice !== null ? String(detail.compareAtPrice) : "",
      costPrice: detail.costPrice !== null ? String(detail.costPrice) : "",
      tags: detail.tags.join(", "),
      images: detail.images.map((i) => i.url),
      initialStock: "0",
      lowStockThreshold: String(detail.inventory?.lowStockThreshold ?? 10),
      isFeatured: detail.isFeatured,
      isActive: detail.isActive,
      isOnSale: detail.isOnSale,
      isPerishable: detail.isPerishable,
    });
    setSlugTouched(true);
  }, [detail, editingId]);

  const allCategories = flattenCategories(categories || []);

  const openCreate = () => {
    setForm({ ...emptyForm, categoryId: "" });
    setSlugTouched(false);
    setModal({ mode: "create" });
  };

  const openEdit = (id: string) => {
    setForm(emptyForm);
    setModal({ mode: "edit", id });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) return toast.error("Please choose a category");
    const price = Number(form.price);
    if (!(price > 0)) return toast.error("Price must be greater than 0");
    const compareAt = optNum(form.compareAtPrice);
    if (compareAt !== null && compareAt <= price) {
      return toast.error("Compare-at price should be higher than the price (it's shown struck through)");
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      sku: form.sku.trim(),
      barcode: form.barcode.trim() || null,
      description: form.description.trim() || null,
      shortDescription: form.shortDescription.trim() || null,
      categoryId: form.categoryId,
      brand: form.brand.trim() || null,
      unit: form.unit,
      unitValue: optNum(form.unitValue),
      price,
      compareAtPrice: compareAt,
      costPrice: optNum(form.costPrice),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      images: form.images.map((url) => ({ url })),
      lowStockThreshold: Number(form.lowStockThreshold) || 0,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      isOnSale: form.isOnSale,
      isPerishable: form.isPerishable,
    };

    if (editingId) {
      updateProduct.mutate(
        { id: editingId, ...payload },
        {
          onSuccess: () => {
            toast.success("Product updated");
            setModal(null);
          },
          onError: (err) => toast.error(errorMessage(err, "Failed to update product")),
        }
      );
    } else {
      payload.initialStock = Math.max(0, parseInt(form.initialStock) || 0);
      createProduct.mutate(payload, {
        onSuccess: () => {
          toast.success("Product created");
          setModal(null);
        },
        onError: (err) => toast.error(errorMessage(err, "Failed to create product")),
      });
    }
  };

  const handleDeactivate = (id: string, name: string) => {
    if (!confirm(`Hide "${name}" from the store? You can reactivate it later.`)) return;
    deleteProduct.mutate(id, {
      onSuccess: () => toast.success("Product hidden from the store"),
      onError: (err) => toast.error(errorMessage(err, "Failed to deactivate product")),
    });
  };

  const handleReactivate = (id: string) => {
    updateProduct.mutate(
      { id, isActive: true },
      {
        onSuccess: () => toast.success("Product is live again"),
        onError: (err) => toast.error(errorMessage(err)),
      }
    );
  };

  const isPending = createProduct.isPending || updateProduct.isPending;
  const set = (patch: Partial<ProductForm>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Products</h2>
        <button onClick={openCreate} className={`${primaryBtn} flex items-center gap-1.5`}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {categories && categories.length === 0 && (
        <div className="text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3">
          You need at least one category before adding products.{" "}
          <Link to="/categories" className="font-medium underline">
            Create a category
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
          className="flex gap-2 flex-1 min-w-[260px] max-w-xl"
        >
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU or brand..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
          <button type="submit" className={primaryBtn}>
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSearchInput("");
                setPage(1);
              }}
              className={secondaryBtn}
            >
              Clear
            </button>
          )}
        </form>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={`${inputClass} w-auto`}
          aria-label="Filter by status"
        >
          <option value="">All products</option>
          <option value="active">Active only</option>
          <option value="inactive">Hidden only</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          </div>
        ) : isError ? (
          <p className="px-4 py-12 text-center text-red-600 text-sm">{errorMessage(error, "Couldn't load products")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Available</th>
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
                            <img src={product.image} alt="" className="w-full h-full object-contain p-0.5" />
                          ) : (
                            <Package size={16} className="text-gray-400" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900 line-clamp-1">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{product.sku}</td>
                    <td className="px-4 py-3 text-gray-600">{product.category}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {product.inDeal && (
                        <Flame size={12} className="inline text-orange-500 mr-1" aria-label="Hot deal price" />
                      )}
                      <span className="font-medium text-gray-900">{money(product.price)}</span>
                      {product.compareAtPrice && (
                        <span className="text-xs text-gray-400 line-through ml-1">{money(product.compareAtPrice)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {product.stock !== null ? (
                        <span
                          className={`font-medium ${
                            product.stock <= 0 ? "text-red-600" : product.stock <= 10 ? "text-orange-600" : "text-gray-900"
                          }`}
                        >
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
                          <EyeOff size={12} /> Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.isFeatured && <Star size={16} className="text-yellow-500 fill-yellow-400 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(product.id)}
                          className="text-blue-500 hover:text-blue-600 p-1"
                          title="Edit"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        {product.isActive ? (
                          <button
                            onClick={() => handleDeactivate(product.id, product.name)}
                            className="text-red-500 hover:text-red-600 p-1"
                            title="Hide from store"
                            aria-label={`Hide ${product.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(product.id)}
                            className="text-green-600 hover:text-green-700 p-1"
                            title="Reactivate"
                            aria-label={`Reactivate ${product.name}`}
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.products.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                      {search || status ? "No products match" : "No products yet — click Add Product to create your first one"}
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
              Showing {(data.pagination.page - 1) * data.pagination.limit + 1}-
              {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                aria-label="Previous page"
              >
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

      {modal && (
        <Modal title={editingId ? "Edit Product" : "New Product"} onClose={() => setModal(null)} size="xl">
          {editingId && detailLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-green-500" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="p-name">
                  Product name *
                </label>
                <input
                  id="p-name"
                  required
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
                  placeholder="e.g. Basmati Rice 5 lb"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass} htmlFor="p-sku">
                    SKU *
                  </label>
                  <input
                    id="p-sku"
                    required
                    value={form.sku}
                    onChange={(e) => set({ sku: e.target.value })}
                    placeholder="e.g. RICE-BAS-5LB"
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="p-barcode">
                    Barcode
                  </label>
                  <input
                    id="p-barcode"
                    value={form.barcode}
                    onChange={(e) => set({ barcode: e.target.value })}
                    placeholder="UPC / EAN"
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="p-slug">
                    URL slug
                  </label>
                  <input
                    id="p-slug"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set({ slug: e.target.value });
                    }}
                    placeholder="auto from name"
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="p-category">
                    Category *
                  </label>
                  <select
                    id="p-category"
                    required
                    value={form.categoryId}
                    onChange={(e) => set({ categoryId: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Select category</option>
                    {allCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.isChild ? `  └ ${cat.name}` : cat.name}
                        {cat.isActive ? "" : " (hidden)"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="p-brand">
                    Brand
                  </label>
                  <input
                    id="p-brand"
                    value={form.brand}
                    onChange={(e) => set({ brand: e.target.value })}
                    placeholder="e.g. MDH, Haldiram's"
                    className={inputClass}
                  />
                </div>
              </div>

              <ImageInput value={form.images} onChange={(images) => set({ images })} label="Images (first one is the main image)" />

              {detail?.inDeal && editingId && (
                <p className="text-xs text-orange-700 bg-orange-50 px-3 py-2 rounded-lg">
                  <Flame size={12} className="inline mr-1" />
                  This product is in a running Hot Deal and currently sells for {money(detail.livePrice)}. Edit the regular
                  price below — the deal price is recalculated from it.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass} htmlFor="p-price">
                    {detail?.inDeal && editingId ? "Regular price ($) *" : "Price ($) *"}
                  </label>
                  <input
                    id="p-price"
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.price}
                    onChange={(e) => set({ price: e.target.value })}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="p-compare">
                    Compare-at price ($)
                  </label>
                  <input
                    id="p-compare"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.compareAtPrice}
                    onChange={(e) => set({ compareAtPrice: e.target.value })}
                    placeholder="Shown struck through"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="p-cost">
                    Cost ($)
                  </label>
                  <input
                    id="p-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.costPrice}
                    onChange={(e) => set({ costPrice: e.target.value })}
                    placeholder="Your cost (private)"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={labelClass} htmlFor="p-unit">
                    Unit
                  </label>
                  <select id="p-unit" value={form.unit} onChange={(e) => set({ unit: e.target.value })} className={inputClass}>
                    {UNITS.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="p-unitvalue">
                    Size
                  </label>
                  <input
                    id="p-unitvalue"
                    type="number"
                    step="any"
                    min="0"
                    value={form.unitValue}
                    onChange={(e) => set({ unitValue: e.target.value })}
                    placeholder="e.g. 5"
                    className={inputClass}
                  />
                </div>
                {!editingId && (
                  <div>
                    <label className={labelClass} htmlFor="p-stock">
                      Opening stock
                    </label>
                    <input
                      id="p-stock"
                      type="number"
                      min="0"
                      step="1"
                      value={form.initialStock}
                      onChange={(e) => set({ initialStock: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                )}
                <div>
                  <label className={labelClass} htmlFor="p-low">
                    Low-stock alert at
                  </label>
                  <input
                    id="p-low"
                    type="number"
                    min="0"
                    step="1"
                    value={form.lowStockThreshold}
                    onChange={(e) => set({ lowStockThreshold: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              {editingId && detail?.inventory && (
                <p className="text-xs text-gray-500">
                  In stock: {detail.inventory.stockQuantity} ({detail.inventory.reservedQuantity} reserved by open orders). Change
                  stock levels on the{" "}
                  <Link to="/inventory" className="underline" onClick={() => setModal(null)}>
                    Inventory
                  </Link>{" "}
                  page so every change is recorded.
                </p>
              )}

              <div>
                <label className={labelClass} htmlFor="p-short">
                  Short description
                </label>
                <input
                  id="p-short"
                  value={form.shortDescription}
                  onChange={(e) => set({ shortDescription: e.target.value })}
                  maxLength={300}
                  placeholder="One line shown in listings"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="p-desc">
                  Description
                </label>
                <textarea
                  id="p-desc"
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  rows={3}
                  className={`${inputClass} resize-y`}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="p-tags">
                  Search tags (comma separated)
                </label>
                <input
                  id="p-tags"
                  value={form.tags}
                  onChange={(e) => set({ tags: e.target.value })}
                  placeholder="e.g. chawal, rice, long grain"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {(
                  [
                    ["isActive", "Visible in store"],
                    ["isFeatured", "Featured on home page"],
                    ["isOnSale", "Show in Hot Deals"],
                    ["isPerishable", "Perishable"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      disabled={key === "isOnSale" && !!detail?.inDeal && !!editingId}
                      onChange={(e) => set({ [key]: e.target.checked } as Partial<ProductForm>)}
                      className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-500"
                    />
                    {label}
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className={`${secondaryBtn} flex-1`}>
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className={`${primaryBtn} flex-1`}>
                  {isPending ? "Saving…" : editingId ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
