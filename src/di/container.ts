import "reflect-metadata";
import { container, delay } from "tsyringe";
import { supabase } from "../database/supabase.js";
import { UserRepository } from "../repositories/user.repository.js";
import { ClinicRepository } from "../repositories/clinic.repository.js";
import { ClinicJoinRequestRepository } from "../repositories/clinic-join-request.repository.js";
import { PatientRepository } from "../repositories/patient.repository.js";
import { AppointmentRepository } from "../repositories/appointment.repository.js";
import { AuthService } from "../services/auth.service.js";
import { ClinicService } from "../services/clinic.service.js";
import { PatientService } from "../services/patient.service.js";
import { AppointmentService } from "../services/appointment.service.js";

// Register Supabase client as singleton
container.register("SupabaseClient", {
  useValue: supabase,
});

// Explicit registration to solve "TypeInfo not known" issues in some ESM environments
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

export { container };
