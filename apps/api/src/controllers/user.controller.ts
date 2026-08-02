import { Request, Response } from "express";
import { userService } from "../services/user.service.js";

export class UserController {
  async getProfile(req: Request, res: Response) {
    const result = await userService.getProfile(req.user!.userId);
    res.json({ success: true, data: result });
  }

  async updateProfile(req: Request, res: Response) {
    const result = await userService.updateProfile(req.user!.userId, req.body);
    res.json({ success: true, data: result });
  }

  async changePassword(req: Request, res: Response) {
    const { currentPassword, newPassword } = req.body;
    const result = await userService.changePassword(req.user!.userId, currentPassword, newPassword);
    res.json({ success: true, data: result });
  }

  async getAddresses(req: Request, res: Response) {
    const result = await userService.getAddresses(req.user!.userId);
    res.json({ success: true, data: result });
  }

  async addAddress(req: Request, res: Response) {
    const result = await userService.addAddress(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateAddress(req: Request, res: Response) {
    const result = await userService.updateAddress(req.user!.userId, req.params.id as string, req.body);
    res.json({ success: true, data: result });
  }

  async deleteAddress(req: Request, res: Response) {
    const result = await userService.deleteAddress(req.user!.userId, req.params.id as string);
    res.json({ success: true, data: result });
  }
}

export const userController = new UserController();
