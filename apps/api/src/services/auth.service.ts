import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../config/database.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "../middleware/errorHandler.js";
import type { JwtPayload } from "../middleware/auth.js";

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    referralCode?: string;
  }) {
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError("An account with this email already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Generate unique referral code for this user
    const userReferralCode = `AMMA-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined, // blank form field arrives as "" and would collide on the unique index
        referralCode: userReferralCode,
      },
    });

    // Create reward account
    await prisma.rewardAccount.create({
      data: {
        userId: user.id,
        totalPoints: 50, // signup bonus
        availablePoints: 50,
      },
    });

    // Record signup bonus transaction
    const rewardAccount = await prisma.rewardAccount.findUnique({ where: { userId: user.id } });
    if (rewardAccount) {
      await prisma.rewardTransaction.create({
        data: {
          rewardAccountId: rewardAccount.id,
          type: "EARN_SIGNUP",
          points: 50,
          description: "Welcome bonus for signing up",
        },
      });
    }

    // Handle referral if code provided
    if (data.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: data.referralCode },
      });
      if (referrer) {
        // Give referee bonus (100 points)
        await prisma.rewardAccount.update({
          where: { userId: user.id },
          data: {
            totalPoints: { increment: 100 },
            availablePoints: { increment: 100 },
          },
        });
        await prisma.rewardTransaction.create({
          data: {
            rewardAccountId: rewardAccount!.id,
            type: "EARN_REFERRAL",
            points: 100,
            description: `Referral bonus from ${referrer.firstName}`,
          },
        });

        // Create referral record (referrer bonus awarded on first purchase)
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            refereeId: user.id,
            referralCode: data.referralCode,
            refereeBonus: 100,
            referrerBonus: 0, // awarded when referee makes first purchase
          },
        });
      }
    }

    // Generate tokens
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
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Account is disabled. Please contact support.");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
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
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return { message: "If an account exists, a reset code has been sent" };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

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

    // TODO: Send email with code via SendGrid in production
    console.log(`[DEV] Password reset code for ${email}: ${code}`);

    return { message: "If an account exists, a reset code has been sent" };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
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
      where: { email },
      data: { passwordHash },
    });

    // Revoke all refresh tokens for this user
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

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
