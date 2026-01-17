import { injectable, inject } from "tsyringe";
import { ClinicRepository } from "../repositories/clinic.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { ClinicJoinRequestRepository } from "../repositories/clinic-join-request.repository.js";
import type { Clinic } from "../models/Clinic.js";
import type { User } from "../models/User.js";
import type { ClinicJoinRequest } from "../models/ClinicJoinRequest.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../types/errors.js";

@injectable()
export class ClinicService {
  constructor(
    @inject(ClinicRepository)
    private clinicRepository: ClinicRepository,
    @inject(UserRepository)
    private userRepository: UserRepository,
    @inject(ClinicJoinRequestRepository)
    private joinRequestRepository: ClinicJoinRequestRepository
  ) {}

  async createClinic(
    userId: string,
    data: { name: string; address?: string; contact?: string }
  ): Promise<Clinic> {
    // Check if user already has a clinic
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (user.clinic_id) {
      throw new BadRequestError("User already belongs to a clinic");
    }

    // Create clinic with user as owner
    const clinic = await this.clinicRepository.create({
      name: data.name,
      address: data.address || null,
      contact: data.contact || null,
      owner_id: userId,
    });

    // Update user's clinic_id
    await this.userRepository.updateClinicId(userId, clinic.clinic_id);

    return clinic;
  }

  async searchClinics(name: string): Promise<Clinic[]> {
    if (!name || name.trim().length === 0) {
      throw new BadRequestError("Search query cannot be empty");
    }
    return this.clinicRepository.searchByName(name);
  }

  async createJoinRequest(
    userId: string,
    clinicId: string
  ): Promise<ClinicJoinRequest> {
    // Verify user exists and doesn't have a clinic
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (user.clinic_id) {
      throw new BadRequestError("User already belongs to a clinic");
    }

    // Verify clinic exists
    const clinic = await this.clinicRepository.findById(clinicId);
    if (!clinic) {
      throw new NotFoundError("Clinic not found");
    }

    // Check for existing pending request
    const existingRequest =
      await this.joinRequestRepository.checkExistingPendingRequest(
        userId,
        clinicId
      );
    if (existingRequest) {
      throw new ConflictError(
        "You already have a pending request for this clinic"
      );
    }

    // Create join request
    return this.joinRequestRepository.create({
      user_id: userId,
      clinic_id: clinicId,
      status: "pending",
    });
  }

  async listJoinRequests(
    userId: string,
    status?: "pending" | "approved" | "rejected"
  ): Promise<ClinicJoinRequest[]> {
    // Get user's clinic
    const user = await this.userRepository.findById(userId);
    if (!user || !user.clinic_id) {
      throw new BadRequestError("User does not belong to a clinic");
    }

    // Verify user is owner
    const clinic = await this.clinicRepository.findById(user.clinic_id);
    if (!clinic || clinic.owner_id !== userId) {
      throw new ForbiddenError("Only clinic owner can view join requests");
    }

    // Return requests based on status
    if (status) {
      return this.joinRequestRepository.findByClinicAndStatus(
        user.clinic_id,
        status
      );
    }
    return this.joinRequestRepository.findPendingByClinic(user.clinic_id);
  }

  async approveOrRejectRequest(
    requestId: string,
    ownerId: string,
    status: "approved" | "rejected"
  ): Promise<ClinicJoinRequest> {
    // Get the request
    const request = await this.joinRequestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundError("Join request not found");
    }

    if (request.status !== "pending") {
      throw new BadRequestError("Request has already been processed");
    }

    // Verify owner has permission
    const owner = await this.userRepository.findById(ownerId);
    if (!owner || !owner.clinic_id) {
      throw new ForbiddenError("User is not part of a clinic");
    }

    const clinic = await this.clinicRepository.findById(owner.clinic_id);
    if (!clinic || clinic.owner_id !== ownerId) {
      throw new ForbiddenError("Only clinic owner can approve/reject requests");
    }

    if (request.clinic_id !== owner.clinic_id) {
      throw new ForbiddenError("This request is for a different clinic");
    }

    // Update request status
    const updatedRequest = await this.joinRequestRepository.updateStatus(
      requestId,
      status
    );

    // If approved, update user's clinic_id
    if (status === "approved") {
      await this.userRepository.updateClinicId(
        request.user_id,
        request.clinic_id
      );
    }

    return updatedRequest;
  }

  async listStaff(userId: string): Promise<User[]> {
    // Get user's clinic
    const user = await this.userRepository.findById(userId);
    if (!user || !user.clinic_id) {
      throw new BadRequestError("User does not belong to a clinic");
    }

    return this.clinicRepository.listStaff(user.clinic_id);
  }
}
