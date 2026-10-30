import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../config/database.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import {
  BadRequestError,
  ConflictError,
  EMAIL_TAKEN,
  NotFoundError,
  PHONE_TAKEN,
  UnauthorizedError,
} from "../middleware/errorHandler.js";
import type { JwtPayload } from "../middleware/auth.js";
import { emailService } from "./email.service.js";

const normalizeEmail = (email: string) => email.trim().toLowerCase();
// bcrypt hash of a random string; used so failed logins for unknown emails take as long as real ones
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), 12);
const findByEmail = (email: string) =>
  prisma.user.findFirst({ where: { email: { equals: normalizeEmail(email), mode: "insensitive" } } });

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string; // validated + normalized by registerSchema (+1XXXXXXXXXX)
    referralCode?: string; // trimmed + upper-cased by registerSchema
  }) {
    data = { ...data, email: normalizeEmail(data.email) };

    if (await findByEmail(data.email)) throw new ConflictError(EMAIL_TAKEN);
    if (data.phone && (await prisma.user.findFirst({ where: { phone: data.phone }, select: { id: true } }))) {
      throw new ConflictError(PHONE_TAKEN);
    }
    // A mistyped code would otherwise be ignored and the promised bonus silently lost
    const referrer = data.referralCode
      ? await prisma.user.findUnique({ where: { referralCode: data.referralCode } })
      : null;
    if (data.referralCode && !referrer) {
      throw new BadRequestError("That referral code isn't valid. Check it, or leave it blank.");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const userReferralCode = `AMMA-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // One transaction: a failure part-way can't leave an account without its rewards
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          referralCode: userReferralCode,
        },
      });

      const bonus = referrer ? 150 : 50; // welcome bonus + referee bonus
      const account = await tx.rewardAccount.create({
        data: { userId: created.id, totalPoints: bonus, availablePoints: bonus },
      });
      await tx.rewardTransaction.create({
        data: { rewardAccountId: account.id, type: "EARN_SIGNUP", points: 50, description: "Welcome bonus for signing up" },
      });

      if (referrer) {
        await tx.rewardTransaction.create({
          data: {
            rewardAccountId: account.id,
            type: "EARN_REFERRAL",
            points: 100,
            description: `Referral bonus from ${referrer.firstName}`,
          },
        });
        // Referrer's bonus is awarded on the new customer's first purchase
        await tx.referral.create({
          data: {
            referrerId: referrer.id,
            refereeId: created.id,
            referralCode: data.referralCode!,
            refereeBonus: 100,
            referrerBonus: 0,
          },
        });
      }
      return created;
    });

    emailService
      .sendWelcome({ email: user.email, name: user.firstName })
      .catch((err) => console.error("Welcome email failed:", err));

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        referralCode: user.referralCode,
      },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await findByEmail(email);
    // Compare against a dummy hash when there's no account, so the response time doesn't
    // reveal which emails are registered
    const isValid = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
    if (!user || !user.passwordHash || !isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Only after the password checks out, so a blocked account can't be discovered by guessing
    if (!user.isActive) {
      throw new UnauthorizedError("Account is disabled. Please contact support.");
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        referralCode: user.referralCode,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    // Verify the token
    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    // Check if token exists in DB and not revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedError("Refresh token has been revoked");
    }

    // Get user
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedError("User not found or disabled");
    }

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        referralCode: user.referralCode,
      },
      ...tokens,
    };
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(email: string) {
    const user = await findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return { message: "If an account exists, a reset code has been sent" };
    }

    const code = crypto.randomInt(100000, 1000000).toString();

    email = user.email;
    // Delete old OTPs for this user
    await prisma.otpVerification.deleteMany({
      where: { identifier: email, type: "PASSWORD_RESET" },
    });

    await prisma.otpVerification.create({
      data: {
        identifier: email,
        code,
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    await emailService.sendPasswordReset({ email, code });
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Password reset code for ${email}: ${code}`);
    }

    return { message: "If an account exists, a reset code has been sent" };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await findByEmail(email);
    if (!user) throw new BadRequestError("Invalid or expired reset code");
    email = user.email;
    const otp = await prisma.otpVerification.findFirst({
      where: {
        identifier: email,
        type: "PASSWORD_RESET",
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      throw new BadRequestError("Invalid or expired reset code");
    }

    if (otp.attempts >= 5) {
      throw new BadRequestError("Too many attempts. Please request a new code.");
    }

    if (otp.code !== code) {
      await prisma.otpVerification.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestError("Invalid reset code");
    }

    // Mark OTP as verified
    await prisma.otpVerification.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Revoke all refresh tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: "Password has been reset successfully" };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        emailVerified: true,
        referralCode: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }

  private async generateTokens(userId: string, email: string, role: any) {
    const jwtPayload: JwtPayload = { userId, email, role };

    const accessToken = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken({ userId });

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
