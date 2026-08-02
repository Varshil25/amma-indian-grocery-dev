import prisma from "../config/database.js";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler.js";

const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 1500,
  PLATINUM: 5000,
} as const;

const TIER_MULTIPLIERS = {
  BRONZE: 1,
  SILVER: 1.25,
  GOLD: 1.5,
  PLATINUM: 2,
} as const;

const TIER_PERKS: Record<string, string[]> = {
  BRONZE: ["Earn 1 point per $1 spent", "Basic member benefits"],
  SILVER: ["Earn 1.25x points", "Free delivery over $30"],
  GOLD: ["Earn 1.5x points", "Free delivery over $20", "Early access to deals"],
  PLATINUM: ["Earn 2x points", "Always free delivery", "Exclusive offers", "Priority support"],
};

const POINTS_PER_DOLLAR = 100; // 100 pts = $1 redemption
const MIN_REDEEM = 500;

export class RewardService {
  async getAccount(userId: string) {
    let account = await prisma.rewardAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      account = await prisma.rewardAccount.create({
        data: { userId },
      });
    }

    const tier = account.tier as keyof typeof TIER_MULTIPLIERS;

    return {
      totalPoints: account.totalPoints,
      availablePoints: account.availablePoints,
      tier: account.tier,
      lifetimeSpend: Number(account.lifetimeSpend),
      pointsMultiplier: TIER_MULTIPLIERS[tier] || 1,
      nextTier: this.getNextTier(account.tier, Number(account.lifetimeSpend)),
      redemptionValue: parseFloat(
        (account.availablePoints / POINTS_PER_DOLLAR).toFixed(2)
      ),
      canRedeem: account.availablePoints >= MIN_REDEEM,
      minRedeemPoints: MIN_REDEEM,
    };
  }

  async getHistory(userId: string, page: number, limit: number) {
    const account = await prisma.rewardAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      return { transactions: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    const [transactions, total] = await Promise.all([
      prisma.rewardTransaction.findMany({
        where: { rewardAccountId: account.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rewardTransaction.count({
        where: { rewardAccountId: account.id },
      }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        points: t.points,
        description: t.description,
        createdAt: t.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTiers() {
    return Object.entries(TIER_THRESHOLDS).map(([tier, threshold]) => ({
      tier,
      minSpend: threshold,
      multiplier: TIER_MULTIPLIERS[tier as keyof typeof TIER_MULTIPLIERS],
      perks: TIER_PERKS[tier],
    }));
  }

  async getReferralInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user) throw new NotFoundError("User not found");

    // Generate referral code if not exists
    if (!user.referralCode) {
      const code = this.generateReferralCode();
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
      });
      user.referralCode = code;
    }

    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referee: {
          select: { firstName: true, lastName: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      referralCode: user.referralCode,
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter((r) => r.isCompleted).length,
      totalBonusEarned: referrals.reduce((sum, r) => sum + r.referrerBonus, 0),
      referrals: referrals.map((r) => ({
        id: r.id,
        refereeName: `${r.referee.firstName} ${r.referee.lastName?.charAt(0) || ""}.`,
        isCompleted: r.isCompleted,
        bonusEarned: r.referrerBonus,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
      })),
      rewards: {
        referrerBonus: 200,
        refereeBonus: 100,
        description:
          "Share your code! Your friend gets 100 points on signup, you earn 200 points when they make their first purchase.",
      },
    };
  }

  async applyReferralCode(userId: string, code: string) {
    // Find the referrer by code
    const referrer = await prisma.user.findFirst({
      where: { referralCode: code },
    });

    if (!referrer) {
      throw new BadRequestError("Invalid referral code");
    }

    if (referrer.id === userId) {
      throw new BadRequestError("You cannot use your own referral code");
    }

    // Check if this user already has a referral
    const existingReferral = await prisma.referral.findFirst({
      where: { refereeId: userId },
    });

    if (existingReferral) {
      throw new BadRequestError("You have already used a referral code");
    }

    // Create referral record
    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId: userId,
        referralCode: code,
        refereeBonus: 100,
      },
    });

    // Give referee 100 points immediately
    let account = await prisma.rewardAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      account = await prisma.rewardAccount.create({
        data: { userId },
      });
    }

    await prisma.rewardAccount.update({
      where: { userId },
      data: {
        totalPoints: { increment: 100 },
        availablePoints: { increment: 100 },
      },
    });

    await prisma.rewardTransaction.create({
      data: {
        rewardAccountId: account.id,
        type: "EARN_REFERRAL",
        points: 100,
        description: "Referral signup bonus",
      },
    });

    return { message: "Referral code applied! You earned 100 points." };
  }

  private getNextTier(
    currentTier: string,
    lifetimeSpend: number
  ): { tier: string; amountNeeded: number } | null {
    const tiers = Object.entries(TIER_THRESHOLDS);
    const currentIdx = tiers.findIndex(([t]) => t === currentTier);

    if (currentIdx >= tiers.length - 1) return null; // Already at top tier

    const [nextTierName, nextThreshold] = tiers[currentIdx + 1];
    return {
      tier: nextTierName,
      amountNeeded: parseFloat((nextThreshold - lifetimeSpend).toFixed(2)),
    };
  }

  private generateReferralCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "AMG";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export const rewardService = new RewardService();
