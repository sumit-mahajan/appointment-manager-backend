// JWT payload structure
export interface JwtPayload {
  user_id: string;
  email: string;
  clinic_id: string | null;
  role: "OWNER" | "STAFF" | null;
}

// Authenticated user context (attached to Express Request)
export interface AuthUser {
  user_id: string;
  email: string;
  clinic_id: string | null;
  role: "OWNER" | "STAFF" | null;
}

// Login/Register DTOs
export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  contact?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    user_id: string;
    email: string;
    name: string;
    clinic_id: string | null;
    role: "OWNER" | "STAFF" | null;
  };
}
