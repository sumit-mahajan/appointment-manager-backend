import { authenticate, requireClinic, requireOwner } from "../auth.middleware.js";
import { Request, Response, NextFunction } from "express";
import { JwtUtil } from "../../utils/jwt.util.js";
import { UnauthorizedError, ForbiddenError } from "../../types/errors.js";
import { jest } from '@jest/globals';

describe("Auth Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {};
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("authenticate", () => {
    it("should call next() if token is valid", () => {
      const token = "valid-token";
      req.headers = { authorization: `Bearer ${token}` };
      
      const payload = {
        user_id: "user-123",
        email: "test@example.com",
        clinic_id: "clinic-123",
        role: "OWNER",
      };

      jest.spyOn(JwtUtil, "verify").mockReturnValue(payload as any);

      authenticate(req as Request, res as Response, next);

      expect(JwtUtil.verify).toHaveBeenCalledWith(token);
      expect((req as any).user).toEqual(payload);
      expect(next).toHaveBeenCalledWith();
    });

    it("should call next with UnauthorizedError if no token provided", () => {
      authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it("should call next with UnauthorizedError if token format is invalid", () => {
      req.headers = { authorization: "InvalidFormat token" };
      authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it("should call next with UnauthorizedError if token verification fails", () => {
      req.headers = { authorization: "Bearer invalid-token" };
      jest.spyOn(JwtUtil, "verify").mockImplementation(() => {
        throw new Error("Invalid token");
      });

      authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe("requireClinic", () => {
    it("should call next() if user has clinic_id", () => {
      req.user = { clinic_id: "clinic-123" } as any;
      requireClinic(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it("should call next with UnauthorizedError if no user attached", () => {
        requireClinic(req as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it("should call next with ForbiddenError if user has no clinic_id", () => {
      req.user = { clinic_id: undefined } as any;
      requireClinic(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe("requireOwner", () => {
    it("should call next() if user is owner and has clinic", () => {
      req.user = { clinic_id: "clinic-123", role: "OWNER" } as any;
      requireOwner(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it("should call next with ForbiddenError if user is not owner", () => {
      req.user = { clinic_id: "clinic-123", role: "STAFF" } as any;
      requireOwner(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

     it("should call next with ForbiddenError if user has no clinic", () => {
      req.user = { role: "OWNER" } as any; // No clinic_id
      requireOwner(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });
});
