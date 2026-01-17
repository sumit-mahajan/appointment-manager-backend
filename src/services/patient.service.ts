import { injectable, inject } from "tsyringe";
import { PatientRepository } from "../repositories/patient.repository.js";
import type { Patient } from "../models/Patient.js";
import { BadRequestError } from "../types/errors.js";

@injectable()
export class PatientService {
  constructor(
    @inject(PatientRepository)
    private patientRepository: PatientRepository
  ) {}

  async createPatient(
    clinicId: string,
    userId: string,
    data: { name: string; contact: string }
  ): Promise<Patient> {
    if (!data.name || !data.contact) {
      throw new BadRequestError("Name and contact are required");
    }

    return this.patientRepository.create({
      name: data.name,
      contact: data.contact,
      clinic_id: clinicId,
      created_by: userId,
    });
  }

  async searchPatients(clinicId: string, query?: string): Promise<Patient[]> {
    if (query && query.trim().length > 0) {
      return this.patientRepository.searchByClinic(clinicId, query.trim());
    }
    return this.patientRepository.findByClinic(clinicId);
  }
}
