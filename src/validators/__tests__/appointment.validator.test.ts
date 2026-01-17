import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from "../appointment.validator.js";

describe("Appointment Validators", () => {
  describe("createAppointmentSchema", () => {
    it("should validate a valid appointment", () => {
      const validData = {
        body: {
          patientId: "123e4567-e89b-12d3-a456-426614174000",
          start: "2026-01-20T10:00:00Z",
          end: "2026-01-20T11:00:00Z",
          durationInMinutes: 60,
          isEmergency: false,
        },
      };

      const result = createAppointmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should fail validation for invalid UUID", () => {
      const invalidData = {
        body: {
          patientId: "invalid-uuid",
          start: "2026-01-20T10:00:00Z",
          end: "2026-01-20T11:00:00Z",
        },
      };

      const result = createAppointmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid patient ID");
      }
    });

    it("should fail validation for invalid datetime", () => {
      const invalidData = {
        body: {
            patientId: "123e4567-e89b-12d3-a456-426614174000",
            start: "invalid-date",
            end: "2026-01-20T11:00:00Z",
        },
      };

       const result = createAppointmentSchema.safeParse(invalidData);
       expect(result.success).toBe(false);
       if (!result.success) {
         expect(result.error.issues[0].message).toBe("Invalid start datetime");
       }
    });
  });

  describe("updateAppointmentSchema", () => {
    it("should validate partial updates", () => {
        const validData = {
            params: { id: "123e4567-e89b-12d3-a456-426614174000" },
            body: {
                status: "confirm"
            }
        };

        const result = updateAppointmentSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it("should fail validation for invalid status", () => {
        const invalidData = {
             params: { id: "123e4567-e89b-12d3-a456-426614174000" },
             body: {
                 status: "invalid-status"
             }
        };

        const result = updateAppointmentSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
  });
});
