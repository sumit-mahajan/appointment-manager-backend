import type { Request, Response, NextFunction } from "express";
import { AppError } from "../types/errors.js";

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error for debugging
  console.error("Error:", err);

  // Handle custom AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details && { details: err.details }),
    });
    return;
  }

  // Handle generic errors
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
}
