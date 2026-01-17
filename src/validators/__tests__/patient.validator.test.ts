import {
  createPatientSchema,
  searchPatientSchema,
} from "../patient.validator.js";

describe("Patient Validators", () => {
  describe("createPatientSchema", () => {
    it("should validate valid patient data", () => {
      const result = createPatientSchema.safeParse({
        body: {
          name: "John Doe",
          contact: "1234567890",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should fail if name is empty", () => {
      const result = createPatientSchema.safeParse({
        body: {
          name: "",
          contact: "1234567890",
        },
      });
      expect(result.success).toBe(false);
    });

    it("should fail if contact is empty", () => {
      const result = createPatientSchema.safeParse({
        body: {
          name: "John Doe",
          contact: "",
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("searchPatientSchema", () => {
    it("should validate valid search query", () => {
      const result = searchPatientSchema.safeParse({
        query: {
          q: "John",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate empty search query", () => {
      const result = searchPatientSchema.safeParse({
        query: {},
      });
      expect(result.success).toBe(true);
    });
  });
});
