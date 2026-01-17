import { registerSchema, loginSchema } from "../auth.validator.js";

describe("Auth Validators", () => {
  describe("registerSchema", () => {
    it("should validate valid registration data", () => {
      const result = registerSchema.safeParse({
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
          contact: "1234567890",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate valid registration data without contact", () => {
      const result = registerSchema.safeParse({
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should fail if name is empty", () => {
      const result = registerSchema.safeParse({
        body: {
          name: "",
          email: "john@example.com",
          password: "password123",
        },
      });
      expect(result.success).toBe(false);
    });

    it("should fail if email is invalid", () => {
      const result = registerSchema.safeParse({
        body: {
          name: "John Doe",
          email: "invalid-email",
          password: "password123",
        },
      });
      expect(result.success).toBe(false);
    });

    it("should fail if password is too short", () => {
      const result = registerSchema.safeParse({
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "123",
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("should validate valid login data", () => {
      const result = loginSchema.safeParse({
        body: {
          email: "john@example.com",
          password: "password123",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should fail if email is invalid", () => {
      const result = loginSchema.safeParse({
        body: {
          email: "invalid-email",
          password: "password123",
        },
      });
      expect(result.success).toBe(false);
    });

    it("should fail if password is empty", () => {
      const result = loginSchema.safeParse({
        body: {
          email: "john@example.com",
          password: "",
        },
      });
      expect(result.success).toBe(false);
    });
  });
});
