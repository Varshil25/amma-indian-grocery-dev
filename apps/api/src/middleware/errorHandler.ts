import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, statusCode: number, code: string = "INTERNAL_ERROR", details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    // new.target keeps the real subclass (BadRequestError, …) so `instanceof` checks work.
    // Pinning AppError.prototype here made every error look like a plain AppError.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad request", details?: unknown) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Handle Prisma connection errors
  if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P1001" || err.code === "P1002")) {
    console.error("Database connection error:", err.message);
    res.status(503).json({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Database is temporarily unavailable. Please try again.",
      },
    });
    return;
  }

  // Handle unique constraint violations (e.g. phone or email already in use)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = err.meta?.target;
    const fields = (Array.isArray(target) ? target.join(", ") : typeof target === "string" ? target : "") || "value";
    res.status(409).json({
      error: {
        code: "CONFLICT",
        message: `A record with this ${fields} already exists`,
      },
    });
    return;
  }

  // Record to update/delete does not exist
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Record not found" } });
    return;
  }

  // Foreign key violation (e.g. deleting something that orders still reference)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
    res.status(409).json({
      error: { code: "CONFLICT", message: "This record is in use by other data and can't be removed" },
    });
    return;
  }

  // Bad input that slipped past validation (wrong enum value, malformed date, …)
  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error("Prisma validation error:", err.message);
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "Invalid data for this request" } });
    return;
  }

  // Malformed JSON body
  if ((err as { type?: string }).type === "entity.parse.failed") {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "Malformed JSON body" } });
    return;
  }

  if ((err as { type?: string }).type === "entity.too.large") {
    res.status(413).json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large" } });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  });
}
