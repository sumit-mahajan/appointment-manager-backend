import { injectable, inject } from "tsyringe";
import { streamText, CoreMessage, tool } from "ai";
import { google } from "@ai-sdk/google";
import { AppointmentService } from "./appointment.service.js";
import { PatientService } from "./patient.service.js";
import type { AuthUser } from "../types/auth.types.js";
import { getSystemPrompt } from "../ai/prompts/system-prompt.js";
import { ToolHandlers } from "../ai/tools/tool-handlers.js";
import { tools } from "../ai/tools/tool-definitions.js";

/**
 * AI Service for handling chat interactions with Gemini
 */
@injectable()
export class AIService {
  private toolHandlers: ToolHandlers;

  constructor(
    @inject(AppointmentService) private appointmentService: AppointmentService,
    @inject(PatientService) private patientService: PatientService
  ) {
    this.toolHandlers = new ToolHandlers(
      this.appointmentService,
      this.patientService
    );
  }

  /**
   * Handle chat stream with Gemini AI
   */
  async handleChatStream(
    messages: CoreMessage[],
    user: AuthUser,
    timezoneInfo?: {
      timezone: string;
      currentDateLocal?: string;
      currentTimeLocal?: string;
    }
  ) {
    // Validate API key
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
    }

    // Use provided timezone info or fallback to server timezone
    const timezone = timezoneInfo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();

    let currentDateLocal = timezoneInfo?.currentDateLocal;
    let currentTimeLocal = timezoneInfo?.currentTimeLocal;

    // If not provided, format using timezone
    if (!currentDateLocal) {
      currentDateLocal = now.toLocaleDateString('en-US', {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    if (!currentTimeLocal) {
      currentTimeLocal = now.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    // Get system prompt with user context
    const systemPrompt = getSystemPrompt({
      userName: user.name || user.email,
      clinicName: "your clinic", // Could be fetched from DB if needed
      currentDateTime: now.toISOString(),
      timezone: timezone,
      currentDateLocal: currentDateLocal,
      currentTimeLocal: currentTimeLocal,
    });

    // Initialize Gemini model with API key
    const model = google("gemini-2.5-flash");

    // Stream text with tool calling
    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      tools: {
        bookAppointment: tool({
          description: tools.bookAppointment.description,
          parameters: tools.bookAppointment.parameters,
          execute: async (params) => {
            console.log('Executing bookAppointment tool with params:', params);
            const result = await this.toolHandlers.handleBookAppointment(
              params,
              user
            );
            console.log('bookAppointment result:', result);
            // Return the full result so AI can handle errors conversationally
            return result;
          },
        }),
        updateAppointment: tool({
          description: tools.updateAppointment.description,
          parameters: tools.updateAppointment.parameters,
          execute: async (params) => {
            console.log('Executing updateAppointment tool');
            const result = await this.toolHandlers.handleUpdateAppointment(
              params,
              user
            );
            return result;
          },
        }),
        cancelAppointment: tool({
          description: tools.cancelAppointment.description,
          parameters: tools.cancelAppointment.parameters,
          execute: async (params) => {
            console.log('Executing cancelAppointment tool');
            const result = await this.toolHandlers.handleCancelAppointment(
              params,
              user
            );
            return result;
          },
        }),
        listAppointments: tool({
          description: tools.listAppointments.description,
          parameters: tools.listAppointments.parameters,
          execute: async (params) => {
            console.log('Executing listAppointments tool');
            const result = await this.toolHandlers.handleListAppointments(
              params,
              user
            );
            return result;
          },
        }),
        checkAvailability: tool({
          description: tools.checkAvailability.description,
          parameters: tools.checkAvailability.parameters,
          execute: async (params) => {
            console.log('Executing checkAvailability tool');
            const result = await this.toolHandlers.handleCheckAvailability(
              params,
              user
            );
            return result;
          },
        }),
        createPatient: tool({
          description: tools.createPatient.description,
          parameters: tools.createPatient.parameters,
          execute: async (params) => {
            console.log('Executing createPatient tool');
            const result = await this.toolHandlers.handleCreatePatient(
              params,
              user
            );
            return result;
          },
        }),
        searchPatients: tool({
          description: tools.searchPatients.description,
          parameters: tools.searchPatients.parameters,
          execute: async (params) => {
            console.log('Executing searchPatients tool');
            const result = await this.toolHandlers.handleSearchPatients(
              params,
              user
            );
            return result;
          },
        }),
        getAppointmentDetails: tool({
          description: tools.getAppointmentDetails.description,
          parameters: tools.getAppointmentDetails.parameters,
          execute: async (params) => {
            console.log('Executing getAppointmentDetails tool');
            const result =
              await this.toolHandlers.handleGetAppointmentDetails(params, user);
            return result;
          },
        }),
      },
      maxSteps: 5, // Allow multiple tool calls in sequence
    });

    return result;
  }
}
