import {
  createClinicSchema,
  searchClinicSchema,
  joinClinicSchema,
  listJoinRequestsSchema,
  approveRejectRequestSchema,
} from "../clinic.validator.js";

describe("Clinic Validators", () => {
  describe("createClinicSchema", () => {
    it("should validate valid clinic data", () => {
      const result = createClinicSchema.safeParse({
        body: {
          name: "Test Clinic",
          address: "123 St",
          contact: "123456",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should fail if name is empty", () => {
      const result = createClinicSchema.safeParse({
        body: {
          name: "",
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("searchClinicSchema", () => {
    it("should validate valid search query", () => {
      const result = searchClinicSchema.safeParse({
        query: {
          name: "Test",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should fail if name is empty", () => {
      const result = searchClinicSchema.safeParse({
        query: {
          name: "",
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("joinClinicSchema", () => {
    it("should validate valid UUID", () => {
      const result = joinClinicSchema.safeParse({
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should fail if UUID is invalid", () => {
      const result = joinClinicSchema.safeParse({
        params: {
          id: "invalid-uuid",
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("listJoinRequestsSchema", () => {
    it("should validate valid status", () => {
      const result = listJoinRequestsSchema.safeParse({
        query: {
          status: "pending",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate empty status", () => {
      const result = listJoinRequestsSchema.safeParse({
        query: {},
      });
      expect(result.success).toBe(true);
    });

    it("should fail if status is invalid", () => {
      const result = listJoinRequestsSchema.safeParse({
        query: {
          status: "invalid",
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("approveRejectRequestSchema", () => {
    it("should validate valid request", () => {
      const result = approveRejectRequestSchema.safeParse({
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          status: "approved",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should fail if status is invalid", () => {
      const result = approveRejectRequestSchema.safeParse({
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          status: "pending",
        },
      });
      expect(result.success).toBe(false);
    });
  });
});
