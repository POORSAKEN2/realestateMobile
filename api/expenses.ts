import { ApiEnvelope, PaginatedApiData } from "../types";
import {
  Expense,
  CreateExpensePayload,
  UpdateExpensePayload,
} from "../types/domain/expenses";
import { API_BASE_URL, apiClient } from "./client";

function authHeaders(accessToken?: string) {
  return {
    Accept: "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function unwrapData<T>(response: ApiEnvelope<T> | T): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    response.data !== undefined
  ) {
    return response.data;
  }

  return response as T;
}

function unwrapList(
  response:
    | ApiEnvelope<Expense[]>
    | ApiEnvelope<PaginatedApiData<Expense>>
    | Expense[],
): Array<Record<string, any>> {
  const data: unknown =
    response &&
    typeof response === "object" &&
    !Array.isArray(response) &&
    "data" in response
      ? response.data
      : response;

  if (Array.isArray(data)) {
    return data;
  }

  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as PaginatedApiData<Expense>).data)
  ) {
    return (data as PaginatedApiData<Expense>).data ?? [];
  }

  return [];
}

function normalizeExpenseStatus(status: unknown): Expense["status"] {
  const value = String(status ?? "").toUpperCase();

  if (value === "PAID") return "Paid";
  if (value === "CANCELLED") return "Cancelled";
  return "Pending";
}

function toExpenseApiPayload(payload: CreateExpensePayload) {
  return {
    ...payload,
    status: normalizeExpenseStatus(payload.status),
  };
}

function normalizeExpense(expense: Record<string, any>): Expense {
  const rawDate = expense?.date ?? new Date().toISOString();

  const formattedDate = String(rawDate).trim().split("T")[0];
  return {
    ...expense,
    id: String(expense?.id ?? ""),
    property_id: String(
      expense?.property_id ?? expense?.linkedAsset ?? expense?.propertyId ?? "",
    ),
    tenant_id: String(expense?.tenant_id ?? expense?.tenantId ?? ""),
    support_ticket_id: expense?.support_ticket_id ?? null,
    property: expense?.property ?? null,
    category: expense?.category ?? "OTHER",
    amount: Number(expense?.amount ?? 0),
    date: formattedDate,
    status: normalizeExpenseStatus(expense?.status),
    reference_no: expense?.reference_no ?? expense?.referenceNumber ?? null,
    description: expense?.description ?? null,
  } as Expense;
}

export async function fetchExpenses(accessToken?: string): Promise<Expense[]> {
  const response = await apiClient.get<
    ApiEnvelope<Expense[]> | ApiEnvelope<PaginatedApiData<Expense>> | Expense[]
  >("/expenses", { headers: authHeaders(accessToken) });
  const expenses = unwrapList(response);

  return expenses.map((expense) => normalizeExpense(expense));
}

export async function createExpense(
  payload: CreateExpensePayload,
  accessToken?: string,
): Promise<Expense> {
  const response = await apiClient.post<ApiEnvelope<Expense> | Expense>(
    "/expenses",
    toExpenseApiPayload(payload),
    { headers: authHeaders(accessToken) },
  );

  return normalizeExpense(unwrapData<Expense>(response));
}

export async function updateExpense(
  id: string,
  payload: UpdateExpensePayload,
  accessToken?: string,
): Promise<Expense> {
  const response = await apiClient.post<ApiEnvelope<Expense> | Expense>(
    `/expenses/${id}?_method=PUT`,
    { ...toExpenseApiPayload(payload), _method: "PUT" },
    { headers: authHeaders(accessToken) },
  );

  return normalizeExpense(unwrapData<Expense>(response));
}
