import { errorHandler, notFoundHandler } from "../error.middleware.js";
import { Request, Response, NextFunction } from "express";
import { AppError, BadRequestError } from "../../types/errors.js";
import { jest } from '@jest/globals';

describe("Error Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any,
    };
    next = jest.fn();
  });

  afterEach(() => {
      jest.clearAllMocks();
  });

  describe("errorHandler", () => {
    it("should handle AppError correctly", () => {
      const error = new BadRequestError("Bad Request");
      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Bad Request",
      });
    });

    it("should handle AppError with details", () => {
      const details = [{ message: "Field required" }];
      const error = new BadRequestError("Validation Error", details);
      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Validation Error",
        details,
      });
    });

    it("should handle generic Error correctly", () => {
      const error = new Error("Something went wrong");
      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Something went wrong",
      });
    });
    
    it("should handle generic Error with default message", () => {
        const error = new Error();
        errorHandler(error, req as Request, res as Response, next);
  
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: "Internal server error",
        });
      });
  });

  describe("notFoundHandler", () => {
    it("should return 404", () => {
      notFoundHandler(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Route not found",
      });
    });
  });
});
