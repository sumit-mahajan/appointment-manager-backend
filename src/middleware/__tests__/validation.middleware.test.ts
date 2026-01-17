import { validate } from "../validation.middleware.js";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { BadRequestError } from "../../types/errors.js";
import { jest } from '@jest/globals';

describe("Validation Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
    };
    res = {};
    next = jest.fn();
  });

  afterEach(() => {
      jest.clearAllMocks();
  });

  const schema = z.object({
    body: z.object({
      name: z.string().min(1),
    }),
  });

  it("should call next() if validation passes", async () => {
    req.body = { name: "Test" };
    const middleware = validate(schema);
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("should call next with BadRequestError if validation fails", async () => {
    req.body = { name: "" };
    const middleware = validate(schema);
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    // Verify error details
    const error = (next as jest.Mock).mock.calls[0][0] as BadRequestError;
    expect(error.message).toBe("Validation failed");
    expect(error.details).toBeDefined();
    expect(error.details![0].path).toBe("body.name");
  });

  it("should call next with error if unexpected error occurs", async () => {
      const errorSchema = {
          parseAsync: jest.fn().mockRejectedValue(new Error("Unexpected") as never)
      } as any;

      const middleware = validate(errorSchema);
      await middleware(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
