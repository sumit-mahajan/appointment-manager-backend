import jwt, { type SignOptions } from "jsonwebtoken";
import type { JwtPayload } from "../types/auth.types.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
  "24h") as SignOptions["expiresIn"];

export class JwtUtil {
  static sign(payload: JwtPayload): string {
    return jwt.sign({ ...payload }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  static verify(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      return decoded;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }
}
