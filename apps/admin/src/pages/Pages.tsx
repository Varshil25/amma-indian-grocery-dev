import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Edit2, Loader2, Save, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../lib/api-client";
import { errorMessage } from "../lib/utils";

// Linked from the store footer; deleting or hiding them leaves a "page not found"
const CORE_SLUGS = ["privacy-policy", "shipping", "refund", "payments", "qa"];

interface StaticPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Pages() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<StaticPage | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", content: "", isActive: true });

  const { data: pages, isLoading } = useQuery<StaticPage[]>({
    queryKey: ["admin", "pages"],
    queryFn: () => apiClient.get("/admin/pages"),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { id?: string; title: string; slug: string; content: string; isActive: boolean }) =>
      apiClient.post("/admin/pages", data),
    onSuccess: () => {
      toast.success("Page saved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "pages"] });
      setEditing(null);
      setCreating(false);
      setForm({ title: "", slug: "", content: "", isActive: true });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save page");
    },
  });

  const handleEdit = (page: StaticPage) => {
    setEditing(page);
    setCreating(false);
    setForm({ title: page.title, slug: page.slug, content: page.content, isActive: page.isActive });
  };

  const handleCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ title: "", slug: "", content: "", isActive: true });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/pages/${id}`),
    onSuccess: () => {
      toast.success("Page deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "pages"] });
    },
    onError: (err: Error) => toast.error(errorMessage(err, "Failed to delete page")),
  });

  const handleDelete = (page: StaticPage) => {
    const warn = CORE_SLUGS.includes(page.slug) ? " It's linked from the store footer, which will then show 'page not found'." : "";
    if (!confirm(`Delete "${page.title}"?${warn}`)) return;
    deleteMutation.mutate(page.id);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      toast.error("All fields are required");
      return;
    }
    saveMutation.mutate({
      ...(editing ? { id: editing.id } : {}),
      title: form.title,
      slug: form.slug,
      content: form.content,
      isActive: form.isActive,
    });
  };

  const handleCancel = () => {
    setEditing(null);
    setCreating(false);
    setForm({ title: "", slug: "", content: "", isActive: true });
  };

  const isFormOpen = editing || creating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Static Pages</h2>
        {!isFormOpen && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            <Plus size={16} /> Add Page
          </button>
        )}
      </div>

      {/* Edit / Create Form */}
      {isFormOpen && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              {editing ? `Edit: ${editing.title}` : "Create New Page"}
            </h3>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    title: e.target.value,
                    ...(creating ? { slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") } : {}),
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Page Title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="page-slug"
                disabled={!!editing}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-y"
              placeholder="Page content..."
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-green-500"
            />
            Published (visible on the store)
          </label>
          {creating && form.slug && !CORE_SLUGS.includes(form.slug) && (
            <p className="text-xs text-gray-500">This page will be at /page/{form.slug} on the store.</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
            >
              {saveMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saveMutation.isPending ? "Saving..." : "Save Page"}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pages List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Title</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Slug</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Updated</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!pages || pages.length === 0) ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                    No pages yet. Create your first page.
                  </td>
                </tr>
              ) : (
                pages.map((page) => (
                  <tr key={page.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{page.title}</span>
                      {!page.isActive && <span className="ml-2 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Draft</span>}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">/{page.slug}</code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(page)}
                        className="text-green-600 hover:text-green-700 p-1"
                        aria-label={`Edit ${page.title}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(page)}
                        className="text-red-500 hover:text-red-600 p-1"
                        aria-label={`Delete ${page.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
