import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Wifi,
  Save,
  Store,
  Clock,
  Mail,
  Eye,
  MessageSquare,
  Download,
  Upload,
  Link2,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../lib/api-client";
import { errorMessage, formatPhone } from "../lib/utils";

interface SyncStatus {
  squareConfigured: boolean;
  locationId: string | null;
  lastSyncAt: string | null;
  totalPosSyncs: number;
  linkedProducts: number;
  totalProducts: number;
}

interface StoreSettings {
  [key: string]: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ContactMessagesResponse {
  success: boolean;
  data: {
    messages: ContactMessage[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

// Blank until the owner fills them in; the storefront only shows days that have hours set.
const defaultHours = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => ({
  day,
  time: "",
}));

const checkoutDefaults = {
  tax_rate: "",
  delivery_fee: "",
  free_delivery_threshold: "",
  delivery_enabled: "true",
  pickup_enabled: "true",
  pay_on_delivery_enabled: "true",
};

export default function Settings() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: "store" | "checkout" | "pos" | "messages" =
    tabParam === "messages" || tabParam === "pos" || tabParam === "checkout" ? tabParam : "store";
  const setActiveTab = (t: string) => setSearchParams(t === "store" ? {} : { tab: t }, { replace: true });
  const [checkout, setCheckout] = useState(checkoutDefaults);

  // Store settings
  const [storeForm, setStoreForm] = useState({
    store_name: "",
    store_address: "",
    store_phone: "",
    store_email: "",
    store_map_embed: "",
    social_facebook: "",
    social_whatsapp: "",
    social_instagram: "",
  });
  const [hours, setHours] = useState(defaultHours);

  const { data: settings, isLoading: settingsLoading } = useQuery<{ success: boolean; data: StoreSettings }>({
    queryKey: ["admin", "store-settings"],
    queryFn: () => apiClient.get("/admin/store-settings"),
  });

  useEffect(() => {
    if (settings?.data) {
      const s = settings.data;
      setStoreForm({
        store_name: s.store_name || "",
        store_address: s.store_address || "",
        store_phone: s.store_phone || "",
        store_email: s.store_email || "",
        store_map_embed: s.store_map_embed || "",
        social_facebook: s.social_facebook || "",
        social_whatsapp: s.social_whatsapp || "",
        social_instagram: s.social_instagram || "",
      });
      if (s.store_hours) {
        try { setHours(JSON.parse(s.store_hours)); } catch { /* keep defaults */ }
      }
      setCheckout({
        tax_rate: s.tax_rate ?? "",
        delivery_fee: s.delivery_fee ?? "",
        free_delivery_threshold: s.free_delivery_threshold ?? "",
        delivery_enabled: s.delivery_enabled ?? "true",
        pickup_enabled: s.pickup_enabled ?? "true",
        pay_on_delivery_enabled: s.pay_on_delivery_enabled ?? "true",
      });
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: (data: StoreSettings) => apiClient.put("/admin/store-settings", data),
    onSuccess: () => {
      toast.success("Store settings saved");
      queryClient.invalidateQueries({ queryKey: ["admin", "store-settings"] });
    },
    onError: (err: Error) => toast.error(errorMessage(err, "Failed to save settings")),
  });

  const handleSaveCheckout = () => {
    if (checkout.delivery_enabled !== "true" && checkout.pickup_enabled !== "true") {
      toast.error("Keep at least one of delivery or pickup turned on");
      return;
    }
    saveSettingsMutation.mutate(checkout);
  };

  const handleSaveStore = () => {
    saveSettingsMutation.mutate({
      ...storeForm,
      store_hours: JSON.stringify(hours),
    });
  };

  // POS
  const { data: posData, isLoading: posLoading, refetch: refetchPos } = useQuery<SyncStatus>({
    queryKey: ["admin", "pos", "status"],
    queryFn: () => apiClient.get("/pos/sync-status"),
    enabled: activeTab === "pos",
  });

  const syncMutation = useMutation({
    mutationFn: () => apiClient.post("/pos/sync-inventory"),
    onSuccess: (result: unknown) => {
      toast.success(`Inventory synced! ${(result as Record<string, number>).syncedCount || 0} products updated.`);
      refetchPos();
      setSyncing(false);
    },
    onError: () => { toast.error("Sync failed"); setSyncing(false); },
  });

  const [importing, setImporting] = useState(false);
  const importMutation = useMutation({
    mutationFn: () => apiClient.post("/pos/import-catalog"),
    onSuccess: (result: unknown) => {
      const r = result as { imported: boolean; created?: number; updated?: number; skipped?: number; inventorySynced?: number; reason?: string };
      if (r.imported) {
        toast.success(`Catalog imported! ${r.created || 0} created, ${r.updated || 0} updated, ${r.inventorySynced || 0} inventory synced.`);
      } else {
        toast.error(`Import failed: ${r.reason || "Unknown error"}`);
      }
      refetchPos();
      setImporting(false);
    },
    onError: () => { toast.error("Catalog import failed"); setImporting(false); },
  });

  const [pushingPrices, setPushingPrices] = useState(false);
  const pushPricesMutation = useMutation({
    mutationFn: () => apiClient.post("/pos/push-all-prices"),
    onSuccess: (result: unknown) => {
      const r = result as { synced: boolean; successCount?: number; failCount?: number; total?: number };
      if (r.synced) {
        toast.success(`Prices pushed! ${r.successCount || 0}/${r.total || 0} updated on Square.`);
      } else {
        toast.error("Price push failed");
      }
      setPushingPrices(false);
    },
    onError: () => { toast.error("Price push failed"); setPushingPrices(false); },
  });

  // Contact messages
  const [msgPage, setMsgPage] = useState(1);
  const { data: messagesData, isLoading: messagesLoading } = useQuery<ContactMessagesResponse>({
    queryKey: ["admin", "contact-messages", msgPage],
    queryFn: () => apiClient.get(`/admin/contact-messages?page=${msgPage}`),
    enabled: activeTab === "messages",
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/admin/contact-messages/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "contact-messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const tabs = [
    { id: "store" as const, label: "Store Info", icon: Store },
    { id: "checkout" as const, label: "Checkout", icon: ShoppingCart },
    { id: "messages" as const, label: "Messages", icon: MessageSquare },
    { id: "pos" as const, label: "POS Integration", icon: Wifi },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-lg font-semibold text-gray-900">Settings</h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition flex-1 justify-center ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Store Info Tab */}
      {activeTab === "store" && (
        <div className="space-y-6">
          {settingsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : (
            <>
              {/* Basic Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Store size={18} /> Store Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                    <input
                      value={storeForm.store_name}
                      onChange={(e) => setStoreForm((f) => ({ ...f, store_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      value={storeForm.store_address}
                      onChange={(e) => setStoreForm((f) => ({ ...f, store_address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      value={storeForm.store_phone}
                      onChange={(e) => setStoreForm((f) => ({ ...f, store_phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      value={storeForm.store_email}
                      onChange={(e) => setStoreForm((f) => ({ ...f, store_email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Embed URL</label>
                  <input
                    value={storeForm.store_map_embed}
                    onChange={(e) => setStoreForm((f) => ({ ...f, store_map_embed: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="https://www.google.com/maps/embed?pb=..."
                  />
                </div>
              </div>

              {/* Store Hours */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Clock size={18} /> Store Hours
                </h3>
                <div className="space-y-3">
                  {hours.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-28 text-sm font-medium text-gray-700">{item.day}</span>
                      <input
                        value={item.time}
                        onChange={(e) => {
                          const updated = [...hours];
                          updated[idx] = { ...item, time: e.target.value };
                          setHours(updated);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        placeholder="e.g. 9:00am - 8:00pm, or Closed (leave blank to hide)"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Social Media Links</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                    <input
                      value={storeForm.social_facebook}
                      onChange={(e) => setStoreForm((f) => ({ ...f, social_facebook: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp URL</label>
                    <input
                      value={storeForm.social_whatsapp}
                      onChange={(e) => setStoreForm((f) => ({ ...f, social_whatsapp: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                    <input
                      value={storeForm.social_instagram}
                      onChange={(e) => setStoreForm((f) => ({ ...f, social_instagram: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveStore}
                disabled={saveSettingsMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
              >
                {saveSettingsMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Checkout Tab */}
      {activeTab === "checkout" && (
        <div className="space-y-6">
          {settingsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart size={18} /> Prices & delivery
                </h3>
                <p className="text-sm text-gray-500">These are applied to every order and shown to shoppers in the cart and at checkout.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(
                    [
                      ["tax_rate", "Sales tax (%)", "e.g. 6"],
                      ["delivery_fee", "Delivery fee ($)", "e.g. 5.99"],
                      ["free_delivery_threshold", "Free delivery from ($)", "e.g. 50"],
                    ] as const
                  ).map(([key, label, ph]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`s-${key}`}>
                        {label}
                      </label>
                      <input
                        id={`s-${key}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={checkout[key]}
                        placeholder={ph}
                        onChange={(e) => setCheckout((c) => ({ ...c, [key]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-2 pt-2">
                  {(
                    [
                      ["delivery_enabled", "Offer home delivery"],
                      ["pickup_enabled", "Offer in-store pickup"],
                      ["pay_on_delivery_enabled", "Allow paying on delivery / at pickup"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={checkout[key] === "true"}
                        onChange={(e) => setCheckout((c) => ({ ...c, [key]: e.target.checked ? "true" : "false" }))}
                        className="w-4 h-4 rounded border-gray-300 text-green-500"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="text-sm rounded-lg px-3 py-2 bg-gray-50 text-gray-600 flex items-center gap-2">
                  {settings?.data?.online_payments_enabled === "true" ? (
                    <>
                      <CheckCircle size={16} className="text-green-500" /> Online card payments (Stripe) are enabled.
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="text-gray-400" /> Online card payments are off. Set STRIPE_SECRET_KEY and
                      STRIPE_PUBLISHABLE_KEY on the API server to turn them on.
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={handleSaveCheckout}
                disabled={saveSettingsMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
              >
                {saveSettingsMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saveSettingsMutation.isPending ? "Saving..." : "Save Checkout Settings"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Mail size={18} /> Contact Messages
            </h3>
          </div>
          {messagesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-green-500" />
            </div>
          ) : !messagesData?.data?.messages?.length ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
              No messages yet
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {messagesData.data.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`px-6 py-4 ${!msg.isRead ? "bg-green-50/50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">{msg.name}</span>
                          {!msg.isRead && (
                            <span className="text-[10px] bg-green-500 text-white rounded-full px-2 py-0.5">New</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-1">
                          {msg.email} {msg.phone && `· ${formatPhone(msg.phone)}`}
                        </p>
                        {msg.subject && (
                          <p className="text-sm font-medium text-gray-700 mb-1">{msg.subject}</p>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!msg.isRead && (
                        <button
                          onClick={() => markReadMutation.mutate(msg.id)}
                          className="shrink-0 text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                        >
                          <Eye size={14} /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {messagesData.data.pagination.totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Page {messagesData.data.pagination.page} of {messagesData.data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={msgPage <= 1}
                      onClick={() => setMsgPage((p) => p - 1)}
                      className="px-3 py-1 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={msgPage >= messagesData.data.pagination.totalPages}
                      onClick={() => setMsgPage((p) => p + 1)}
                      className="px-3 py-1 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* POS Tab */}
      {activeTab === "pos" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Wifi size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Square POS Integration</h3>
                <p className="text-sm text-gray-500">Sync products, inventory & prices with Square POS</p>
              </div>
            </div>

            {posLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-green-500" />
              </div>
            ) : posData ? (
              <div className="space-y-4">
                {/* Connection Status */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  {posData.squareConfigured ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <XCircle size={18} className="text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {posData.squareConfigured ? "Connected" : "Not Connected"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {posData.squareConfigured
                        ? `Location: ${posData.locationId || "Default"}`
                        : "Set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID in environment variables"}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500">Last Sync</p>
                    <p className="text-sm font-medium text-gray-900">
                      {posData.lastSyncAt ? new Date(posData.lastSyncAt).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500">Total Syncs</p>
                    <p className="text-sm font-medium text-gray-900">{posData.totalPosSyncs}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500">Linked Products</p>
                    <p className="text-sm font-medium text-gray-900">
                      <Link2 size={14} className="inline mr-1 text-blue-500" />
                      {posData.linkedProducts} / {posData.totalProducts}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500">Unlinked</p>
                    <p className="text-sm font-medium text-gray-900">
                      {posData.totalProducts - posData.linkedProducts} products
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Actions */}
          {posData?.squareConfigured && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Sync Actions</h3>

              {/* Import Catalog from Square */}
              <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Download size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">Import from Square</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Fetch all products, categories & prices from your Square POS catalog.
                    Creates new products or updates existing ones matched by SKU.
                  </p>
                  <button
                    onClick={() => { setImporting(true); importMutation.mutate(); }}
                    disabled={importing}
                    className="mt-2 flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {importing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    {importing ? "Importing..." : "Import Catalog"}
                  </button>
                </div>
              </div>

              {/* Sync Inventory */}
              <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-green-200 transition">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <RefreshCw size={18} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">Sync Inventory</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Pull latest stock quantities from Square POS for all linked products.
                  </p>
                  <button
                    onClick={() => { setSyncing(true); syncMutation.mutate(); }}
                    disabled={syncing}
                    className="mt-2 flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                    {syncing ? "Syncing..." : "Sync Inventory"}
                  </button>
                </div>
              </div>

              {/* Push Prices to Square */}
              <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-orange-200 transition">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <Upload size={18} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">Push Prices to Square</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Update all linked product prices on Square POS to match your system.
                    Individual prices auto-sync when you edit a product.
                  </p>
                  <button
                    onClick={() => { setPushingPrices(true); pushPricesMutation.mutate(); }}
                    disabled={pushingPrices}
                    className="mt-2 flex items-center gap-2 px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {pushingPrices ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {pushingPrices ? "Pushing..." : "Push All Prices"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Webhook Info */}
          {posData?.squareConfigured && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Webhook Endpoints</h3>
              <p className="text-xs text-gray-500 mb-3">
                Configure these URLs in your Square Developer Dashboard for real-time sync:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-[10px] font-mono bg-green-100 text-green-700 px-1.5 py-0.5 rounded">POST</span>
                  <code className="text-xs text-gray-700 flex-1">/api/pos/webhooks/inventory</code>
                  <span className="text-[10px] text-gray-400">Inventory changes</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">POST</span>
                  <code className="text-xs text-gray-700 flex-1">/api/pos/webhooks/catalog</code>
                  <span className="text-[10px] text-gray-400">Price changes</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
