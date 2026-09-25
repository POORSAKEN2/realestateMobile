import { ApiEnvelope, PaginatedApiData } from "../types";
import {
  Expense,
  CreateExpensePayload,
  UpdateExpensePayload,
  ExpenseImageUpload,
  ExpenseActivityPage,
  ExpenseLifecycleStatus,
} from "../types/domain/expenses";
import { apiClient, authHeaders, unwrapData } from "./client";
import {
  normalizeExpense,
  normalizeExpenseActivityPage,
} from "../utils/expenses/expenseGovernance";

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

function toExpenseApiPayload(payload: CreateExpensePayload) {
  const {
    tenant_id: _tenantId,
    property: _property,
    receipts: _receipts,
    ...data
  } = payload;
  return data;
}

export async function fetchExpense(
  id: string,
  accessToken?: string,
): Promise<Expense> {
  const response = await apiClient.get<ApiEnvelope<Expense> | Expense>(
    `/expenses/${encodeURIComponent(id)}`,
    { headers: authHeaders(accessToken) },
  );
  return normalizeExpense(unwrapData<Expense>(response));
}

export async function fetchExpenseActivity(
  id: string,
  cursor?: string,
  accessToken?: string,
): Promise<ExpenseActivityPage> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const response = await apiClient.get<
    ApiEnvelope<ExpenseActivityPage> | ExpenseActivityPage
  >(`/expenses/${encodeURIComponent(id)}/activity${query}`, {
    headers: authHeaders(accessToken),
  });
  return normalizeExpenseActivityPage(
    unwrapData<ExpenseActivityPage>(response),
  );
}

export async function transitionExpense(
  id: string,
  targetStatus: ExpenseLifecycleStatus,
  reason?: string,
  accessToken?: string,
): Promise<Expense> {
  const response = await apiClient.post<ApiEnvelope<Expense> | Expense>(
    `/expenses/${encodeURIComponent(id)}/transitions`,
    { target_status: targetStatus, reason: reason?.trim() || undefined },
    { headers: authHeaders(accessToken) },
  );
  return normalizeExpense(unwrapData<Expense>(response));
}

export async function retireExpenseReceipt(
  expenseId: string,
  mediaId: string,
  reason: string,
  accessToken?: string,
): Promise<Expense> {
  const response = await apiClient.post<ApiEnvelope<Expense> | Expense>(
    `/expenses/${encodeURIComponent(expenseId)}/receipts/${encodeURIComponent(mediaId)}/retire`,
    { reason },
    { headers: authHeaders(accessToken) },
  );
  return normalizeExpense(unwrapData<Expense>(response));
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

export async function uploadExpenseReceipts(
  expenseId: string,
  receipts: ExpenseImageUpload[],
  accessToken?: string,
): Promise<Expense> {
  const formData = new FormData();
  receipts.forEach((receipt, idx) => {
    formData.append(
      `receipts[${idx}]`,
      (receipt.file ?? {
        uri: receipt.uri,
        name: receipt.name || `receipt_${idx}.jpg`,
        type: receipt.type || "image/jpeg",
      }) as unknown as Blob,
    );
  });

  const response = await apiClient.post<ApiEnvelope<Expense> | Expense>(
    `/expenses/${expenseId}/receipts`,
    formData,
    { headers: authHeaders(accessToken) },
  );

  return normalizeExpense(unwrapData<Expense>(response));
}
