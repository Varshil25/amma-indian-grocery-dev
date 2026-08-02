import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { JwtPayload } from "../middleware/auth.js";

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, env.JWT_ACCESS_SECRET as jwt.Secret, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as string,
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload as object, env.JWT_REFRESH_SECRET as jwt.Secret, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as string,
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET as jwt.Secret) as { userId: string };
}
