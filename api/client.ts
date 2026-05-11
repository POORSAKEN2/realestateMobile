import Constants from "expo-constants";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

const extra = Constants.expoConfig?.extra as
  | { apiBaseUrl?: string }
  | undefined;

export const API_BASE_URL =
  extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  process.env.VITE_API_BASE_URL ??
  "";

function getFirstValidationError(errors?: Record<string, string[]>) {
  if (!errors) {
    return undefined;
  }

  const [firstError] = Object.values(errors).flat();

  return firstError;
}

function parseJsonError(text: string, isJson: boolean) {
  if (!text || !isJson) {
    return null;
  }

  try {
    return (JSON.parse(text) as ApiErrorResponse) ?? null;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers);
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (
    options.body !== undefined &&
    !isFormData &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const requestBody =
    options.body === undefined
      ? undefined
      : typeof options.body === "string" || isFormData
        ? (options.body as BodyInit)
        : JSON.stringify(options.body);

  const response = await fetch(url, {
    ...options,
    headers,
    body: requestBody,
  });

  if (!response.ok) {
    const text = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const data = parseJsonError(text, isJson);
    const validationMessage = getFirstValidationError(data?.errors);

    throw new Error(
      data?.message ||
        validationMessage ||
        `API request failed with status ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
