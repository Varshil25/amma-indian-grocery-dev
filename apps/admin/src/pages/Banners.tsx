import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useAdminBanners, useSaveBanner, useDeleteBanner, type AdminBanner } from "../hooks/use-admin";
import Modal, { inputClass, labelClass, primaryBtn, secondaryBtn } from "../components/Modal";
import ImageInput from "../components/ImageInput";
import { errorMessage, toDateInput, startOfDayISO, endOfDayISO } from "../lib/utils";

interface BannerForm {
  title: string;
  subtitle: string;
  image: string[];
  link: string;
  sortOrder: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

const emptyForm: BannerForm = {
  title: "",
  subtitle: "",
  image: [],
  link: "",
  sortOrder: "0",
  isActive: true,
  startDate: "",
  endDate: "",
};

function bannerState(b: AdminBanner) {
  const now = new Date();
  if (!b.isActive) return { label: "Hidden", cls: "bg-gray-100 text-gray-500" };
  if (b.startDate && new Date(b.startDate) > now) return { label: "Scheduled", cls: "bg-yellow-50 text-yellow-700" };
  if (b.endDate && new Date(b.endDate) < now) return { label: "Ended", cls: "bg-red-50 text-red-600" };
  return { label: "Live", cls: "bg-green-50 text-green-700" };
}

export default function Banners() {
  const { data: banners, isLoading, isError, error } = useAdminBanners();
  const save = useSaveBanner();
  const del = useDeleteBanner();
  const [editing, setEditing] = useState<AdminBanner | "new" | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);

  const openCreate = () => {
    setForm({ ...emptyForm, sortOrder: String(banners?.length ?? 0) });
    setEditing("new");
  };
  const openEdit = (b: AdminBanner) => {
    setForm({
      title: b.title,
      subtitle: b.subtitle || "",
      image: [b.image],
      link: b.link || "",
      sortOrder: String(b.sortOrder),
      isActive: b.isActive,
      startDate: toDateInput(b.startDate),
      endDate: toDateInput(b.endDate),
    });
    setEditing(b);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image[0]) return toast.error("Please add an image");
    if (form.startDate && form.endDate && form.endDate < form.startDate) return toast.error("End date must be after the start date");
    const payload = {
      id: editing !== "new" && editing ? editing.id : undefined,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      image: form.image[0],
      link: form.link.trim() || null,
      position: "home_promo",
      sortOrder: Math.max(0, parseInt(form.sortOrder) || 0),
      isActive: form.isActive,
      startDate: form.startDate ? startOfDayISO(form.startDate) : null,
      endDate: form.endDate ? endOfDayISO(form.endDate) : null,
    };
    save.mutate(payload, {
      onSuccess: () => {
        toast.success("Banner saved");
        setEditing(null);
      },
      onError: (err) => toast.error(errorMessage(err, "Failed to save banner")),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Home Page Banners</h2>
        <button onClick={openCreate} className={`${primaryBtn} flex items-center gap-1.5`}>
          <Plus size={16} /> Add Banner
        </button>
      </div>
      <p className="text-sm text-gray-500">
        Promo cards shown under the category list on the home page. Only live banners are shown; with none, the section is hidden.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        </div>
      ) : isError ? (
        <p className="py-12 text-center text-red-600 text-sm">{errorMessage(error, "Couldn't load banners")}</p>
      ) : banners && banners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((b) => {
            const st = bannerState(b);
            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex">
                <div className="w-32 h-32 bg-gray-50 shrink-0">
                  <img src={b.image} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="p-4 flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900 truncate">{b.title}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${st.cls}`}>{st.label}</span>
                  </div>
                  {b.subtitle && <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{b.subtitle}</p>}
                  <p className="text-xs text-gray-400 mt-1 truncate">{b.link ? `Links to ${b.link}` : "No link"}</p>
                  <div className="mt-auto flex gap-1 pt-2">
                    <button
                      onClick={() => save.mutate({ id: b.id, isActive: !b.isActive }, { onError: (err) => toast.error(errorMessage(err)) })}
                      className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition"
                      title={b.isActive ? "Hide" : "Show"}
                    >
                      {b.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button onClick={() => openEdit(b)} className="text-blue-500 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition" title="Edit" aria-label={`Edit ${b.title}`}>
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm(`Delete banner "${b.title}"?`)) return;
                        del.mutate(b.id, {
                          onSuccess: () => toast.success("Banner deleted"),
                          onError: (err) => toast.error(errorMessage(err)),
                        });
                      }}
                      className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-gray-100 transition"
                      title="Delete"
                      aria-label={`Delete ${b.title}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
          <ImageIcon size={28} className="mx-auto mb-2 text-gray-300" />
          No banners yet
        </div>
      )}

      {editing && (
        <Modal title={editing === "new" ? "New Banner" : "Edit Banner"} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className={labelClass} htmlFor="b-title">
                Title *
              </label>
              <input
                id="b-title"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Fresh vegetables every morning"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="b-sub">
                Subtitle
              </label>
              <input
                id="b-sub"
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                className={inputClass}
              />
            </div>
            <ImageInput value={form.image} onChange={(image) => setForm((f) => ({ ...f, image }))} max={1} label="Image *" />
            <p className="text-xs text-gray-500 -mt-1">
              Use a landscape photo, about 1200 × 800 px. On the home page it fills the side of the card
              (the top on phones) and the edges may be trimmed to fit.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelClass} htmlFor="b-link">
                  Link
                </label>
                <input
                  id="b-link"
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  placeholder="/categories/vegetables or /hot-deals"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="b-sort">
                  Order
                </label>
                <input
                  id="b-sort"
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="b-start">
                  Show from (optional)
                </label>
                <input id="b-start" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="b-end">
                  Show until (optional)
                </label>
                <input id="b-end" type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-green-500"
              />
              Active
            </label>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)} className={`${secondaryBtn} flex-1`}>
                Cancel
              </button>
              <button type="submit" disabled={save.isPending} className={`${primaryBtn} flex-1`}>
                {save.isPending ? "Saving…" : "Save Banner"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
