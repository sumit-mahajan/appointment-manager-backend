import type { AuthUser } from "../../types/auth.types.js";
import type { AppointmentService } from "../../services/appointment.service.js";
import type { PatientService } from "../../services/patient.service.js";
import type {
  BookAppointmentParams,
  UpdateAppointmentParams,
  CancelAppointmentParams,
  ListAppointmentsParams,
  CheckAvailabilityParams,
  CreatePatientParams,
  SearchPatientsParams,
  GetAppointmentDetailsParams,
} from "./tool-definitions.js";

/**
 * Result type for tool executions
 */
export interface ToolResult {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

/**
 * Tool handler functions that integrate with existing services
 */
export class ToolHandlers {
  constructor(
    private appointmentService: AppointmentService,
    private patientService: PatientService
  ) { }

  /**
   * Book a new appointment
   */
  async handleBookAppointment(
    params: BookAppointmentParams,
    user: AuthUser
  ): Promise<ToolResult> {
    try {
      if (!user.clinic_id) {
        return {
          success: false,
          error: "You must belong to a clinic to book appointments",
        };
      }

      const appointment = await this.appointmentService.createAppointment(
        user.clinic_id,
        user.user_id,
        {
          patientId: params.patientId,
          start: params.start,
          end: params.end,
          durationInMinutes: params.durationInMinutes,
          isEmergency: params.isEmergency,
        }
      );

      return {
        success: true,
        data: appointment,
        message: `Successfully booked appointment for ${params.start}`,
      };
    } catch (error: any) {
      // Handle conflict errors specially
      if (error.message?.includes("Time slot is not available") || error.message?.includes("conflict")) {
        return {
          success: false,
          error: "CONFLICT: The requested time slot is not available. Another appointment exists at this time. Ask the user if they want to: 1) Try a different time slot, or 2) Book as an emergency appointment (which overrides conflicts).",
        };
      }

      return {
        success: false,
        error: error.message || "Failed to book appointment",
      };
    }
  }

  /**
   * Update an existing appointment
   */
  async handleUpdateAppointment(
    params: UpdateAppointmentParams,
    user: AuthUser
  ): Promise<ToolResult> {
    try {
      if (!user.clinic_id) {
        return {
          success: false,
          error: "You must belong to a clinic to update appointments",
        };
      }

      const appointment = await this.appointmentService.updateAppointment(
        params.appointmentId,
        user.clinic_id,
        user.user_id,
        {
          status: params.status,
          start: params.start,
          end: params.end,
          durationInMinutes: params.durationInMinutes,
          didShowUp: params.didShowUp,
          isEmergency: params.isEmergency,
        }
      );

      return {
        success: true,
        data: appointment,
        message: `Successfully updated appointment`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to update appointment",
      };
    }
  }

  /**
   * Cancel an appointment (convenience wrapper)
   */
  async handleCancelAppointment(
    params: CancelAppointmentParams,
    user: AuthUser
  ): Promise<ToolResult> {
    try {
      if (!user.clinic_id) {
        return {
          success: false,
          error: "You must belong to a clinic to cancel appointments",
        };
      }

      const appointment = await this.appointmentService.updateAppointment(
        params.appointmentId,
        user.clinic_id,
        user.user_id,
        { status: "cancel" }
      );

      return {
        success: true,
        data: appointment,
        message: `Successfully canceled appointment`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to cancel appointment",
      };
    }
  }

  /**
   * List appointments with optional filters
   */
  async handleListAppointments(
    params: ListAppointmentsParams,
    user: AuthUser
  ): Promise<ToolResult> {
    try {
      if (!user.clinic_id) {
        return {
          success: false,
          error: "You must belong to a clinic to view appointments",
        };
      }

      const appointments = await this.appointmentService.listAppointments(
        user.clinic_id,
        {
          start: params.start,
          end: params.end,
          patientId: params.patientId,
        }
      );

      return {
        success: true,
        data: appointments,
        message: `Found ${appointments.length} appointment(s)`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to list appointments",
      };
    }
  }

  /**
   * Check if a time slot is available
   */
  async handleCheckAvailability(
    params: CheckAvailabilityParams,
    user: AuthUser
  ): Promise<ToolResult> {
    try {
      if (!user.clinic_id) {
        return {
          success: false,
          error: "You must belong to a clinic to check availability",
        };
      }

      const result = await this.appointmentService.checkAvailability(
        user.clinic_id,
        params.start,
        params.end,
        params.excludeAppointmentId
      );

      return {
        success: true,
        data: result,
        message: result.available
          ? "Time slot is available"
          : "Time slot is not available",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to check availability",
      };
    }
  }

  /**
   * Create a new patient
   */
  async handleCreatePatient(
    params: CreatePatientParams,
    user: AuthUser
  ): Promise<ToolResult> {
    try {
      if (!user.clinic_id) {
        return {
          success: false,
          error: "You must belong to a clinic to create patients",
        };
      }

      const patient = await this.patientService.createPatient(
        user.clinic_id,
        user.user_id,
        {
          name: params.name,
          contact: params.contact,
        }
      );

      return {
        success: true,
        data: patient,
        message: `Successfully created patient: ${params.name}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to create patient",
      };
    }
  }

  /**
   * Search for patients by name
   */
  async handleSearchPatients(
    params: SearchPatientsParams,
    user: AuthUser
  ): Promise<ToolResult> {
    try {
      if (!user.clinic_id) {
        return {
          success: false,
          error: "You must belong to a clinic to search patients",
        };
      }

      const patients = await this.patientService.searchPatients(
        user.clinic_id,
        params.query
      );

      return {
        success: true,
        data: patients,
        message: `Found ${patients.length} patient(s)`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to search patients",
      };
    }
  }

  /**
   * Get detailed information about a specific appointment
   */
  async handleGetAppointmentDetails(
    params: GetAppointmentDetailsParams,
    user: AuthUser
  ): Promise<ToolResult> {
    try {
      if (!user.clinic_id) {
        return {
          success: false,
          error: "You must belong to a clinic to view appointment details",
        };
      }

      // List appointments with no filters will get all, then we filter by ID
      const appointments = await this.appointmentService.listAppointments(
        user.clinic_id
      );

      const appointment = appointments.find(
        (apt) => apt.appointment_id === params.appointmentId
      );

      if (!appointment) {
        return {
          success: false,
          error: "Appointment not found",
        };
      }

      return {
        success: true,
        data: appointment,
        message: "Found appointment details",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to get appointment details",
      };
    }
  }
}
