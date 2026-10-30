import { useState } from "react";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  Mail,
  Phone,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAdminCustomers, useAdminCustomer, useUpdateCustomer } from "../hooks/use-admin";
import Modal from "../components/Modal";
import { money, errorMessage, formatPhone } from "../lib/utils";

export default function Customers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError, error } = useAdminCustomers(page, search || undefined);
  const [openId, setOpenId] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Customers</h2>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
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
        ) : isError ? (
          <p className="px-4 py-12 text-center text-red-600 text-sm">{errorMessage(error, "Couldn't load customers")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Orders
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.customers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => setOpenId(customer.id)}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-semibold shrink-0">
                          {customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">
                          {customer.name}
                        </span>
                        {!customer.isActive && (
                          <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Blocked</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Mail size={13} className="text-gray-400" />
                        {customer.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {customer.phone ? (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone size={13} className="text-gray-400" />
                          {formatPhone(customer.phone)}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1 text-gray-700">
                        <ShoppingCart size={13} className="text-gray-400" />
                        {customer.orderCount}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(customer.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </td>
                  </tr>
                ))}
                {data?.customers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      <Users
                        size={24}
                        className="mx-auto text-gray-300 mb-2"
                      />
                      No customers found
                    </td>
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
              {Math.min(
                data.pagination.page * data.pagination.limit,
                data.pagination.total
              )}{" "}
              of {data.pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-700 px-2">
                {page} / {data.pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                }
                disabled={page === data.pagination.totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      {openId && <CustomerModal id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function CustomerModal({ id, onClose }: { id: string; onClose: () => void }) {
  const navigate = useNavigate();
  const { data: c, isLoading, isError, error } = useAdminCustomer(id);
  const update = useUpdateCustomer();

  return (
    <Modal title={c ? c.name : "Customer"} onClose={onClose}>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        </div>
      ) : isError || !c ? (
        <p className="text-sm text-red-600 py-6 text-center">{errorMessage(error, "Couldn't load customer")}</p>
      ) : (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-gray-900 break-all">{c.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-gray-900">{formatPhone(c.phone) || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total spent</p>
              <p className="text-gray-900 font-medium">{money(c.totalSpent)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Rewards</p>
              <p className="text-gray-900">{c.rewards ? `${c.rewards.tier} · ${c.rewards.availablePoints} pts` : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Joined</p>
              <p className="text-gray-900">{new Date(c.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last sign-in</p>
              <p className="text-gray-900">{c.lastLoginAt ? new Date(c.lastLoginAt).toLocaleString() : "-"}</p>
            </div>
          </div>

          {c.addresses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Addresses</p>
              {c.addresses.map((a) => (
                <p key={a.id} className="text-gray-700">
                  {a.label ? `${a.label}: ` : ""}
                  {a.addressLine1}, {a.city}, {a.state} {a.zipCode} {a.isDefault ? "(default)" : ""}
                </p>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Recent orders</p>
            {c.orders.length ? (
              <div className="border border-gray-100 rounded-lg divide-y divide-gray-50">
                {c.orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => navigate(`/orders?order=${o.id}`)}
                    className="w-full flex justify-between px-3 py-2 hover:bg-gray-50 text-left"
                  >
                    <span>
                      #{o.orderNumber} <span className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span className="text-gray-600">
                      {o.status.replace(/_/g, " ").toLowerCase()} · {money(o.totalAmount)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No orders yet</p>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {c.isActive ? "Blocking signs them out and stops them signing in." : "This customer can't sign in."}
            </p>
            <button
              onClick={() => {
                if (c.isActive && !confirm(`Block ${c.name}? They'll be signed out and can't sign in.`)) return;
                update.mutate(
                  { id: c.id, isActive: !c.isActive },
                  {
                    onSuccess: () => toast.success(c.isActive ? "Customer blocked" : "Customer unblocked"),
                    onError: (err) => toast.error(errorMessage(err)),
                  }
                );
              }}
              disabled={update.isPending}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${c.isActive ? "text-red-600 hover:bg-red-50" : "bg-green-500 text-white hover:bg-green-600"}`}
            >
              {c.isActive ? "Block customer" : "Unblock"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
