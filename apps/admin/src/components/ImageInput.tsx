import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Star, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { uploadImage, errorMessage } from "../lib/utils";
import { inputClass } from "./Modal";

interface Props {
  /** Image URLs; the first one is the main image */
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
}

/** Upload images (resized in the browser) or paste image URLs. */
export default function ImageInput({ value, onChange, max = 10, label = "Images" }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = max - value.length;
    if (room <= 0) return toast.error(`Up to ${max} image${max === 1 ? "" : "s"}`);
    setUploading(true);
    const added: string[] = [];
    try {
      for (const f of Array.from(files).slice(0, room)) {
        added.push(await uploadImage(f));
      }
    } catch (err) {
      toast.error(errorMessage(err, "Upload failed"));
    } finally {
      if (added.length) onChange(max === 1 ? added.slice(0, 1) : [...value, ...added]);
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    if (!/^https?:\/\/\S+$/i.test(u)) return toast.error("Image URL must start with http:// or https://");
    onChange(max === 1 ? [u] : [...value, u].slice(0, max));
    setUrlInput("");
  };

  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((url, i) => (
            <div key={url + i} className="relative w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden group">
              <img src={url} alt="" className="w-full h-full object-contain" />
              {i === 0 && max > 1 && (
                <span className="absolute top-1 left-1 bg-yellow-400 text-[9px] font-semibold px-1 rounded flex items-center gap-0.5">
                  <Star size={8} /> Main
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 opacity-0 group-hover:opacity-100 transition">
                {max > 1 && (
                  <button type="button" onClick={() => move(i, -1)} className="p-1 text-white" aria-label="Move left">
                    <ArrowLeft size={12} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, k) => k !== i))}
                  className="p-1 text-white mx-auto"
                  aria-label="Remove image"
                >
                  <Trash2 size={12} />
                </button>
                {max > 1 && (
                  <button type="button" onClick={() => move(i, 1)} className="p-1 text-white" aria-label="Move right">
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {value.length < max && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:text-green-600 disabled:opacity-50 shrink-0"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={max > 1}
            className="hidden"
            data-testid="image-file-input"
            onChange={(e) => addFiles(e.target.files)}
          />
          <div className="relative flex-1">
            <Link2 size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addUrl();
                }
              }}
              placeholder="…or paste an image URL and press Enter"
              className={`${inputClass} pl-8`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
