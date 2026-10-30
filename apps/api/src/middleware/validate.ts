import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { BadRequestError } from "./errorHandler.js";

// Zod's built-in messages are generic ("Required", "Expected number, received string"),
// so prefix those with the field name. Messages written in our schemas read fine alone.
const GENERIC = /^(Required|Expected|Invalid|String must|Number must|Array must|Too (small|big))/;

function humanize(path: string): string {
  return path
    .replace(/\.\d+\./g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        const first = details[0];
        const message =
          first && first.field && GENERIC.test(first.message)
            ? `${humanize(first.field)}: ${first.message}`
            : first?.message || "Validation failed";
        throw new BadRequestError(message, details);
      }
      throw error;
    }
  };
}
