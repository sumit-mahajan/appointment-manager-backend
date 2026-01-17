import "reflect-metadata";
import { ClinicService } from "../clinic.service.js";
import { ClinicRepository } from "../../repositories/clinic.repository.js";
import { UserRepository } from "../../repositories/user.repository.js";
import { ClinicJoinRequestRepository } from "../../repositories/clinic-join-request.repository.js";
import { mock, MockProxy } from "jest-mock-extended";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../types/errors.js";

describe("ClinicService", () => {
  let clinicService: ClinicService;
  let clinicRepository: MockProxy<ClinicRepository>;
  let userRepository: MockProxy<UserRepository>;
  let joinRequestRepository: MockProxy<ClinicJoinRequestRepository>;

  beforeEach(() => {
    clinicRepository = mock<ClinicRepository>();
    userRepository = mock<UserRepository>();
    joinRequestRepository = mock<ClinicJoinRequestRepository>();
    clinicService = new ClinicService(
      clinicRepository,
      userRepository,
      joinRequestRepository
    );
  });

  describe("createClinic", () => {
    const userId = "user-123";
    const data = {
      name: "Test Clinic",
      address: "123 Test St",
      contact: "1234567890",
    };

    it("should create clinic successfully", async () => {
      userRepository.findById.mockResolvedValue({
        user_id: userId,
        clinic_id: null,
      } as any);

      const createdClinic = {
        clinic_id: "clinic-123",
        owner_id: userId,
        ...data,
      } as any;
      clinicRepository.create.mockResolvedValue(createdClinic);

      const result = await clinicService.createClinic(userId, data);

      expect(result).toEqual(createdClinic);
      expect(userRepository.updateClinicId).toHaveBeenCalledWith(
        userId,
        createdClinic.clinic_id
      );
    });

    it("should throw NotFoundError if user not found", async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(clinicService.createClinic(userId, data)).rejects.toThrow(
        NotFoundError
      );
    });

    it("should throw BadRequestError if user already has a clinic", async () => {
      userRepository.findById.mockResolvedValue({
        user_id: userId,
        clinic_id: "existing-clinic",
      } as any);
      await expect(clinicService.createClinic(userId, data)).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe("searchClinics", () => {
    it("should search clinics by name", async () => {
      const clinics = [{ clinic_id: "1", name: "Test" }] as any;
      clinicRepository.searchByName.mockResolvedValue(clinics);

      const result = await clinicService.searchClinics("Test");
      expect(result).toEqual(clinics);
    });

    it("should throw BadRequestError if query is empty", async () => {
      await expect(clinicService.searchClinics("")).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe("createJoinRequest", () => {
    const userId = "user-123";
    const clinicId = "clinic-123";

    it("should create join request successfully", async () => {
      userRepository.findById.mockResolvedValue({
        user_id: userId,
        clinic_id: null,
      } as any);
      clinicRepository.findById.mockResolvedValue({ clinic_id: clinicId } as any);
      joinRequestRepository.checkExistingPendingRequest.mockResolvedValue(null);
      
      const createdRequest = { request_id: "req-1", status: "pending" } as any;
      joinRequestRepository.create.mockResolvedValue(createdRequest);

      const result = await clinicService.createJoinRequest(userId, clinicId);
      expect(result).toEqual(createdRequest);
    });

    it("should throw ConflictError if pending request exists", async () => {
      userRepository.findById.mockResolvedValue({
        user_id: userId,
        clinic_id: null,
      } as any);
      clinicRepository.findById.mockResolvedValue({ clinic_id: clinicId } as any);
      joinRequestRepository.checkExistingPendingRequest.mockResolvedValue({} as any);

      await expect(
        clinicService.createJoinRequest(userId, clinicId)
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("listJoinRequests", () => {
    const userId = "user-123";
    const clinicId = "clinic-123";

    it("should list pending requests for owner", async () => {
      userRepository.findById.mockResolvedValue({
        user_id: userId,
        clinic_id: clinicId,
      } as any);
      clinicRepository.findById.mockResolvedValue({
        clinic_id: clinicId,
        owner_id: userId,
      } as any);

      const requests = [{ request_id: "1" }] as any;
      joinRequestRepository.findPendingByClinic.mockResolvedValue(requests);

      const result = await clinicService.listJoinRequests(userId);
      expect(result).toEqual(requests);
    });

    it("should throw ForbiddenError if not owner", async () => {
       userRepository.findById.mockResolvedValue({
        user_id: userId,
        clinic_id: clinicId,
      } as any);
      clinicRepository.findById.mockResolvedValue({
        clinic_id: clinicId,
        owner_id: "other-owner",
      } as any);

      await expect(clinicService.listJoinRequests(userId)).rejects.toThrow(
        ForbiddenError
      );
    });
  });

  describe("approveOrRejectRequest", () => {
    const requestId = "req-1";
    const ownerId = "owner-1";
    const clinicId = "clinic-1";
    const userId = "user-1";

    it("should approve request and update user clinic", async () => {
      const request = {
        request_id: requestId,
        status: "pending",
        clinic_id: clinicId,
        user_id: userId,
      } as any;
      joinRequestRepository.findById.mockResolvedValue(request);

      userRepository.findById.mockResolvedValue({
        user_id: ownerId,
        clinic_id: clinicId,
      } as any);
      
      clinicRepository.findById.mockResolvedValue({
        clinic_id: clinicId,
        owner_id: ownerId,
      } as any);

      joinRequestRepository.updateStatus.mockResolvedValue({
          ...request,
          status: "approved"
      });

      const result = await clinicService.approveOrRejectRequest(requestId, ownerId, "approved");

      expect(result.status).toBe("approved");
      expect(userRepository.updateClinicId).toHaveBeenCalledWith(userId, clinicId);
    });
  });
  
  describe("listStaff", () => {
      const userId = "user-123";
      const clinicId = "clinic-123";

      it("should list staff", async () => {
          userRepository.findById.mockResolvedValue({
              user_id: userId,
              clinic_id: clinicId,
          } as any);
          
          const staff = [{ user_id: "1" }] as any;
          clinicRepository.listStaff.mockResolvedValue(staff);

          const result = await clinicService.listStaff(userId);
          expect(result).toEqual(staff);
      });
  });
});
