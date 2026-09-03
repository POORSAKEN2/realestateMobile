export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: Record<string, string[]>;
  constructor(message: string, status: number, code?: string, details?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
export function isForbiddenError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 403;
}
export function toApiError(status: number, data?: { message?: string; code?: string; errors?: Record<string, string[]> }) {
  const serverMessage = data?.message;
  const message = status === 403
    ? serverMessage && !/^(unauthorized action\.?|forbidden\.?|this action is unauthorized\.?)$/i.test(serverMessage)
      ? serverMessage : "You don't have permission to do this. Ask your account owner to review your access."
    : serverMessage || Object.values(data?.errors ?? {}).flat()[0] || `API request failed with status ${status}`;
  return new ApiError(message, status, data?.code, data?.errors);
}
