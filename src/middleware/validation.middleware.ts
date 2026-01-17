import type { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";
import { BadRequestError } from "../types/errors.js";

/**
 * Generic validation middleware using Zod schemas
 */
export function validate(schema: ZodObject<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));
        next(new BadRequestError("Validation failed", errors));
      } else {
        next(error);
      }
    }
  };
}
