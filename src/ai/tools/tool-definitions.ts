import { z } from "zod";

/**
 * Tool definitions for the AI assistant
 * These define the function calling interface for Gemini
 */

// Book Appointment Tool
export const bookAppointmentTool = {
  description: `Book a new appointment for a patient. 
  - If the patient name is provided, search for them first using searchPatients tool.
  - If patient doesn't exist, create them first using createPatient tool.
  - Date and time MUST be in UTC timezone in ISO 8601 format.
  - IMPORTANT: Convert user's local time to UTC before passing to this tool.
  - Duration is in minutes (default: 30).
  - Use isEmergency=true to override availability checks.
  - If you get a CONFLICT error, inform the user and offer alternatives (different time or emergency booking).`,
  parameters: z.object({
    patientId: z.string().uuid().describe("The UUID of the patient"),
    start: z
      .string()
      .datetime()
      .describe("Start date and time in UTC timezone, ISO 8601 format (e.g., 2026-02-15T14:00:00Z). MUST convert from user's local time to UTC."),
    end: z
      .string()
      .datetime()
      .describe("End date and time in UTC timezone, ISO 8601 format (e.g., 2026-02-15T14:30:00Z). MUST convert from user's local time to UTC."),
    durationInMinutes: z
      .number()
      .positive()
      .optional()
      .describe("Duration in minutes (optional, will be calculated from start/end)"),
    isEmergency: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether this is an emergency appointment (bypasses availability check)"),
  }),
};

// Update Appointment Tool
export const updateAppointmentTool = {
  description: `Update an existing appointment's details.
  - Can update status (pending, confirm, cancel)
  - Can reschedule by updating start/end times (MUST be in UTC timezone)
  - Can mark if patient showed up
  - IMPORTANT: If updating times, convert user's local time to UTC.
  Use this to confirm, cancel, or reschedule appointments.`,
  parameters: z.object({
    appointmentId: z.string().uuid().describe("The UUID of the appointment to update"),
    status: z
      .enum(["pending", "confirm", "cancel"])
      .optional()
      .describe("New status for the appointment"),
    start: z
      .string()
      .datetime()
      .optional()
      .describe("New start date/time in UTC timezone, ISO 8601 format. Convert from user's local time to UTC."),
    end: z
      .string()
      .datetime()
      .optional()
      .describe("New end date/time in UTC timezone, ISO 8601 format. Convert from user's local time to UTC."),
    durationInMinutes: z.number().positive().optional().describe("New duration in minutes"),
    didShowUp: z.boolean().optional().describe("Whether the patient showed up"),
    isEmergency: z.boolean().optional().describe("Mark as emergency appointment"),
  }),
};

// Cancel Appointment Tool (simplified wrapper around update)
export const cancelAppointmentTool = {
  description: `Cancel an appointment by setting its status to 'cancel'.
  This is a convenience wrapper that updates the appointment status.`,
  parameters: z.object({
    appointmentId: z.string().uuid().describe("The UUID of the appointment to cancel"),
  }),
};

// List Appointments Tool
export const listAppointmentsTool = {
  description: `List appointments with optional filters.
  - Can filter by date range (start/end)
  - Can filter by specific patient
  - Returns appointments with patient details
  Use this to show today's appointments, upcoming appointments, or specific patient's appointments.`,
  parameters: z.object({
    start: z
      .string()
      .datetime()
      .optional()
      .describe("Filter appointments starting from this date/time (ISO 8601)"),
    end: z
      .string()
      .datetime()
      .optional()
      .describe("Filter appointments ending before this date/time (ISO 8601)"),
    patientId: z.string().uuid().optional().describe("Filter by specific patient ID"),
  }),
};

// Check Availability Tool
export const checkAvailabilityTool = {
  description: `Check if a time slot is available for booking.
  Returns whether the slot is free or has conflicts.
  Use this before booking to inform users about slot availability.`,
  parameters: z.object({
    start: z
      .string()
      .datetime()
      .describe("Start date and time to check (ISO 8601 format)"),
    end: z
      .string()
      .datetime()
      .describe("End date and time to check (ISO 8601 format)"),
    excludeAppointmentId: z
      .string()
      .uuid()
      .optional()
      .describe("Exclude this appointment ID from conflict check (for rescheduling)"),
  }),
};

// Create Patient Tool
export const createPatientTool = {
  description: `Create a new patient record.
  Use this when booking an appointment for a new patient who doesn't exist in the system.`,
  parameters: z.object({
    name: z.string().min(1).describe("Patient's full name"),
    contact: z.string().min(1).describe("Patient's phone number"),
  }),
};

// Search Patients Tool
export const searchPatientsTool = {
  description: `Search for patients by name.
  Returns a list of matching patients with their IDs.
  Use this to find patient IDs before booking appointments.
  Performs partial/fuzzy matching on patient names.`,
  parameters: z.object({
    query: z
      .string()
      .optional()
      .describe("Search query (patient name). If empty, returns all patients."),
  }),
};

// Get Appointment Details Tool
export const getAppointmentDetailsTool = {
  description: `Get detailed information about a specific appointment.
  Returns full appointment details including patient information.`,
  parameters: z.object({
    appointmentId: z.string().uuid().describe("The UUID of the appointment"),
  }),
};

// Export all tools with their names for easy registration
export const tools = {
  bookAppointment: bookAppointmentTool,
  updateAppointment: updateAppointmentTool,
  cancelAppointment: cancelAppointmentTool,
  listAppointments: listAppointmentsTool,
  checkAvailability: checkAvailabilityTool,
  createPatient: createPatientTool,
  searchPatients: searchPatientsTool,
  getAppointmentDetails: getAppointmentDetailsTool,
};

// Export type inference for parameters
export type BookAppointmentParams = z.infer<typeof bookAppointmentTool.parameters>;
export type UpdateAppointmentParams = z.infer<typeof updateAppointmentTool.parameters>;
export type CancelAppointmentParams = z.infer<typeof cancelAppointmentTool.parameters>;
export type ListAppointmentsParams = z.infer<typeof listAppointmentsTool.parameters>;
export type CheckAvailabilityParams = z.infer<typeof checkAvailabilityTool.parameters>;
export type CreatePatientParams = z.infer<typeof createPatientTool.parameters>;
export type SearchPatientsParams = z.infer<typeof searchPatientsTool.parameters>;
export type GetAppointmentDetailsParams = z.infer<typeof getAppointmentDetailsTool.parameters>;
