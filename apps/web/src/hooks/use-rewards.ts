import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "../lib/api-client";
import { useAuthStore } from "../stores/auth-store";

interface RewardAccount {
  totalPoints: number;
  availablePoints: number;
  tier: string;
  lifetimeSpend: number;
  pointsMultiplier: number;
  nextTier: { tier: string; amountNeeded: number } | null;
  redemptionValue: number;
  canRedeem: boolean;
  minRedeemPoints: number;
}

interface RewardTransaction {
  id: string;
  type: string;
  points: number;
  description?: string;
  createdAt: string;
}

interface TierInfo {
  tier: string;
  minSpend: number;
  multiplier: number;
  perks: string[];
}

interface ReferralEntry {
  id: string;
  refereeName: string;
  isCompleted: boolean;
  bonusEarned: number;
  createdAt: string;
  completedAt?: string;
}

interface ReferralInfo {
  referralCode: string;
  totalReferrals: number;
  completedReferrals: number;
  totalBonusEarned: number;
  referrals: ReferralEntry[];
  rewards: {
    referrerBonus: number;
    refereeBonus: number;
    description: string;
  };
}

export function useRewardAccount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["rewards"],
    queryFn: () =>
      apiClient.get<{ success: boolean; data: RewardAccount }>("/rewards"),
    enabled: isAuthenticated,
    select: (res) => res.data,
  });
}

export function useRewardHistory(page = 1) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["rewards", "history", page],
    queryFn: () =>
      apiClient.get<{
        success: boolean;
        data: {
          transactions: RewardTransaction[];
          pagination: { page: number; limit: number; total: number; totalPages: number };
        };
      }>(`/rewards/history?page=${page}&limit=20`),
    enabled: isAuthenticated,
    select: (res) => res.data,
  });
}

export function useRewardTiers() {
  return useQuery({
    queryKey: ["rewards", "tiers"],
    queryFn: () =>
      apiClient.get<{ success: boolean; data: TierInfo[] }>("/rewards/tiers"),
    select: (res) => res.data,
    staleTime: 60 * 60 * 1000, // tiers don't change often
  });
}

export function useReferralInfo() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["rewards", "referral"],
    queryFn: () =>
      apiClient.get<{ success: boolean; data: ReferralInfo }>("/rewards/referral"),
    enabled: isAuthenticated,
    select: (res) => res.data,
  });
}

export function useApplyReferral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) =>
      apiClient.post("/rewards/apply-referral", { code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast.success("Referral code applied! You earned 100 points.");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to apply referral code");
    },
  });
}
