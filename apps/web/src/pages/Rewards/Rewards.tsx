import { useState } from "react";
import {
  Star,
  Gift,
  TrendingUp,
  Copy,
  Check,
  ChevronRight,
  Award,
  Users,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  Share2,
} from "lucide-react";
import { FaWhatsapp, FaFacebookF } from "react-icons/fa";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import {
  useRewardAccount,
  useRewardHistory,
  useRewardTiers,
  useReferralInfo,
} from "../../hooks/use-rewards";

const TIER_COLORS: Record<string, { bg: string; text: string; ring: string; icon: string }> = {
  BRONZE: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-300", icon: "text-amber-500" },
  SILVER: { bg: "bg-gray-50", text: "text-gray-600", ring: "ring-gray-300", icon: "text-gray-400" },
  GOLD: { bg: "bg-yellow-50", text: "text-yellow-700", ring: "ring-yellow-400", icon: "text-yellow-500" },
  PLATINUM: { bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-400", icon: "text-purple-500" },
};

const TX_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  EARN_PURCHASE: { label: "Purchase", color: "text-green-600" },
  EARN_REFERRAL: { label: "Referral", color: "text-blue-600" },
  EARN_SIGNUP: { label: "Signup Bonus", color: "text-purple-600" },
  EARN_REVIEW: { label: "Review", color: "text-teal-600" },
  REDEEM: { label: "Redeemed", color: "text-orange-600" },
  EXPIRE: { label: "Expired", color: "text-red-600" },
  ADJUSTMENT: { label: "Adjustment", color: "text-gray-600" },
};

type Tab = "overview" | "history" | "tiers" | "referrals";

export default function Rewards() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [historyPage, setHistoryPage] = useState(1);
  const [copied, setCopied] = useState(false);

  const { data: account, isLoading: accountLoading } = useRewardAccount();
  const { data: history, isLoading: historyLoading } = useRewardHistory(historyPage);
  const { data: tiers } = useRewardTiers();
  const { data: referral, isLoading: referralLoading } = useReferralInfo();

  const copyReferralCode = () => {
    if (!referral?.referralCode) return;
    navigator.clipboard.writeText(referral.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const siteUrl = window.location.origin;

  const getShareMessage = (code: string) =>
    `Shop at Amma Indian Grocery and get 100 reward points! Use my referral code: ${code}\nSign up here: ${siteUrl}`;

  const shareViaWhatsApp = (code: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(getShareMessage(code))}`, "_blank");
  };

  const shareViaFacebook = (code: string) => {
    window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(getShareMessage(code))}&u=${encodeURIComponent(siteUrl)}`, "_blank");
  };

  const shareViaEmail = (code: string) => {
    const subject = "Join Amma Indian Grocery & get 100 reward points!";
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(getShareMessage(code))}`, "_self");
  };

  const shareNative = async (code: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Amma Indian Grocery - Referral",
          text: getShareMessage(code),
          url: siteUrl,
        });
      } catch { /* user cancelled */ }
    }
  };

  const ShareButtons = ({ code }: { code: string }) => (
    <div className="flex items-center gap-2 mt-3">
      <span className="text-body-xs text-text-200 mr-1">Share via:</span>
      <button
        onClick={() => shareViaWhatsApp(code)}
        className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition"
        title="Share on WhatsApp"
      >
        <FaWhatsapp className="text-white w-4 h-4" />
      </button>
      <button
        onClick={() => shareViaFacebook(code)}
        className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition"
        title="Share on Facebook"
      >
        <FaFacebookF className="text-white w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => shareViaEmail(code)}
        className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center hover:bg-gray-700 transition"
        title="Share via Email"
      >
        <Mail size={16} className="text-white" />
      </button>
      {typeof navigator.share === "function" && (
        <button
          onClick={() => shareNative(code)}
          className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center hover:bg-purple-600 transition"
          title="Share"
        >
          <Share2 size={16} className="text-white" />
        </button>
      )}
    </div>
  );

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: Star },
    { key: "history", label: "History", icon: TrendingUp },
    { key: "tiers", label: "Tiers", icon: Award },
    { key: "referrals", label: "Referrals", icon: Users },
  ];

  const tierColors = TIER_COLORS[account?.tier || "BRONZE"];

  return (
    <>
      <PageHeader
        title="Rewards"
        breadcrumbs={[{ label: "Home", path: "/" }, { label: "Rewards" }]}
      />

      <div className="container mx-auto px-6 py-10">
        {/* Tabs */}
        <div className="flex gap-1 bg-text-50 p-1 rounded-xl mb-8 max-w-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-body-sm font-medium transition ${
                  activeTab === tab.key
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-text-300 hover:text-text-500"
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {accountLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              </div>
            ) : account ? (
              <>
                {/* Points + Tier Card */}
                <div className={`card p-8 ${tierColors.bg} border-none`}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-12 h-12 rounded-full ${tierColors.bg} ring-2 ${tierColors.ring} flex items-center justify-center`}>
                          <Award size={24} className={tierColors.icon} />
                        </div>
                        <div>
                          <p className={`text-body-xs font-semibold uppercase tracking-wider ${tierColors.text}`}>
                            {account.tier} Member
                          </p>
                          <p className="text-body-xs text-text-200">
                            {account.pointsMultiplier}x points multiplier
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-h2 font-bold text-text-500">
                          {account.availablePoints.toLocaleString()}
                        </p>
                        <p className="text-body-sm text-text-200">Available Points</p>
                      </div>
                      {account.canRedeem && (
                        <p className="text-body-sm text-green-600 mt-1">
                          Worth ${account.redemptionValue.toFixed(2)} in discounts
                        </p>
                      )}
                    </div>

                    {/* Next Tier Progress */}
                    {account.nextTier && (
                      <div className="md:text-right">
                        <p className="text-body-sm text-text-200 mb-2">
                          Next tier: <span className="font-medium text-text-500">{account.nextTier.tier}</span>
                        </p>
                        <div className="w-full md:w-48 bg-white/50 rounded-full h-2.5 mb-1">
                          <div
                            className="bg-green-500 h-2.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, ((account.lifetimeSpend) / (account.lifetimeSpend + account.nextTier.amountNeeded)) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-body-xs text-text-200">
                          Spend ${account.nextTier.amountNeeded.toFixed(0)} more to unlock
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="card p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                        <Star size={20} className="text-green-600" />
                      </div>
                      <span className="text-body-sm text-text-200">Total Earned</span>
                    </div>
                    <p className="text-h4 font-bold text-text-500">
                      {account.totalPoints.toLocaleString()}
                    </p>
                  </div>
                  <div className="card p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <TrendingUp size={20} className="text-blue-600" />
                      </div>
                      <span className="text-body-sm text-text-200">Lifetime Spend</span>
                    </div>
                    <p className="text-h4 font-bold text-text-500">
                      ${account.lifetimeSpend.toFixed(0)}
                    </p>
                  </div>
                  <div className="card p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Gift size={20} className="text-purple-600" />
                      </div>
                      <span className="text-body-sm text-text-200">Redemption Value</span>
                    </div>
                    <p className="text-h4 font-bold text-text-500">
                      ${account.redemptionValue.toFixed(2)}
                    </p>
                    <p className="text-body-xs text-text-100 mt-0.5">
                      Min {account.minRedeemPoints} pts to redeem
                    </p>
                  </div>
                </div>

                {/* How to Earn */}
                <div className="card p-6">
                  <h3 className="text-h6 font-semibold text-text-500 mb-4">Ways to Earn Points</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Every $1 spent", points: `${account.pointsMultiplier} pt`, icon: "🛒" },
                      { label: "Sign up bonus", points: "50 pts", icon: "🎉" },
                      { label: "First purchase", points: "100 pts", icon: "⭐" },
                      { label: "Write a review", points: "25 pts", icon: "✍️" },
                      { label: "Refer a friend", points: "200 pts", icon: "👥" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-background-secondary">
                        <span className="text-xl">{item.icon}</span>
                        <div className="flex-1">
                          <p className="text-body-sm text-text-500">{item.label}</p>
                        </div>
                        <span className="text-body-sm font-semibold text-green-600">{item.points}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Referral Quick Card */}
                {referral && (
                  <div className="card p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-h6 font-semibold text-text-500 mb-1">
                          Share & Earn
                        </h3>
                        <p className="text-body-sm text-text-200">
                          Give friends 100 pts, earn 200 pts when they buy!
                        </p>
                      </div>
                      <div>
                        <button
                          onClick={copyReferralCode}
                          className="flex items-center gap-2 bg-white px-5 py-3 rounded-lg border border-green-200 hover:border-green-400 transition font-mono text-body-md font-semibold text-green-700"
                        >
                          {referral.referralCode}
                          {copied ? (
                            <Check size={18} className="text-green-500" />
                          ) : (
                            <Copy size={18} className="text-text-200" />
                          )}
                        </button>
                        <ShareButtons code={referral.referralCode} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div>
            {historyLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              </div>
            ) : !history?.transactions.length ? (
              <div className="text-center py-20">
                <TrendingUp size={48} className="mx-auto text-text-100 mb-4" />
                <p className="text-text-300 text-body-lg mb-2">No transactions yet</p>
                <p className="text-text-200 text-body-sm">
                  Start shopping to earn reward points!
                </p>
              </div>
            ) : (
              <>
                <div className="card divide-y divide-text-50">
                  {history.transactions.map((tx) => {
                    const config = TX_TYPE_CONFIG[tx.type] || TX_TYPE_CONFIG.ADJUSTMENT;
                    const isPositive = tx.points > 0;
                    return (
                      <div key={tx.id} className="flex items-center gap-4 px-5 py-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isPositive ? "bg-green-50" : "bg-red-50"
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight size={20} className="text-green-600" />
                          ) : (
                            <ArrowDownRight size={20} className="text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm font-medium text-text-500">
                            {tx.description || config.label}
                          </p>
                          <p className="text-body-xs text-text-200">
                            {new Date(tx.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <span
                          className={`text-body-md font-semibold ${
                            isPositive ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {tx.points.toLocaleString()} pts
                        </span>
                      </div>
                    );
                  })}
                </div>

                {history.pagination.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={history.pagination.page}
                      totalPages={history.pagination.totalPages}
                      onPageChange={setHistoryPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tiers Tab */}
        {activeTab === "tiers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tiers?.map((tier) => {
              const colors = TIER_COLORS[tier.tier] || TIER_COLORS.BRONZE;
              const isCurrent = account?.tier === tier.tier;
              return (
                <div
                  key={tier.tier}
                  className={`card p-6 ${isCurrent ? `${colors.bg} ring-2 ${colors.ring}` : ""}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center`}>
                      <Award size={24} className={colors.icon} />
                    </div>
                    <div>
                      <h3 className={`text-h5 font-semibold ${colors.text}`}>
                        {tier.tier}
                      </h3>
                      {isCurrent && (
                        <span className="text-body-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-body-sm text-text-200">
                      Minimum spend: <span className="font-semibold text-text-500">${tier.minSpend}</span>
                    </p>
                    <p className="text-body-sm text-text-200">
                      Points multiplier: <span className="font-semibold text-green-600">{tier.multiplier}x</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    {tier.perks.map((perk, i) => (
                      <div key={i} className="flex items-center gap-2 text-body-sm text-text-300">
                        <ChevronRight size={14} className="text-green-500 shrink-0" />
                        {perk}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === "referrals" && (
          <div className="space-y-6">
            {referralLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              </div>
            ) : referral ? (
              <>
                {/* Referral Code Card */}
                <div className="card p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-100 text-center">
                  <Users size={40} className="mx-auto text-green-600 mb-3" />
                  <h3 className="text-h5 font-semibold text-text-500 mb-2">
                    Your Referral Code
                  </h3>
                  <p className="text-body-sm text-text-200 mb-4 max-w-md mx-auto">
                    {referral.rewards.description}
                  </p>
                  <button
                    onClick={copyReferralCode}
                    className="inline-flex items-center gap-3 bg-white px-8 py-4 rounded-xl border-2 border-green-200 hover:border-green-400 transition"
                  >
                    <span className="font-mono text-h4 font-bold text-green-700 tracking-wider">
                      {referral.referralCode}
                    </span>
                    {copied ? (
                      <Check size={22} className="text-green-500" />
                    ) : (
                      <Copy size={22} className="text-text-200" />
                    )}
                  </button>
                  {copied && (
                    <p className="text-body-xs text-green-600 mt-2">Copied to clipboard!</p>
                  )}
                  <div className="flex justify-center mt-4">
                    <ShareButtons code={referral.referralCode} />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="card p-5 text-center">
                    <p className="text-h3 font-bold text-text-500">
                      {referral.totalReferrals}
                    </p>
                    <p className="text-body-xs text-text-200">Total Referrals</p>
                  </div>
                  <div className="card p-5 text-center">
                    <p className="text-h3 font-bold text-green-600">
                      {referral.completedReferrals}
                    </p>
                    <p className="text-body-xs text-text-200">Completed</p>
                  </div>
                  <div className="card p-5 text-center">
                    <p className="text-h3 font-bold text-purple-600">
                      {referral.totalBonusEarned.toLocaleString()}
                    </p>
                    <p className="text-body-xs text-text-200">Points Earned</p>
                  </div>
                </div>

                {/* Referral History */}
                {referral.referrals.length > 0 ? (
                  <div className="card">
                    <h3 className="text-h6 font-semibold text-text-500 px-5 pt-5 pb-3">
                      Referral History
                    </h3>
                    <div className="divide-y divide-text-50">
                      {referral.referrals.map((r) => (
                        <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              r.isCompleted ? "bg-green-50" : "bg-yellow-50"
                            }`}
                          >
                            <Users
                              size={18}
                              className={r.isCompleted ? "text-green-600" : "text-yellow-600"}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-body-sm font-medium text-text-500">
                              {r.refereeName}
                            </p>
                            <p className="text-body-xs text-text-200">
                              Joined{" "}
                              {new Date(r.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-body-xs font-medium px-2 py-1 rounded-full ${
                                r.isCompleted
                                  ? "bg-green-50 text-green-600"
                                  : "bg-yellow-50 text-yellow-600"
                              }`}
                            >
                              {r.isCompleted ? "Completed" : "Pending"}
                            </span>
                            {r.bonusEarned > 0 && (
                              <p className="text-body-xs text-green-600 mt-0.5">
                                +{r.bonusEarned} pts
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="card p-8 text-center">
                    <p className="text-text-200 text-body-sm">
                      No referrals yet. Share your code to start earning!
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
