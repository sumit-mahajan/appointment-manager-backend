import type { Express } from "express";
import authRoutes from "./auth.routes.js";
import clinicRoutes from "./clinic.routes.js";
import clinicAdminRoutes from "./clinic-admin.routes.js";
import patientRoutes from "./patient.routes.js";
import appointmentRoutes from "./appointment.routes.js";
import slotsRoutes from "./slots.routes.js";
import aiRoutes from "./ai.routes.js";

/**
 * Register all application routes
 */
export function registerRoutes(app: Express): void {
  // Authentication routes
  app.use("/auth", authRoutes);

  // Clinic routes (public clinic operations)
  app.use("/clinics", clinicRoutes);

  // Clinic admin routes (owner-only operations)
  app.use("/clinic", clinicAdminRoutes);

  // Patient routes
  app.use("/patients", patientRoutes);

  // Appointment routes
  app.use("/appointments", appointmentRoutes);

  // Slots/availability routes
  app.use("/slots", slotsRoutes);

  // AI chat routes
  app.use("/ai", aiRoutes);
}
