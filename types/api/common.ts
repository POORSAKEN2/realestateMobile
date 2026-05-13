export type ApiEnvelope<T> = {
  data?: T;
};

export type PaginatedApiData<T> = {
  data?: T[];
};

export type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

export type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};
