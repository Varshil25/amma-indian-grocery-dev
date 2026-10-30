import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Express 4 does not forward rejected promises to the error handler, so an async
 * handler that throws leaves the request hanging. Wrap async handlers with this.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
