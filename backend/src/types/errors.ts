/**
 * Shared error model for all backend responses (REST + Socket.IO).
 *
 * Error shape: { code, message, recoverable }
 * - code:        machine-readable identifier (e.g. "RESOURCE_NOT_FOUND")
 * - message:     user-facing description
 * - recoverable: true if the caller can retry without changing state
 */

export interface AppError {
  code: string;
  message: string;
  recoverable: boolean;
}

/** Build an AppError from an unknown thrown value. */
export function toAppError(err: unknown, code: string, recoverable = false): AppError {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : 'An unexpected error occurred';
  return { code, message, recoverable };
}
