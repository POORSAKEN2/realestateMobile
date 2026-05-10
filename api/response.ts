type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

function getFirstValidationError(errors?: Record<string, string[]>) {
  if (!errors) {
    return undefined;
  }

  const [firstError] = Object.values(errors).flat();

  return firstError;
}

export async function parseApiResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = text && isJson ? (JSON.parse(text) as ApiErrorResponse) : null;

  if (!response.ok) {
    const validationMessage = getFirstValidationError(data?.errors);

    throw new Error(data?.message || validationMessage || fallbackMessage);
  }

  if (!isJson) {
    throw new Error(
      "The API returned HTML instead of JSON. Check that the Laravel server is running and the mobile API URL points to /api.",
    );
  }

  return data as T;
}
