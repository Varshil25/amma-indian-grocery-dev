import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, Star, FolderTree, ImageOff } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type AdminCategory,
} from "../hooks/use-admin";
import Modal, { inputClass, labelClass, primaryBtn, secondaryBtn } from "../components/Modal";
import ImageInput from "../components/ImageInput";
import { slugify, errorMessage } from "../lib/utils";

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  image: string[];
  parentId: string;
  sortOrder: string;
  isActive: boolean;
  isFeatured: boolean;
}

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  image: [],
  parentId: "",
  sortOrder: "0",
  isActive: true,
  isFeatured: false,
};

export default function Categories() {
  const { data: categories, isLoading, isError, error } = useAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);

  const openCreate = (parentId = "") => {
    const nextSort = (categories?.length ?? 0) + 1;
    setForm({ ...emptyForm, parentId, sortOrder: String(nextSort) });
    setSlugTouched(false);
    setEditing("new");
  };

  const openEdit = (c: AdminCategory) => {
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      image: c.image ? [c.image] : [],
      parentId: c.parentId || "",
      sortOrder: String(c.sortOrder),
      isActive: c.isActive,
      isFeatured: c.isFeatured,
    });
    setSlugTouched(true);
    setEditing(c);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || null,
      image: form.image[0] || null,
      parentId: form.parentId || null,
      sortOrder: Math.max(0, parseInt(form.sortOrder) || 0),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    };
    const done = {
      onSuccess: () => {
        toast.success(editing === "new" ? "Category created" : "Category updated");
        setEditing(null);
      },
      onError: (err: Error) => toast.error(errorMessage(err, "Failed to save category")),
    };
    if (editing === "new") createCategory.mutate(payload, done);
    else if (editing) updateCategory.mutate({ id: editing.id, ...payload }, done);
  };

  const toggle = (c: AdminCategory, field: "isActive" | "isFeatured") => {
    updateCategory.mutate(
      { id: c.id, [field]: !c[field] },
      { onError: (err) => toast.error(errorMessage(err, "Failed to update category")) }
    );
  };

  const handleDelete = (c: AdminCategory) => {
    if (!confirm(`Delete category "${c.name}"? This can't be undone.`)) return;
    deleteCategory.mutate(c.id, {
      onSuccess: () => toast.success("Category deleted"),
      onError: (err) => toast.error(errorMessage(err, "Failed to delete category")),
    });
  };

  const topLevel = categories || [];
  const editingSelf = editing && editing !== "new" ? editing : null;
  const parentOptions = topLevel.filter((c) => c.id !== editingSelf?.id);

  const Row = ({ c, child }: { c: AdminCategory; child?: boolean }) => (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className={`flex items-center gap-3 ${child ? "pl-8" : ""}`}>
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
            {c.image ? <img src={c.image} alt="" className="w-full h-full object-contain" /> : <ImageOff size={14} className="text-gray-300" />}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {child && <span className="text-gray-300 mr-1">└</span>}
              {c.name}
            </p>
            <p className="text-xs text-gray-400 font-mono">/{c.slug}</p>
          </div>
        </div>
      </td>
      <td data-label="Products" className="px-4 py-3 text-center text-gray-600">{c._count?.products ?? 0}</td>
      <td data-label="Order" className="px-4 py-3 text-center text-gray-500">{c.sortOrder}</td>
      <td data-label="Status" className="px-4 py-3 text-center">
        <button
          onClick={() => toggle(c, "isActive")}
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            c.isActive ? "text-green-700 bg-green-50" : "text-gray-500 bg-gray-100"
          }`}
          title="Click to toggle"
        >
          {c.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
          {c.isActive ? "Visible" : "Hidden"}
        </button>
      </td>
      <td data-label="Featured" className="px-4 py-3 text-center">
        <button onClick={() => toggle(c, "isFeatured")} title="Show on home page" aria-label={`Toggle featured for ${c.name}`}>
          <Star size={16} className={c.isFeatured ? "text-yellow-500 fill-yellow-400" : "text-gray-300"} />
        </button>
      </td>
      <td data-actions className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          {!child && (
            <button onClick={() => openCreate(c.id)} className="text-gray-500 hover:text-green-600 p-2 rounded-lg hover:bg-gray-100 transition" title="Add subcategory">
              <FolderTree size={15} />
            </button>
          )}
          <button onClick={() => openEdit(c)} className="text-blue-500 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition" title="Edit" aria-label={`Edit ${c.name}`}>
            <Pencil size={15} />
          </button>
          <button onClick={() => handleDelete(c)} className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-gray-100 transition" title="Delete" aria-label={`Delete ${c.name}`}>
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
        <button onClick={() => openCreate()} className={`${primaryBtn} flex items-center gap-1.5`}>
          <Plus size={16} /> Add Category
        </button>
      </div>
      <p className="text-sm text-gray-500">
        Visible categories appear in the store menu and category pages. Starred ones are featured on the home page.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          </div>
        ) : isError ? (
          <p className="px-4 py-12 text-center text-red-600 text-sm">{errorMessage(error, "Couldn't load categories")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-cards w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Products</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Featured</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topLevel.map((c) => (
                  <FragmentRows key={c.id}>
                    <Row c={c} />
                    {(c.children || []).map((ch) => (
                      <Row key={ch.id} c={ch} child />
                    ))}
                  </FragmentRows>
                ))}
                {topLevel.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      No categories yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <Modal title={editing === "new" ? (form.parentId ? "New Subcategory" : "New Category") : "Edit Category"} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className={labelClass} htmlFor="c-name">
                Name *
              </label>
              <input
                id="c-name"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) }))
                }
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="c-slug">
                  URL slug
                </label>
                <input
                  id="c-slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((f) => ({ ...f, slug: e.target.value }));
                  }}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="c-sort">
                  Display order
                </label>
                <input
                  id="c-sort"
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="c-parent">
                Parent category
              </label>
              <select
                id="c-parent"
                value={form.parentId}
                onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                disabled={!!editingSelf?.children?.length}
                className={inputClass}
              >
                <option value="">None (top level)</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="c-desc">
                Description
              </label>
              <textarea
                id="c-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={`${inputClass} resize-none`}
              />
            </div>
            <ImageInput value={form.image} onChange={(image) => setForm((f) => ({ ...f, image }))} max={1} label="Image / icon" />
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-green-500"
                />
                Visible in store
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-green-500"
                />
                Featured on home page
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)} className={`${secondaryBtn} flex-1`}>
                Cancel
              </button>
              <button type="submit" disabled={createCategory.isPending || updateCategory.isPending} className={`${primaryBtn} flex-1`}>
                {createCategory.isPending || updateCategory.isPending ? "Saving…" : "Save Category"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function FragmentRows({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
