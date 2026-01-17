import "reflect-metadata";
import { AuthService } from "../auth.service.js";
import { UserRepository } from "../../repositories/user.repository.js";
import { ClinicRepository } from "../../repositories/clinic.repository.js";
import { PasswordUtil } from "../../utils/password.util.js";
import { JwtUtil } from "../../utils/jwt.util.js";
import { mock, MockProxy } from "jest-mock-extended";
import {
  ConflictError,
  UnauthorizedError,
} from "../../types/errors.js";
import { jest } from '@jest/globals';

describe("AuthService", () => {
  let authService: AuthService;
  let userRepository: MockProxy<UserRepository>;
  let clinicRepository: MockProxy<ClinicRepository>;

  beforeEach(() => {
    userRepository = mock<UserRepository>();
    clinicRepository = mock<ClinicRepository>();
    authService = new AuthService(userRepository, clinicRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    const registerDto = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      contact: "1234567890",
    };

    it("should register a new user successfully", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      const hashedPassword = "hashed_password";
      jest.spyOn(PasswordUtil, "hash").mockResolvedValue(hashedPassword);
      
      const createdUser = {
        user_id: "user-123",
        name: registerDto.name,
        email: registerDto.email,
        password_hash: hashedPassword,
        contact: registerDto.contact,
        clinic_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      userRepository.create.mockResolvedValue(createdUser);

      const token = "jwt_token";
      jest.spyOn(JwtUtil, "sign").mockReturnValue(token);

      const result = await authService.register(registerDto);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(PasswordUtil.hash).toHaveBeenCalledWith(registerDto.password);
      expect(userRepository.create).toHaveBeenCalledWith({
        name: registerDto.name,
        email: registerDto.email,
        password_hash: hashedPassword,
        contact: registerDto.contact,
        clinic_id: null,
      });
      expect(JwtUtil.sign).toHaveBeenCalled();
      expect(result).toEqual({
        token,
        user: {
          user_id: createdUser.user_id,
          email: createdUser.email,
          name: createdUser.name,
          clinic_id: null,
          role: null,
        },
      });
    });

    it("should throw ConflictError if email already exists", async () => {
      userRepository.findByEmail.mockResolvedValue({ user_id: "existing" } as any);

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictError
      );
    });
  });

  describe("login", () => {
    const loginDto = {
      email: "john@example.com",
      password: "password123",
    };

    const user = {
      user_id: "user-123",
      name: "John Doe",
      email: loginDto.email,
      password_hash: "hashed_password",
      contact: "1234567890",
      clinic_id: "clinic-123",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it("should login successfully as OWNER", async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      jest.spyOn(PasswordUtil, "compare").mockResolvedValue(true);
      
      const clinic = {
        clinic_id: "clinic-123",
        owner_id: "user-123",
      } as any;
      clinicRepository.findById.mockResolvedValue(clinic);

      const token = "jwt_token";
      jest.spyOn(JwtUtil, "sign").mockReturnValue(token);

      const result = await authService.login(loginDto);

      expect(result.user.role).toBe("OWNER");
      expect(JwtUtil.sign).toHaveBeenCalledWith(expect.objectContaining({ role: "OWNER" }));
      expect(result.token).toBe(token);
    });

    it("should login successfully as STAFF", async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      jest.spyOn(PasswordUtil, "compare").mockResolvedValue(true);
      
      const clinic = {
        clinic_id: "clinic-123",
        owner_id: "other-user",
      } as any;
      clinicRepository.findById.mockResolvedValue(clinic);

      const token = "jwt_token";
      jest.spyOn(JwtUtil, "sign").mockReturnValue(token);

      const result = await authService.login(loginDto);

      expect(result.user.role).toBe("STAFF");
      expect(JwtUtil.sign).toHaveBeenCalledWith(expect.objectContaining({ role: "STAFF" }));
    });

    it("should throw UnauthorizedError if user not found", async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("should throw UnauthorizedError if password invalid", async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      jest.spyOn(PasswordUtil, "compare").mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedError
      );
    });
  });
});
