import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { JwtPayload } from "../middleware/auth.js";

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, env.JWT_ACCESS_SECRET as jwt.Secret, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as string,
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: { userId: string }): string {
  // Refresh tokens are stored with a unique constraint. Without a random id, two sign-ins (or
  // two tabs refreshing) for the same user in the same second produce the identical token and
  // the second one fails.
  return jwt.sign(payload as object, env.JWT_REFRESH_SECRET as jwt.Secret, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as string,
    jwtid: randomUUID(),
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET as jwt.Secret) as { userId: string };
}
