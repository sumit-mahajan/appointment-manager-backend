import "reflect-metadata";
import { AppointmentService } from "../appointment.service.js";
import { AppointmentRepository } from "../../repositories/appointment.repository.js";
import { PatientRepository } from "../../repositories/patient.repository.js";
import { mock, MockProxy } from "jest-mock-extended";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../types/errors.js";

describe("AppointmentService", () => {
  let appointmentService: AppointmentService;
  let appointmentRepository: MockProxy<AppointmentRepository>;
  let patientRepository: MockProxy<PatientRepository>;

  beforeEach(() => {
    appointmentRepository = mock<AppointmentRepository>();
    patientRepository = mock<PatientRepository>();
    appointmentService = new AppointmentService(
      appointmentRepository,
      patientRepository
    );
  });

  describe("createAppointment", () => {
    const validDto = {
      patientId: "patient-123",
      start: "2026-01-20T10:00:00Z",
      end: "2026-01-20T11:00:00Z",
    };
    const clinicId = "clinic-123";
    const userId = "user-123";

    it("should create an appointment successfully", async () => {
      // Mock patient exists and belongs to clinic
      patientRepository.findById.mockResolvedValue({
        patient_id: "patient-123",
        clinic_id: clinicId,
        name: "John Doe",
        contact: "1234567890",
        created_by: "creator",
        modified_by: null,
        created_at: new Date().toISOString(),
      });

      // Mock availability check
      appointmentRepository.checkAvailability.mockResolvedValue(true);

      // Mock creation
      const createdAppointment = {
        appointment_id: "appt-123",
        clinic_id: clinicId,
        patient_id: "patient-123",
        created_by: userId,
        start_datetime: validDto.start,
        end_datetime: validDto.end,
        duration_in_minutes: 60,
        status: "pending",
        is_emergency: false,
        is_follow_up_pending: false,
        did_show_up: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        modified_by: null,
      };
      appointmentRepository.create.mockResolvedValue(createdAppointment);

      const result = await appointmentService.createAppointment(
        clinicId,
        userId,
        validDto
      );

      expect(result).toEqual(createdAppointment);
      expect(patientRepository.findById).toHaveBeenCalledWith(validDto.patientId);
      expect(appointmentRepository.checkAvailability).toHaveBeenCalledWith(
        clinicId,
        validDto.start,
        validDto.end
      );
      expect(appointmentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          clinic_id: clinicId,
          patient_id: validDto.patientId,
          duration_in_minutes: 60,
        })
      );
    });

    it("should throw NotFoundError if patient does not exist", async () => {
      patientRepository.findById.mockResolvedValue(null);

      await expect(
        appointmentService.createAppointment(clinicId, userId, validDto)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError if patient belongs to another clinic", async () => {
      patientRepository.findById.mockResolvedValue({
        patient_id: "patient-123",
        clinic_id: "other-clinic",
        name: "John Doe",
        contact: "1234567890",
        created_by: "creator",
        modified_by: null,
        created_at: new Date().toISOString(),
      });

      await expect(
        appointmentService.createAppointment(clinicId, userId, validDto)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw ConflictError if time slot is not available", async () => {
      patientRepository.findById.mockResolvedValue({
        patient_id: "patient-123",
        clinic_id: clinicId,
        name: "John Doe",
        contact: "1234567890",
        created_by: "creator",
        modified_by: null,
        created_at: new Date().toISOString(),
      });

      appointmentRepository.checkAvailability.mockResolvedValue(false);

      await expect(
        appointmentService.createAppointment(clinicId, userId, validDto)
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("updateAppointment", () => {
    const appointmentId = "appt-123";
    const clinicId = "clinic-123";
    const userId = "user-123";
    const validDto = {
      status: "confirm" as const,
    };

    const existingAppointment = {
      appointment_id: appointmentId,
      clinic_id: clinicId,
      patient_id: "patient-123",
      created_by: "creator-123",
      start_datetime: "2026-01-20T10:00:00Z",
      end_datetime: "2026-01-20T11:00:00Z",
      duration_in_minutes: 60,
      status: "pending",
      is_emergency: false,
      is_follow_up_pending: false,
      did_show_up: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      modified_by: null,
    };

    it("should update appointment successfully", async () => {
      appointmentRepository.findById.mockResolvedValue(existingAppointment);
      appointmentRepository.update.mockResolvedValue({
        ...existingAppointment,
        status: "confirm",
      });

      const result = await appointmentService.updateAppointment(
        appointmentId,
        clinicId,
        userId,
        validDto
      );

      expect(result.status).toBe("confirm");
      expect(appointmentRepository.update).toHaveBeenCalledWith(
        appointmentId,
        expect.objectContaining({ status: "confirm", modified_by: userId })
      );
    });

    it("should throw NotFoundError if appointment not found", async () => {
      appointmentRepository.findById.mockResolvedValue(null);

      await expect(
        appointmentService.updateAppointment(
          appointmentId,
          clinicId,
          userId,
          validDto
        )
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError if appointment belongs to another clinic", async () => {
      appointmentRepository.findById.mockResolvedValue({
        ...existingAppointment,
        clinic_id: "other-clinic",
      });

      await expect(
        appointmentService.updateAppointment(
          appointmentId,
          clinicId,
          userId,
          validDto
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it("should check availability when time is updated", async () => {
      appointmentRepository.findById.mockResolvedValue(existingAppointment);
      appointmentRepository.checkAvailability.mockResolvedValue(true);
      appointmentRepository.update.mockResolvedValue(existingAppointment);

      await appointmentService.updateAppointment(
        appointmentId,
        clinicId,
        userId,
        { start: "2026-01-21T10:00:00Z" }
      );

      expect(appointmentRepository.checkAvailability).toHaveBeenCalled();
    });

    it("should throw ConflictError when updating time and slot is unavailable", async () => {
        appointmentRepository.findById.mockResolvedValue(existingAppointment);
        appointmentRepository.checkAvailability.mockResolvedValue(false);
  
        await expect(appointmentService.updateAppointment(
          appointmentId,
          clinicId,
          userId,
          { start: "2026-01-21T10:00:00Z" }
        )).rejects.toThrow(ConflictError);
      });
  });

  describe("listAppointments", () => {
    it("should list appointments", async () => {
        const appointments = [
            { appointment_id: "1" } as any,
            { appointment_id: "2" } as any
        ];
        appointmentRepository.findByClinic.mockResolvedValue(appointments);

        const result = await appointmentService.listAppointments("clinic-1", { start: "2026-01-01" });
        
        expect(result).toEqual(appointments);
        expect(appointmentRepository.findByClinic).toHaveBeenCalledWith("clinic-1", {
            startDate: "2026-01-01",
            endDate: undefined,
            patientId: undefined
        });
    });
  });

  describe("getQueue", () => {
      it("should get queue", async () => {
          const appointments = [{ appointment_id: "1" } as any];
          appointmentRepository.findQueue.mockResolvedValue(appointments);

          const result = await appointmentService.getQueue("clinic-1");

          expect(result).toEqual(appointments);
          expect(appointmentRepository.findQueue).toHaveBeenCalledWith("clinic-1", 48, "pending");
      });
  });

  describe("checkAvailability", () => {
      it("should check availability", async () => {
          appointmentRepository.checkAvailability.mockResolvedValue(true);
          const result = await appointmentService.checkAvailability("clinic-1", "start", "end");
          expect(result).toEqual({ available: true });
          expect(appointmentRepository.checkAvailability).toHaveBeenCalledWith("clinic-1", "start", "end");
      });
  });
});
