import { ApiEnvelope, PaginatedApiData } from "../types";
import {
  Expense,
  CreateExpensePayload,
  UpdateExpensePayload,
  ExpenseImageUpload,
} from "../types/domain/expenses";
import { apiClient, authHeaders, unwrapData } from "./client";

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

function normalizeApprovalStatus(status: unknown): Expense["approval_status"] {
  const value = String(status ?? "").toUpperCase();
  if (value === "APPROVED") return "Approved";
  if (value === "REJECTED") return "Rejected";
  return "Pending";
}

function toExpenseApiPayload(payload: CreateExpensePayload) {
  return {
    ...payload,
    status: normalizeExpenseStatus(payload.status),
    approval_status: payload.approval_status ?? "Pending",
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
    approval_status: normalizeApprovalStatus(expense?.approval_status ?? expense?.approvalStatus),
    approvalStatus: normalizeApprovalStatus(expense?.approval_status ?? expense?.approvalStatus),
    reference_no: expense?.reference_no ?? expense?.referenceNumber ?? null,
    description: expense?.description ?? null,
    receipts: Array.isArray(expense?.receipts) ? expense.receipts : [],
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

export async function deleteExpenseReceipt(
  expenseId: string,
  mediaId: string,
  accessToken?: string,
): Promise<void> {
  await apiClient.delete(`/expenses/${expenseId}/receipts/${mediaId}`, {
    headers: authHeaders(accessToken),
  });
}

export async function approveExpense(
  expenseId: string,
  notes?: string,
  accessToken?: string,
): Promise<Expense> {
  const response = await apiClient.post<ApiEnvelope<Expense> | Expense>(
    `/expenses/${expenseId}/approve`,
    { notes },
    { headers: authHeaders(accessToken) },
  );

  return normalizeExpense(unwrapData<Expense>(response));
}

export async function rejectExpense(
  expenseId: string,
  reason?: string,
  accessToken?: string,
): Promise<Expense> {
  const response = await apiClient.post<ApiEnvelope<Expense> | Expense>(
    `/expenses/${expenseId}/reject`,
    { reason },
    { headers: authHeaders(accessToken) },
  );

  return normalizeExpense(unwrapData<Expense>(response));
}
