# Appointment Manager - Clean Architecture Backend

A scalable, multi-tenant appointment management system built with clean architecture principles, featuring JWT authentication, role-based authorization, and comprehensive clinic management.

## Architecture Overview

This project follows a layered clean architecture pattern:

```
┌─────────────────────────────────────────────────┐
│              Routes Layer                        │
│  (auth + route handlers + validation)          │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            Services Layer                        │
│           (Business logic )                      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│          Repositories Layer                      │
│  (Data access using Supabase client)            │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            Supabase Database                     │
└─────────────────────────────────────────────────┘
```

### Key Features

- **Clean Architecture**: Separation of concerns with Routes → Services → Repositories
- **Dependency Injection**: TSyringe for loose coupling and testability
- **Type Safety**: Full TypeScript with Supabase-generated types
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Authorization**: Role-based access control (OWNER/STAFF) determined dynamically
- **Multi-Tenancy**: Clinic-scoped data isolation
- **Validation**: Zod schemas for request validation
- **Error Handling**: Centralized error handling with custom error types

## Project Structure

```
src/
├── di/
│   └── container.ts              # TSyringe DI container configuration
├── routes/
│   ├── auth.routes.ts            # Authentication endpoints
│   ├── clinic.routes.ts          # Clinic search and join
│   ├── clinic-admin.routes.ts    # Owner-only clinic management
│   ├── patient.routes.ts         # Patient CRUD operations
│   ├── appointment.routes.ts     # Appointment management
│   ├── slots.routes.ts           # Availability checking
│   └── index.ts                  # Route registration
├── services/
│   ├── auth.service.ts           # Authentication business logic
│   ├── clinic.service.ts         # Clinic management
│   ├── patient.service.ts        # Patient management
│   └── appointment.service.ts    # Appointment management
├── repositories/
│   ├── user.repository.ts        # User data access
│   ├── clinic.repository.ts      # Clinic data access
│   ├── clinic-join-request.repository.ts
│   ├── patient.repository.ts     # Patient data access
│   └── appointment.repository.ts # Appointment data access
├── middleware/
│   ├── auth.middleware.ts        # JWT verification & authorization
│   ├── validation.middleware.ts  # Zod schema validation
│   └── error.middleware.ts       # Global error handling
├── validators/
│   ├── auth.validator.ts         # Auth request schemas
│   ├── clinic.validator.ts       # Clinic request schemas
│   ├── patient.validator.ts      # Patient request schemas
│   └── appointment.validator.ts  # Appointment request schemas
├── utils/
│   ├── jwt.util.ts               # JWT signing & verification
│   ├── password.util.ts          # Password hashing & comparison
│   └── response.util.ts          # Standardized API responses
├── types/
│   ├── auth.types.ts             # Authentication types
│   ├── errors.ts                 # Custom error classes
│   └── express.d.ts              # Express type extensions
├── models/
│   └── *.ts                      # Database type definitions
├── database/
│   └── supabase.ts               # Supabase client initialization
└── index.ts                      # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account with database set up
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd appointment-manager
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-anon-key
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRES_IN=24h
   PORT=3000
   ```

4. **Run database migrations**

   ```bash
   npm run db:push
   ```

5. **Generate TypeScript types from database**

   ```bash
   npm run db:types
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## API Documentation

### Base URL

```
http://localhost:3000
```

### API Endpoints

#### Authentication & Onboarding

| Method | Endpoint         | Description                 | Auth Required |
| ------ | ---------------- | --------------------------- | ------------- |
| POST   | `/auth/register` | Create a new user account   | No            |
| POST   | `/auth/login`    | Login and receive JWT token | No            |

#### Clinic Management

| Method | Endpoint                                | Description                        | Auth Required | Role Required |
| ------ | --------------------------------------- | ---------------------------------- | ------------- | ------------- |
| GET    | `/clinics/search?name={string}`         | Search for clinics                 | Yes           | -             |
| POST   | `/clinics`                              | Create a new clinic (become owner) | Yes           | -             |
| POST   | `/clinics/:id/join`                     | Request to join a clinic           | Yes           | -             |
| GET    | `/clinic/join-requests?status={status}` | List join requests                 | Yes           | OWNER         |
| PATCH  | `/clinic/join-requests/:id`             | Approve/reject join request        | Yes           | OWNER         |
| GET    | `/clinic/staff`                         | List all staff in clinic           | Yes           | -             |

#### Patient Management

| Method | Endpoint                      | Description               | Auth Required | Clinic Required |
| ------ | ----------------------------- | ------------------------- | ------------- | --------------- |
| GET    | `/patients?q={nameOrContact}` | Search patients in clinic | Yes           | Yes             |
| POST   | `/patients`                   | Create a new patient      | Yes           | Yes             |

#### Appointment Management

| Method | Endpoint                                      | Description                    | Auth Required | Clinic Required |
| ------ | --------------------------------------------- | ------------------------------ | ------------- | --------------- |
| GET    | `/appointments?start=&end=&patientId=`        | List appointments with filters | Yes           | Yes             |
| GET    | `/appointments/queue?hours=48&status=pending` | Get reminder queue             | Yes           | Yes             |
| POST   | `/appointments`                               | Create a new appointment       | Yes           | Yes             |
| PATCH  | `/appointments/:id`                           | Update an appointment          | Yes           | Yes             |
| GET    | `/slots/availability?start=&end=`             | Check time slot availability   | Yes           | Yes             |

#### Health & Documentation

| Method | Endpoint         | Description                  |
| ------ | ---------------- | ---------------------------- |
| GET    | `/health`        | Health check endpoint        |
| GET    | `/api-docs`      | Swagger API documentation UI |
| GET    | `/api-docs.json` | Swagger JSON specification   |

## Authentication Flow

1. **User Registration**

   ```bash
   POST /auth/register
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "securePassword123",
     "contact": "+1234567890"
   }
   ```

   Response includes JWT token.

2. **User Login**

   ```bash
   POST /auth/login
   {
     "email": "john@example.com",
     "password": "securePassword123"
   }
   ```

3. **Use Token in Requests**
   ```bash
   Authorization: Bearer <your-jwt-token>
   ```

## Multi-Tenant Architecture

### Role Determination

Roles are determined dynamically based on database relationships:

- **No Clinic**: User without `clinic_id` (can search/create/join clinics)
- **OWNER**: User's `user_id` matches `clinic.owner_id`
- **STAFF**: User has `clinic_id` but is not the owner

### Data Isolation

All clinic-scoped operations automatically filter by the authenticated user's `clinic_id`:

- Patients are scoped to clinic
- Appointments are scoped to clinic
- Staff listings are scoped to clinic
- Join requests are scoped to clinic

The `clinic_id` is **never** accepted from request body/query parameters. It's always injected from the authenticated user's JWT token.

## Error Handling

The API uses standardized error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "details": {
    /* Optional additional details */
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email, time slot unavailable)
- `500` - Internal Server Error

## Database Schema

Key tables:

- **users**: User accounts with optional clinic association
- **clinics**: Clinic entities with owner reference
- **clinic_join_requests**: Staff join requests
- **patients**: Patients scoped to clinics
- **appointments**: Appointments with conflict prevention

See `supabase/migrations/` for detailed schema.

## Development

### Scripts

```bash
# Start development server with auto-reload
npm run dev

# Run unit tests (Jest)
npm test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage report
npm run test:cov

# Generate TypeScript types from Supabase
npm run db:types

# Push migrations to Supabase
npm run db:push
```

### Adding a New Endpoint

1. **Create validator** in `src/validators/`
2. **Add repository method** (if needed) in `src/repositories/`
3. **Add service method** in `src/services/`
4. **Create route handler** in `src/routes/`
5. **Register route** in `src/routes/index.ts`

## Testing

### Unit tests (Jest)

This project uses **Jest + ts-jest** for unit testing services, middleware, and validators.

```bash
# Run all unit tests
npm test

# Watch mode
npm run test:watch

# Coverage (text + lcov)
npm run test:cov
```

- **Test locations**: `src/**/__tests__/**/*.test.ts`
- **Jest config**: `jest.config.cjs` (TypeScript + ESM preset, coverage paths)
- **Coverage output**: `coverage/` (already ignored via `.gitignore`)
- **ESM note**: package uses `"type": "module"`; tests run with Node `--experimental-vm-modules` as configured in `package.json`.

### Manual testing (Swagger)

Access the API documentation at `http://localhost:3000/api-docs` to test endpoints using the Swagger UI.

### Example: Complete User Flow

1. Register a user
2. Login to get JWT token
3. Search for a clinic OR create a new clinic
4. If joining: submit join request and wait for owner approval
5. Once in a clinic: create patients and appointments

## Security Considerations

- Passwords are hashed using bcrypt with 10 salt rounds
- JWT tokens expire after 24 hours (configurable)
- All sensitive operations require authentication
- Owner-only operations are protected by role checks
- Multi-tenant data isolation prevents cross-clinic data access
- Database-level constraints prevent appointment conflicts

## Future Enhancements

- Refresh token implementation
- Email verification
- Password reset functionality
- Appointment reminders/notifications
- Audit logging
- Rate limiting
- API versioning

## License

ISC

## Support

For issues and questions, please create an issue in the repository.
