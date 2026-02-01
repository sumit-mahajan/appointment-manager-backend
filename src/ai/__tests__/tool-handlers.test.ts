import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ToolHandlers } from "../tools/tool-handlers.js";
import type { AppointmentService } from "../../services/appointment.service.js";
import type { PatientService } from "../../services/patient.service.js";
import type { AuthUser } from "../../types/auth.types.js";

describe("ToolHandlers", () => {
  let toolHandlers: ToolHandlers;
  let mockAppointmentService: jest.Mocked<AppointmentService>;
  let mockPatientService: jest.Mocked<PatientService>;
  let mockUser: AuthUser;

  beforeEach(() => {
    mockAppointmentService = {
      createAppointment: jest.fn(),
      updateAppointment: jest.fn(),
      listAppointments: jest.fn(),
      checkAvailability: jest.fn(),
    } as any;

    mockPatientService = {
      createPatient: jest.fn(),
      searchPatients: jest.fn(),
    } as any;

    mockUser = {
      user_id: "user-123",
      email: "test@example.com",
      name: "Test User",
      clinic_id: "clinic-123",
      role: "STAFF",
    };

    toolHandlers = new ToolHandlers(
      mockAppointmentService,
      mockPatientService
    );
  });

  describe("handleBookAppointment", () => {
    it("should book appointment successfully", async () => {
      const mockAppointment = {
        appointment_id: "apt-123",
        patient_id: "patient-123",
        start_datetime: "2026-02-15T14:00:00Z",
        end_datetime: "2026-02-15T14:30:00Z",
      };

      mockAppointmentService.createAppointment.mockResolvedValue(
        mockAppointment as any
      );

      const result = await toolHandlers.handleBookAppointment(
        {
          patientId: "patient-123",
          start: "2026-02-15T14:00:00Z",
          end: "2026-02-15T14:30:00Z",
          isEmergency: false
        },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAppointment);
      expect(mockAppointmentService.createAppointment).toHaveBeenCalledWith(
        "clinic-123",
        "user-123",
        expect.objectContaining({
          patientId: "patient-123",
          start: "2026-02-15T14:00:00Z",
          end: "2026-02-15T14:30:00Z",
        })
      );
    });

    it("should return error if user has no clinic", async () => {
      const userWithoutClinic = { ...mockUser, clinic_id: null };

      const result = await toolHandlers.handleBookAppointment(
        {
          patientId: "patient-123",
          start: "2026-02-15T14:00:00Z",
          end: "2026-02-15T14:30:00Z",
          isEmergency: false,
        },
        userWithoutClinic
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("must belong to a clinic");
    });

    it("should handle service errors gracefully", async () => {
      mockAppointmentService.createAppointment.mockRejectedValue(
        new Error("Time slot not available")
      );

      const result = await toolHandlers.handleBookAppointment(
        {
          patientId: "patient-123",
          start: "2026-02-15T14:00:00Z",
          end: "2026-02-15T14:30:00Z",
          isEmergency: false,
        },
        mockUser
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Time slot not available");
    });
  });

  describe("handleSearchPatients", () => {
    it("should search patients successfully", async () => {
      const mockPatients = [
        { patient_id: "p1", name: "John Doe", contact: "123" },
        { patient_id: "p2", name: "John Smith", contact: "456" },
      ];

      mockPatientService.searchPatients.mockResolvedValue(mockPatients as any);

      const result = await toolHandlers.handleSearchPatients(
        { query: "John" },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPatients);
      expect(result.message).toContain("Found 2 patient(s)");
    });
  });

  describe("handleCreatePatient", () => {
    it("should create patient successfully", async () => {
      const mockPatient = {
        patient_id: "p-123",
        name: "Jane Doe",
        contact: "555-1234",
      };

      mockPatientService.createPatient.mockResolvedValue(mockPatient as any);

      const result = await toolHandlers.handleCreatePatient(
        { name: "Jane Doe", contact: "555-1234" },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPatient);
      expect(mockPatientService.createPatient).toHaveBeenCalledWith(
        "clinic-123",
        "user-123",
        { name: "Jane Doe", contact: "555-1234" }
      );
    });
  });

  describe("handleCancelAppointment", () => {
    it("should cancel appointment successfully", async () => {
      const mockAppointment = {
        appointment_id: "apt-123",
        status: "cancel",
      };

      mockAppointmentService.updateAppointment.mockResolvedValue(
        mockAppointment as any
      );

      const result = await toolHandlers.handleCancelAppointment(
        { appointmentId: "apt-123" },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(mockAppointmentService.updateAppointment).toHaveBeenCalledWith(
        "apt-123",
        "clinic-123",
        "user-123",
        { status: "cancel" }
      );
    });
  });
});
