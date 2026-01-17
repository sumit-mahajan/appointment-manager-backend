import type { Response } from "express";

export class ResponseUtil {
  static success<T>(res: Response, data: T, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    details?: any
  ) {
    return res.status(statusCode).json({
      success: false,
      error: message,
      ...(details && { details }),
    });
  }

  static created<T>(res: Response, data: T) {
    return this.success(res, data, 201);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }
}
