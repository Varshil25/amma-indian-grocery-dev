import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useProductSearch } from "../hooks/use-products";

interface SearchBarProps {
  onClose?: () => void;
  className?: string;
}

export default function SearchBar({ onClose, className = "" }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: results } = useProductSearch(query);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/categories/all?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery("");
      onClose?.();
    }
  };

  const handleSelect = (slug: string) => {
    navigate(`/product/${slug}`);
    setIsOpen(false);
    setQuery("");
    onClose?.();
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-200" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search products..."
          className="w-full pl-10 pr-10 py-2.5 border border-text-100 rounded-lg text-body-sm text-text-500 focus:outline-none focus:border-green-500 transition bg-white"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setIsOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-200 hover:text-text-400"
          >
            <X size={16} />
          </button>
        )}
      </form>

      {/* Autocomplete dropdown */}
      {isOpen && results && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-text-50 rounded-xl shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.slug)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background-secondary transition text-left"
            >
              {item.images?.[0]?.url && (
                <img
                  src={item.images[0].url}
                  alt={item.name}
                  className="w-10 h-10 object-contain rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-text-500 truncate">
                  {item.name}
                </p>
                <p className="text-body-xs text-text-200">
                  {item.category?.name} · ${parseFloat(item.price).toFixed(2)}
                </p>
              </div>
            </button>
          ))}
          <button
            onClick={handleSubmit as any}
            className="w-full px-4 py-3 text-center text-body-sm text-green-600 font-medium hover:bg-green-50 transition border-t border-text-50"
          >
            View all results for "{query}"
          </button>
        </div>
      )}

      {isOpen && query.length >= 2 && results && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-text-50 rounded-xl shadow-lg z-50 p-6 text-center">
          <p className="text-text-300 text-body-sm">No products found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
