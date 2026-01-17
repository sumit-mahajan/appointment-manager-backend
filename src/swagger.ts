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
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Patient: {
          type: "object",
          properties: {
            patient_id: { type: "string", format: "uuid" },
            name: { type: "string" },
            contact: { type: "string" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Appointment: {
          type: "object",
          properties: {
            appointment_id: { type: "string", format: "uuid" },
            patient_id: { type: "string", format: "uuid" },
            start_datetime: { type: "string", format: "date-time" },
            end_datetime: { type: "string", format: "date-time" },
            duration_in_minutes: { type: "integer" },
            status: { type: "string", enum: ["confirm", "pending", "cancel"] },
            is_emergency: { type: "boolean" },
            is_follow_up_pending: { type: "boolean" },
            did_show_up: { type: "boolean" },
          },
        },
        User: {
          type: "object",
          properties: {
            user_id: { type: "string", format: "uuid" },
            email: { type: "string" },
            name: { type: "string" },
            clinic_id: { type: "string", format: "uuid", nullable: true },
          },
        },
        Clinic: {
          type: "object",
          properties: {
            clinic_id: { type: "string", format: "uuid" },
            name: { type: "string" },
            address: { type: "string", nullable: true },
            contact: { type: "string", nullable: true },
            owner_id: { type: "string", format: "uuid" },
          },
        },
        ClinicJoinRequest: {
          type: "object",
          properties: {
            request_id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            clinic_id: { type: "string", format: "uuid" },
            status: {
              type: "string",
              enum: ["pending", "approved", "rejected"],
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            user: {
              type: "object",
              properties: {
                user_id: { type: "string", format: "uuid" },
                email: { type: "string" },
                name: { type: "string" },
                clinic_id: { type: "string", format: "uuid", nullable: true },
                role: { type: "string", nullable: true },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string" },
            details: { type: "object", nullable: true },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/index.ts", "./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
