import type { Request, Response, NextFunction } from "express";
import { JwtUtil } from "../utils/jwt.util.js";
import { UnauthorizedError, ForbiddenError } from "../types/errors.js";
import type { AuthUser } from "../types/auth.types.js";

/**
 * Middleware to authenticate user via JWT token
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload = JwtUtil.verify(token);

    // Attach user to request
    req.user = {
      user_id: payload.user_id,
      email: payload.email,
      clinic_id: payload.clinic_id,
      role: payload.role,
    } as AuthUser;

    next();
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError("Invalid or expired token"));
    }
  }
}

/**
 * Middleware to ensure user has a clinic_id
 */
export function requireClinic(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new UnauthorizedError("Authentication required"));
  }

  if (!req.user.clinic_id) {
    return next(
      new ForbiddenError("You must belong to a clinic to perform this action")
    );
  }

  next();
}

/**
 * Middleware to ensure user is a clinic owner
 */
export function requireOwner(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new UnauthorizedError("Authentication required"));
  }

  if (!req.user.clinic_id) {
    return next(new ForbiddenError("You must belong to a clinic"));
  }

  if (req.user.role !== "OWNER") {
    return next(
      new ForbiddenError("Only clinic owners can perform this action")
    );
  }

  next();
}
