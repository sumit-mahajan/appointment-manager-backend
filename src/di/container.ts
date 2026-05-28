import "reflect-metadata";
import { container } from "tsyringe";
import { pool } from "../database/db.js";
import { UserRepository } from "../repositories/user.repository.js";
import { ClinicRepository } from "../repositories/clinic.repository.js";
import { ClinicJoinRequestRepository } from "../repositories/clinic-join-request.repository.js";
import { PatientRepository } from "../repositories/patient.repository.js";
import { AppointmentRepository } from "../repositories/appointment.repository.js";
import { AuthService } from "../services/auth.service.js";
import { ClinicService } from "../services/clinic.service.js";
import { PatientService } from "../services/patient.service.js";
import { AppointmentService } from "../services/appointment.service.js";
import { AIService } from "../services/ai.service.js";
import { PublicBookingService } from "../services/public-booking.service.js";

container.register("DbPool", { useValue: pool });

container.register(UserRepository, { useClass: UserRepository });
container.register(ClinicRepository, { useClass: ClinicRepository });
container.register(ClinicJoinRequestRepository, {
  useClass: ClinicJoinRequestRepository,
});
container.register(PatientRepository, { useClass: PatientRepository });
container.register(AppointmentRepository, { useClass: AppointmentRepository });

container.register(AuthService, { useClass: AuthService });
container.register(ClinicService, { useClass: ClinicService });
container.register(PatientService, { useClass: PatientService });
container.register(AppointmentService, { useClass: AppointmentService });
container.register(AIService, { useClass: AIService });
container.register(PublicBookingService, { useClass: PublicBookingService });

export { container };
