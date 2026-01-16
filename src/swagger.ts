import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Appointment Manager API",
      version: "1.0.0",
      description:
        "API for managing patient appointments with Supabase backend",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        Patient: {
          type: "object",
          properties: {
            patient_id: {
              type: "string",
              format: "uuid",
              description: "Unique patient identifier",
            },
            name: {
              type: "string",
              description: "Patient full name",
            },
            contact: {
              type: "string",
              description: "Patient contact information",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Timestamp when patient was created",
            },
          },
        },
        PatientInsert: {
          type: "object",
          required: ["name", "contact"],
          properties: {
            name: {
              type: "string",
              description: "Patient full name",
            },
            contact: {
              type: "string",
              description: "Patient contact information",
            },
          },
        },
        Appointment: {
          type: "object",
          properties: {
            appointment_id: {
              type: "string",
              format: "uuid",
              description: "Unique appointment identifier",
            },
            patient_id: {
              type: "string",
              format: "uuid",
              description: "Associated patient ID",
            },
            start_datetime: {
              type: "string",
              format: "date-time",
              description: "Appointment start time",
            },
            end_datetime: {
              type: "string",
              format: "date-time",
              description: "Appointment end time (calculated from duration)",
            },
            duration_in_minutes: {
              type: "integer",
              description: "Appointment duration in minutes",
            },
            is_emergency: {
              type: "boolean",
              description: "Whether appointment is an emergency",
            },
            is_follow_up_pending: {
              type: "boolean",
              description: "Whether follow-up is required",
            },
            status: {
              type: "string",
              enum: ["confirm", "pending", "cancel"],
              description: "Appointment status",
            },
            did_show_up: {
              type: "boolean",
              description: "Whether patient showed up",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Timestamp when appointment was created",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              description: "Timestamp when appointment was last updated",
            },
          },
        },
        AppointmentInsert: {
          type: "object",
          required: [
            "patient_id",
            "start_datetime",
            "duration_in_minutes",
            "status",
          ],
          properties: {
            patient_id: {
              type: "string",
              format: "uuid",
              description: "Associated patient ID",
            },
            start_datetime: {
              type: "string",
              format: "date-time",
              description: "Appointment start time",
            },
            end_datetime: {
              type: "string",
              format: "date-time",
              description: "Appointment end time (calculated from duration)",
            },
            duration_in_minutes: {
              type: "integer",
              description: "Appointment duration in minutes",
            },
            is_emergency: {
              type: "boolean",
              description: "Whether appointment is an emergency",
              default: false,
            },
            is_follow_up_pending: {
              type: "boolean",
              description: "Whether follow-up is required",
              default: false,
            },
            status: {
              type: "string",
              enum: ["confirm", "pending", "cancel"],
              description: "Appointment status",
              default: "pending",
            },
            did_show_up: {
              type: "boolean",
              description: "Whether patient showed up",
              default: false,
            },
          },
        },
        ApiResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
            },
            data: {
              type: "object",
              nullable: true,
            },
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                },
                message: {
                  type: "string",
                },
                details: {
                  type: "object",
                },
              },
            },
            meta: {
              type: "object",
              properties: {
                page: {
                  type: "integer",
                },
                limit: {
                  type: "integer",
                },
                total: {
                  type: "integer",
                },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Success message",
            },
            data: {
              type: "object",
              description: "Response data",
            },
          },
        },
      },
    },
  },
  apis: ["./src/index.ts", "./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
