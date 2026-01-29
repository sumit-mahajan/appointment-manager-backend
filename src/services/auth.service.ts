import { injectable, inject } from "tsyringe";
import { UserRepository } from "../repositories/user.repository.js";
import { ClinicRepository } from "../repositories/clinic.repository.js";
import { PasswordUtil } from "../utils/password.util.js";
import { JwtUtil } from "../utils/jwt.util.js";
import type {
  RegisterDto,
  LoginDto,
  LoginResponse,
} from "../types/auth.types.js";
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
} from "../types/errors.js";

@injectable()
export class AuthService {
  constructor(
    @inject(UserRepository)
    private userRepository: UserRepository,
    @inject(ClinicRepository)
    private clinicRepository: ClinicRepository
  ) { }

  /**
   * Generate a fresh JWT token for a user based on their current database state
   * This is used after mutations that change clinic_id or role
   */
  async generateTokenForUser(userId: string): Promise<LoginResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Determine role dynamically and get clinic name
    let role: "OWNER" | "STAFF" | null = null;
    let clinicName: string | null = null;
    if (user.clinic_id) {
      const clinic = await this.clinicRepository.findById(user.clinic_id);
      if (clinic) {
        clinicName = clinic.name;
        if (clinic.owner_id === user.user_id) {
          role = "OWNER";
        } else {
          role = "STAFF";
        }
      }
    }

    // Generate JWT token
    const token = JwtUtil.sign({
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      clinic_id: user.clinic_id,
      clinic_name: clinicName,
      role,
    });

    return {
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        clinic_id: user.clinic_id,
        role,
      },
    };
  }

  async register(dto: RegisterDto): Promise<LoginResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Hash password
    const passwordHash = await PasswordUtil.hash(dto.password);

    // Create user with null clinic_id
    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password_hash: passwordHash,
      contact: dto.contact || null,
      clinic_id: null,
    });

    // Generate JWT token
    const token = JwtUtil.sign({
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      clinic_id: null,
      clinic_name: null,
      role: null,
    });

    return {
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        clinic_id: null,
        role: null,
      },
    };
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    // Find user by email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await PasswordUtil.compare(
      dto.password,
      user.password_hash
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Determine role dynamically and get clinic name
    let role: "OWNER" | "STAFF" | null = null;
    let clinicName: string | null = null;
    if (user.clinic_id) {
      const clinic = await this.clinicRepository.findById(user.clinic_id);
      if (clinic) {
        clinicName = clinic.name;
        if (clinic.owner_id === user.user_id) {
          role = "OWNER";
        } else {
          role = "STAFF";
        }
      }
    }

    // Generate JWT token
    const token = JwtUtil.sign({
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      clinic_id: user.clinic_id,
      clinic_name: clinicName,
      role,
    });

    return {
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        clinic_id: user.clinic_id,
        role,
      },
    };
  }
}
