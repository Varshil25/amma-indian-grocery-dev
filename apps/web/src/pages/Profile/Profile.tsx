import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  MapPin,
  Lock,
  Gift,
  Copy,
  Check,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { useAuthStore } from "../../stores/auth-store";
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useAddresses,
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
} from "../../hooks/use-user";
import { PHONE_HINT, formatUSPhone, isValidOptionalPhone } from "../../lib/phone";

// Same rules as the API (apps/api/src/validators/user.validator.ts)
const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50, "First name must be 50 characters or fewer"),
  lastName: z.string().trim().min(1, "Last name is required").max(50, "Last name must be 50 characters or fewer"),
  phone: z.string().optional().refine(isValidOptionalPhone, PHONE_HINT),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const addressSchema = z.object({
  label: z.string().min(1, "Label is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "Valid zip code required"),
  isDefault: z.boolean().optional(),
});

type Tab = "profile" | "addresses" | "password" | "rewards";

export default function Profile() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Profile", icon: <User size={18} /> },
    { key: "addresses", label: "Addresses", icon: <MapPin size={18} /> },
    { key: "password", label: "Password", icon: <Lock size={18} /> },
    { key: "rewards", label: "Rewards", icon: <Gift size={18} /> },
  ];

  return (
    <>
      <PageHeader
        title="My Account"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "My Account" }]}
      />
      <section className="section-padding">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Sidebar: 2×2 on phones, one row on tablets, a column on desktop */}
            <div className="lg:w-64 shrink-0">
              <nav aria-label="Account sections" className="card p-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    aria-current={activeTab === tab.key ? "page" : undefined}
                    className={`flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-3 lg:px-4 py-3 min-h-[44px] rounded-lg text-body-sm sm:text-body-md font-medium transition-colors w-full text-left ${
                      activeTab === tab.key
                        ? "bg-green-50 text-green-700"
                        : "text-text-300 hover:bg-background-secondary hover:text-text-500"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {activeTab === "profile" && <ProfileTab />}
              {activeTab === "addresses" && <AddressesTab />}
              {activeTab === "password" && <PasswordTab />}
              {activeTab === "rewards" && <RewardsTab />}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ProfileTab() {
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: formatUSPhone(profile.phone),
        }
      : undefined,
  });

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="card p-4 sm:p-6">
      <h2 className="text-h6 font-semibold text-text-500 mb-6">
        Personal Information
      </h2>
      <form
        onSubmit={handleSubmit((data) => updateMutation.mutate({ ...data, phone: data.phone?.trim() ?? "" }))}
        noValidate
        className="space-y-5 max-w-lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label" htmlFor="profile-firstName">First Name</label>
            <input
              id="profile-firstName"
              autoComplete="given-name"
              className={`input ${errors.firstName ? "border-red-400" : ""}`}
              {...register("firstName")}
            />
            {errors.firstName && (
              <p className="text-red-500 text-body-sm mt-1">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label className="input-label" htmlFor="profile-lastName">Last Name</label>
            <input
              id="profile-lastName"
              autoComplete="family-name"
              className={`input ${errors.lastName ? "border-red-400" : ""}`}
              {...register("lastName")}
            />
            {errors.lastName && (
              <p className="text-red-500 text-body-sm mt-1">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="input-label">Email</label>
          <input
            className="input bg-background-secondary cursor-not-allowed"
            value={profile?.email || ""}
            disabled
          />
          <p className="text-body-sm text-text-200 mt-1">
            Email cannot be changed
          </p>
        </div>

        <div>
          <label className="input-label" htmlFor="profile-phone">Phone</label>
          <input
            id="profile-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            className={`input ${errors.phone ? "border-red-400" : ""}`}
            placeholder="(610) 555-0123"
            {...register("phone")}
          />
          {errors.phone ? (
            <p className="text-red-500 text-body-sm mt-1">{errors.phone.message as string}</p>
          ) : (
            <p className="text-body-sm text-text-200 mt-1">US numbers only. Leave blank to remove it.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isDirty || updateMutation.isPending}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

function AddressesTab() {
  const { data: addresses, isLoading } = useAddresses();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const addMutation = useAddAddress();
  const updateMutation = useUpdateAddress();
  const deleteMutation = useDeleteAddress();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
  });

  const openAdd = () => {
    setEditingId(null);
    reset({
      label: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      isDefault: false,
    });
    setShowForm(true);
  };

  const openEdit = (addr: any) => {
    setEditingId(addr.id);
    reset(addr);
    setShowForm(true);
  };

  const onSubmit = (data: any) => {
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, ...data },
        { onSuccess: () => setShowForm(false) }
      );
    } else {
      addMutation.mutate(data, { onSuccess: () => setShowForm(false) });
    }
  };

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h6 font-semibold text-text-500">
          Saved Addresses
        </h2>
        {!showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-body-sm"
          >
            <Plus size={16} />
            Add Address
          </button>
        )}
      </div>

      {showForm && (
        <div className="card p-4 sm:p-6">
          <h3 className="text-body-lg font-semibold text-text-500 mb-4">
            {editingId ? "Edit Address" : "New Address"}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="input-label">Label</label>
              <input
                className={`input ${errors.label ? "border-red-400" : ""}`}
                placeholder="e.g. Home, Work, Parents"
                {...register("label")}
              />
            </div>
            <div>
              <label className="input-label">Address Line 1</label>
              <input
                className={`input ${errors.addressLine1 ? "border-red-400" : ""}`}
                placeholder="Street address"
                {...register("addressLine1")}
              />
            </div>
            <div>
              <label className="input-label">
                Address Line 2{" "}
                <span className="text-text-200 font-normal">(optional)</span>
              </label>
              <input
                className="input"
                placeholder="Apt, suite, unit"
                {...register("addressLine2")}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="input-label">City</label>
                <input
                  className={`input ${errors.city ? "border-red-400" : ""}`}
                  {...register("city")}
                />
              </div>
              <div>
                <label className="input-label">State</label>
                <input
                  placeholder="PA"
                  maxLength={2}
                  className={`input uppercase ${errors.state ? "border-red-400" : ""}`}
                  {...register("state")}
                />
              </div>
              <div>
                <label className="input-label">Zip Code</label>
                <input
                  className={`input ${errors.zipCode ? "border-red-400" : ""}`}
                  {...register("zipCode")}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-text-100 text-green-500 focus:ring-green-500"
                {...register("isDefault")}
              />
              <span className="text-body-sm text-text-300">
                Set as default address
              </span>
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={addMutation.isPending || updateMutation.isPending}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-60"
              >
                {editingId ? "Update" : "Save"} Address
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-background-secondary hover:bg-text-50 text-text-400 font-medium py-2.5 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!addresses?.length && !showForm ? (
        <div className="card p-5 sm:p-8 text-center">
          <MapPin className="mx-auto text-text-100 mb-3" size={40} />
          <p className="text-text-300 text-body-md">
            No saved addresses yet. Add one for faster checkout!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses?.map((addr: any) => (
            <div key={addr.id} className="card p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-text-500">
                    {addr.label}
                  </span>
                  {addr.isDefault && (
                    <span className="badge-green text-body-xs">Default</span>
                  )}
                </div>
                <p className="text-body-md text-text-300">
                  {addr.addressLine1}
                  {addr.addressLine2 && `, ${addr.addressLine2}`}
                </p>
                <p className="text-body-md text-text-300">
                  {addr.city}, {addr.state} {addr.zipCode}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(addr)}
                  className="p-2 text-text-200 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(addr.id)}
                  className="p-2 text-text-200 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PasswordTab() {
  const mutation = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = (data: any) => {
    mutation.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      { onSuccess: () => reset() }
    );
  };

  return (
    <div className="card p-4 sm:p-6">
      <h2 className="text-h6 font-semibold text-text-500 mb-6">
        Change Password
      </h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 max-w-lg"
      >
        <div>
          <label className="input-label">Current Password</label>
          <input
            type="password"
            className={`input ${errors.currentPassword ? "border-red-400" : ""}`}
            {...register("currentPassword")}
          />
          {errors.currentPassword && (
            <p className="text-red-500 text-body-sm mt-1">
              {String(errors.currentPassword.message)}
            </p>
          )}
        </div>
        <div>
          <label className="input-label">New Password</label>
          <input
            type="password"
            className={`input ${errors.newPassword ? "border-red-400" : ""}`}
            placeholder="Minimum 8 characters"
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="text-red-500 text-body-sm mt-1">
              {String(errors.newPassword.message)}
            </p>
          )}
        </div>
        <div>
          <label className="input-label">Confirm New Password</label>
          <input
            type="password"
            className={`input ${errors.confirmPassword ? "border-red-400" : ""}`}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-body-sm mt-1">
              {String(errors.confirmPassword.message)}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-60"
        >
          {mutation.isPending ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}

function RewardsTab() {
  const { data: profile, isLoading } = useProfile();
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) return <ProfileSkeleton />;

  const rewards = profile?.rewards;
  const tierColors: Record<string, string> = {
    BRONZE: "bg-amber-100 text-amber-800",
    SILVER: "bg-gray-100 text-gray-700",
    GOLD: "bg-yellow-100 text-yellow-800",
    PLATINUM: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="space-y-6">
      {/* Points Overview */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-h6 font-semibold text-text-500 mb-6">
          Rewards Dashboard
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-xl p-5 text-center">
            <p className="text-body-sm text-green-700 mb-1">Available Points</p>
            <p className="text-h4 font-bold text-green-600">
              {rewards?.availablePoints || 0}
            </p>
          </div>
          <div className="bg-background-secondary rounded-xl p-5 text-center">
            <p className="text-body-sm text-text-300 mb-1">Total Earned</p>
            <p className="text-h4 font-bold text-text-500">
              {rewards?.totalPoints || 0}
            </p>
          </div>
          <div className="bg-background-secondary rounded-xl p-5 text-center">
            <p className="text-body-sm text-text-300 mb-1">Current Tier</p>
            <span
              className={`inline-block mt-2 px-4 py-1.5 rounded-full text-body-sm font-semibold ${
                tierColors[rewards?.tier || "BRONZE"] || tierColors.BRONZE
              }`}
            >
              {rewards?.tier || "BRONZE"}
            </span>
          </div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="card p-4 sm:p-6">
        <h3 className="text-body-lg font-semibold text-text-500 mb-2">
          Refer a Friend
        </h3>
        <p className="text-body-md text-text-300 mb-4">
          Share your referral code. Your friend gets 100 points on signup, and
          you get 200 points when they make their first purchase!
        </p>
        <div className="flex items-center gap-3">
          <div className="bg-background-secondary rounded-lg px-5 py-3 font-mono text-body-lg text-text-500 tracking-wider">
            {user?.referralCode || "—"}
          </div>
          <button
            onClick={copyReferralCode}
            className="p-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
      </div>

      {/* Tier Info */}
      <div className="card p-4 sm:p-6">
        <h3 className="text-body-lg font-semibold text-text-500 mb-4">
          Tier Benefits
        </h3>
        <div className="space-y-3">
          {[
            { tier: "Bronze", spend: "$0+", multiplier: "1x", perk: "Base benefits" },
            { tier: "Silver", spend: "$500+", multiplier: "1.25x", perk: "Free delivery over $30" },
            { tier: "Gold", spend: "$1,500+", multiplier: "1.5x", perk: "Free delivery over $20, early deal access" },
            { tier: "Platinum", spend: "$5,000+", multiplier: "2x", perk: "Always free delivery, exclusive offers" },
          ].map((t) => (
            <div
              key={t.tier}
              className={`flex items-center justify-between p-3 rounded-lg ${
                rewards?.tier === t.tier.toUpperCase()
                  ? "bg-green-50 border border-green-200"
                  : "bg-background-secondary"
              }`}
            >
              <div>
                <span className="font-semibold text-text-500">{t.tier}</span>
                <span className="text-body-sm text-text-200 ml-2">
                  ({t.spend})
                </span>
              </div>
              <div className="text-right">
                <span className="text-body-sm font-medium text-green-600">
                  {t.multiplier} points
                </span>
                <p className="text-body-xs text-text-200">{t.perk}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="card p-4 sm:p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-background-secondary rounded w-48" />
      <div className="h-10 bg-background-secondary rounded w-full max-w-lg" />
      <div className="h-10 bg-background-secondary rounded w-full max-w-lg" />
      <div className="h-10 bg-background-secondary rounded w-64" />
    </div>
  );
}
