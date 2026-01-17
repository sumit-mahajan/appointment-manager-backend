// Custom error classes for better error handling
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: any) {
    super(400, message, details);
    this.name = "BadRequestError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: any) {
    super(409, message, details);
    this.name = "ConflictError";
  }
}
