import { injectable, inject } from "tsyringe";
import { AppointmentRepository } from "../repositories/appointment.repository.js";
import { PatientRepository } from "../repositories/patient.repository.js";
import type { Appointment } from "../models/Appointment.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../types/errors.js";

interface CreateAppointmentDto {
  patientId: string;
  start: string;
  end: string;
  durationInMinutes?: number;
  isEmergency?: boolean;
  isFollowUpPending?: boolean;
}

interface UpdateAppointmentDto {
  status?: "pending" | "confirm" | "cancel";
  start?: string;
  end?: string;
  durationInMinutes?: number;
  didShowUp?: boolean;
}

@injectable()
export class AppointmentService {
  constructor(
    @inject(AppointmentRepository)
    private appointmentRepository: AppointmentRepository,
    @inject(PatientRepository)
    private patientRepository: PatientRepository
  ) {}

  async createAppointment(
    clinicId: string,
    userId: string,
    dto: CreateAppointmentDto
  ): Promise<Appointment> {
    // Validate patient belongs to same clinic
    const patient = await this.patientRepository.findById(dto.patientId);
    if (!patient) {
      throw new NotFoundError("Patient not found");
    }
    if (patient.clinic_id !== clinicId) {
      throw new BadRequestError("Patient does not belong to this clinic");
    }

    // Check availability
    const isAvailable = await this.appointmentRepository.checkAvailability(
      clinicId,
      dto.start,
      dto.end
    );
    if (!isAvailable) {
      throw new ConflictError("Time slot is not available");
    }

    // Calculate duration if not provided
    let duration = dto.durationInMinutes;
    if (!duration) {
      const startTime = new Date(dto.start);
      const endTime = new Date(dto.end);
      duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    }

    // Create appointment
    return this.appointmentRepository.create({
      patient_id: dto.patientId,
      clinic_id: clinicId,
      created_by: userId,
      start_datetime: dto.start,
      end_datetime: dto.end,
      duration_in_minutes: duration,
      is_emergency: dto.isEmergency || false,
      is_follow_up_pending: dto.isFollowUpPending || false,
      status: "pending",
      did_show_up: false,
    });
  }

  async updateAppointment(
    appointmentId: string,
    clinicId: string,
    userId: string,
    dto: UpdateAppointmentDto
  ): Promise<Appointment> {
    // Get existing appointment
    const appointment = await this.appointmentRepository.findById(
      appointmentId
    );
    if (!appointment) {
      throw new NotFoundError("Appointment not found");
    }

    // Verify belongs to user's clinic
    if (appointment.clinic_id !== clinicId) {
      throw new ForbiddenError("Appointment does not belong to this clinic");
    }

    // If updating time, check availability
    if (dto.start || dto.end) {
      const startTime = dto.start || appointment.start_datetime;
      const endTime = dto.end || appointment.end_datetime;

      const isAvailable = await this.appointmentRepository.checkAvailability(
        clinicId,
        startTime,
        endTime as string,
        appointmentId
      );

      if (!isAvailable) {
        throw new ConflictError("Time slot is not available");
      }
    }

    // Build update object
    const updateData: any = {
      modified_by: userId,
    };

    if (dto.status) updateData.status = dto.status;
    if (dto.start) updateData.start_datetime = dto.start;
    if (dto.end) updateData.end_datetime = dto.end;
    if (dto.durationInMinutes)
      updateData.duration_in_minutes = dto.durationInMinutes;
    if (dto.didShowUp !== undefined) updateData.did_show_up = dto.didShowUp;

    return this.appointmentRepository.update(appointmentId, updateData);
  }

  async listAppointments(
    clinicId: string,
    filters?: {
      start?: string;
      end?: string;
      patientId?: string;
    }
  ): Promise<Appointment[]> {
    return this.appointmentRepository.findByClinic(clinicId, {
      startDate: filters?.start,
      endDate: filters?.end,
      patientId: filters?.patientId,
    });
  }

  async getQueue(
    clinicId: string,
    hours: number = 48,
    status: string = "pending"
  ): Promise<Appointment[]> {
    return this.appointmentRepository.findQueue(clinicId, hours, status);
  }

  async checkAvailability(
    clinicId: string,
    start: string,
    end: string
  ): Promise<{ available: boolean }> {
    const isAvailable = await this.appointmentRepository.checkAvailability(
      clinicId,
      start,
      end
    );
    return { available: isAvailable };
  }
}
