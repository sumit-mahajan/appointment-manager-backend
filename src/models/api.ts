export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code: string; // e.g., 'SLOT_UNAVAILABLE', 'PATIENT_NOT_FOUND'
    message: string;
    details?: any; // Validation errors
  };
  meta?: {
    // Useful for pagination
    page: number;
    limit: number;
    total: number;
  };
}
