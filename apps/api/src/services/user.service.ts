import bcrypt from "bcryptjs";
import prisma from "../config/database.js";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler.js";

export class UserService {
  async getProfile(userId: string) {
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

    // Get reward account
    const rewardAccount = await prisma.rewardAccount.findUnique({
      where: { userId },
      select: {
        totalPoints: true,
        availablePoints: true,
        tier: true,
        lifetimeSpend: true,
      },
    });

    return { ...user, rewards: rewardAccount };
  }

  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { ...data, phone: data.phone === "" ? null : data.phone },
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
      },
    });

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new NotFoundError("User not found");
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestError("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke all refresh tokens (force re-login)
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: "Password changed successfully" };
  }

  // Address management
  async getAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async addAddress(userId: string, data: {
    firstName: string;
    lastName: string;
    label?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
    isDefault?: boolean;
  }) {
    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If this is the first address, make it default
    const count = await prisma.address.count({ where: { userId } });
    if (count === 0) {
      data.isDefault = true;
    }

    return prisma.address.create({
      data: { ...data, userId },
    });
  }

  async updateAddress(userId: string, addressId: string, data: {
    label?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    isDefault?: boolean;
  }) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundError("Address not found");
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.address.update({
      where: { id: addressId },
      data,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundError("Address not found");
    }

    await prisma.address.delete({ where: { id: addressId } });

    // If deleted was default, make the most recent one default
    if (address.isDefault) {
      const latest = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (latest) {
        await prisma.address.update({
          where: { id: latest.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: "Address deleted successfully" };
  }
}

export const userService = new UserService();
