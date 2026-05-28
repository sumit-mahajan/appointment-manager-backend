import { injectable, inject } from "tsyringe";
import { ClinicRepository } from "../repositories/clinic.repository.js";
import { PatientRepository } from "../repositories/patient.repository.js";
import { AppointmentRepository } from "../repositories/appointment.repository.js";
import { AppointmentService } from "./appointment.service.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../types/errors.js";

export interface PublicBookDto {
  clinicId: string;
  name: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}

@injectable()
export class PublicBookingService {
  constructor(
    @inject(ClinicRepository) private clinicRepository: ClinicRepository,
    @inject(PatientRepository) private patientRepository: PatientRepository,
    @inject(AppointmentRepository)
    private appointmentRepository: AppointmentRepository,
    @inject(AppointmentService)
    private appointmentService: AppointmentService
  ) {}

  async getClinicInfo(clinicId: string) {
    const clinic = await this.clinicRepository.findById(clinicId);
    if (!clinic) throw new NotFoundError("Clinic not found");
    return {
      clinic_id: clinic.clinic_id,
      name: clinic.name,
      address: clinic.address,
      contact: clinic.contact,
    };
  }

  async listClinics() {
    const clinics = await this.clinicRepository.listAll();
    return clinics.map((c) => ({
      clinic_id: c.clinic_id,
      name: c.name,
      address: c.address,
      contact: c.contact,
    }));
  }

  async bookAppointment(dto: PublicBookDto) {
    const clinic = await this.clinicRepository.findById(dto.clinicId);
    if (!clinic) throw new NotFoundError("Clinic not found");

    const start = new Date(`${dto.preferredDate}T${dto.preferredTime}:00`);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestError("Invalid date or time");
    }

    if (start.getTime() < Date.now()) {
      throw new BadRequestError("Cannot book an appointment in the past");
    }

    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const isAvailable = await this.appointmentRepository.checkAvailability(
      dto.clinicId,
      start.toISOString(),
      end.toISOString()
    );
    if (!isAvailable) {
      throw new ConflictError(
        "That time slot is no longer available. Please choose another time."
      );
    }

    const normalizedPhone = dto.phone.trim();
    const normalizedName = dto.name.trim();

    let patient = await this.patientRepository.findByClinicAndContact(
      dto.clinicId,
      normalizedPhone
    );

    if (patient) {
      if (patient.name !== normalizedName) {
        patient = await this.patientRepository.updateName(
          patient.patient_id,
          normalizedName
        );
      }
    } else {
      patient = await this.patientRepository.create({
        name: normalizedName,
        contact: normalizedPhone,
        clinic_id: dto.clinicId,
        created_by: clinic.owner_id,
      });
    }

    const futureCount =
      await this.appointmentRepository.countFutureByPatient(
        dto.clinicId,
        patient.patient_id
      );
    if (futureCount > 0) {
      throw new ConflictError(
        "You already have an upcoming appointment at this clinic. Please call the clinic to reschedule or book another visit."
      );
    }

    const appointment = await this.appointmentService.createPublicAppointment(
      dto.clinicId,
      clinic.owner_id,
      {
        patientId: patient.patient_id,
        start: start.toISOString(),
        end: end.toISOString(),
        reason: dto.notes?.trim() || null,
      }
    );

    return appointment;
  }
}
