export type ApiEnvelope<T> = {
  data?: T;
};

export type PaginatedApiData<T> = {
  data?: T[];
  current_page?: number;
  last_page?: number;
  total?: number;
  per_page?: number;
};

export type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

export type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};
