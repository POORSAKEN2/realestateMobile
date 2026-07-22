import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Platform } from "react-native";

import { expenseFetchers, useExpenses } from "../api/useExpenses";
import { useProperties } from "../api/useProperties";
import { useAuth } from "../useAuth";
import type { Expense } from "../../types/domain/expenses";
import type {
  CreateExpensePayload,
  UpdateExpensePayload,
} from "../../types/domain/expenses";
import {
  emptyForm,
  formatDateValue,
  parseNumber,
  type FormState,
} from "../../utils/expenses/expenseForm";

type ExpenseFormPayload = CreateExpensePayload | UpdateExpensePayload;

export function useExpenseForm() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const tenantId =
    session?.user &&
    typeof session.user === "object" &&
    "id" in session.user &&
    session.user.id !== undefined
      ? String(session.user.id)
      : "";
  const queryClient = useQueryClient();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const { useList: usePropertiesList } = useProperties();
  const { data: properties = [] } = usePropertiesList();
  const { useList: useExpensesList } = useExpenses();
  const { data: expenses = [], isLoading, refetch } = useExpensesList();

  const propertyOptions = useMemo(
    () =>
      properties.map((property) => ({
        label: `${property.title} · ${property.location}`,
        value: property.id,
      })),
    [properties],
  );
  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === form.propertyId),
    [form.propertyId, properties],
  );

  const saveMutation = useMutation({
    mutationFn: (payload: ExpenseFormPayload) =>
      editingExpense
        ? expenseFetchers.update({ id: editingExpense.id, payload })
        : expenseFetchers.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics"] });
      closeForm();
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Failed to save expense.",
      );
    },
  });

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openForm() {
    setForm({ ...emptyForm, date: new Date().toISOString().split("T")[0] });
    setFormError("");
    setEditingExpense(null);
    setIsDatePickerVisible(false);
    setIsFormVisible(true);
  }

  function openEditForm(expense: Expense) {
    setForm({
      propertyId: expense.property_id || "",
      category: expense.category || "",
      amount: expense.amount ? String(expense.amount) : "",
      date: expense.date || new Date().toISOString().split("T")[0],
      referenceNumber: expense.reference_no || "",
      description: expense.description || "",
      status: expense.status || "PENDING",
    });
    setFormError("");
    setEditingExpense(expense);
    setIsDatePickerVisible(false);
    setIsFormVisible(true);
  }

  function closeForm() {
    setForm(emptyForm);
    setFormError("");
    setEditingExpense(null);
    setIsDatePickerVisible(false);
    setIsFormVisible(false);
  }

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === "android") setIsDatePickerVisible(false);
    if (event.type === "dismissed" || !selectedDate) return;
    updateForm("date", formatDateValue(selectedDate));
  }

  function submit() {
    setFormError("");
    if (saveMutation.isPending) return;
    if (!accessToken) {
      setFormError("Please log in before submitting transaction updates.");
      return;
    }

    const propertyId = form.propertyId.trim();
    const amount = parseNumber(form.amount);
    if (!propertyId || !selectedProperty) {
      setFormError("An active linked property asset is required.");
      return;
    }
    if (!tenantId) {
      setFormError("Your user account could not be identified.");
      return;
    }
    if (!form.category.trim()) {
      setFormError("Please select a transaction category.");
      return;
    }
    if (amount === undefined || amount <= 0) {
      setFormError("Amount must be a valid number greater than 0.");
      return;
    }

    saveMutation.mutate({
      property_id: propertyId,
      tenant_id: tenantId,
      support_ticket_id: editingExpense?.support_ticket_id ?? null,
      property: selectedProperty,
      category: form.category.trim(),
      amount,
      date:
        form.date.trim().split("T")[0] ||
        new Date().toISOString().split("T")[0],
      status: form.status,
      reference_no: form.referenceNumber.trim() || null,
      description: form.description.trim() || null,
    });
  }

  return {
    closeForm,
    editingExpense,
    expenses,
    form,
    formError,
    handleDateChange,
    isDatePickerVisible,
    isFormVisible,
    isLoading,
    isSaving: saveMutation.isPending,
    openEditForm,
    openForm,
    propertyOptions,
    refetch,
    setIsDatePickerVisible,
    submit,
    updateForm,
  };
}
