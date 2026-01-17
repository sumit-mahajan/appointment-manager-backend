import "reflect-metadata";
import { PatientService } from "../patient.service.js";
import { PatientRepository } from "../../repositories/patient.repository.js";
import { mock, MockProxy } from "jest-mock-extended";
import { BadRequestError } from "../../types/errors.js";

describe("PatientService", () => {
  let patientService: PatientService;
  let patientRepository: MockProxy<PatientRepository>;

  beforeEach(() => {
    patientRepository = mock<PatientRepository>();
    patientService = new PatientService(patientRepository);
  });

  describe("createPatient", () => {
    const clinicId = "clinic-123";
    const userId = "user-123";
    const data = {
      name: "John Doe",
      contact: "1234567890",
    };

    it("should create patient successfully", async () => {
      const createdPatient = {
        patient_id: "patient-123",
        clinic_id: clinicId,
        created_by: userId,
        ...data,
      } as any;
      patientRepository.create.mockResolvedValue(createdPatient);

      const result = await patientService.createPatient(clinicId, userId, data);
      expect(result).toEqual(createdPatient);
      expect(patientRepository.create).toHaveBeenCalledWith({
        name: data.name,
        contact: data.contact,
        clinic_id: clinicId,
        created_by: userId,
      });
    });

    it("should throw BadRequestError if name is missing", async () => {
      await expect(
        patientService.createPatient(clinicId, userId, { ...data, name: "" })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError if contact is missing", async () => {
      await expect(
        patientService.createPatient(clinicId, userId, { ...data, contact: "" })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("searchPatients", () => {
    const clinicId = "clinic-123";

    it("should search patients by query", async () => {
      const patients = [{ patient_id: "1", name: "John" }] as any;
      patientRepository.searchByClinic.mockResolvedValue(patients);

      const result = await patientService.searchPatients(clinicId, "John");
      expect(result).toEqual(patients);
      expect(patientRepository.searchByClinic).toHaveBeenCalledWith(
        clinicId,
        "John"
      );
    });

    it("should list all patients if query is empty", async () => {
      const patients = [{ patient_id: "1", name: "John" }] as any;
      patientRepository.findByClinic.mockResolvedValue(patients);

      const result = await patientService.searchPatients(clinicId, "");
      expect(result).toEqual(patients);
      expect(patientRepository.findByClinic).toHaveBeenCalledWith(clinicId);
    });

    it("should list all patients if query is undefined", async () => {
      const patients = [{ patient_id: "1", name: "John" }] as any;
      patientRepository.findByClinic.mockResolvedValue(patients);

      const result = await patientService.searchPatients(clinicId);
      expect(result).toEqual(patients);
      expect(patientRepository.findByClinic).toHaveBeenCalledWith(clinicId);
    });
  });
});
