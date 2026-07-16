import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Screen } from "../../components/ui/Screen";
import AddButton from "../../components/ui/buttons/AddButton";
import { AddEditModal } from "../../components/ui/AddEditModal";
import { BaseField } from "../../components/ui/fields/BaseField";
import { DropdownField } from "../../components/ui/fields/DropdownField";
import { PickerField } from "../../components/ui/fields/PickerField";
import { ChoiceGroup } from "../../components/ui/groups/ChoiceGroup";

import { useAuth } from "../../hooks/useAuth";
import { useProperties } from "../../hooks/api/useProperties";

import {
  emptyForm,
  FormState,
  cleanDecimal,
  parseNumber,
  formatPeso,
  formatDateValue,
  parseDateValue,
} from "../../utils/expenses/expenseForm";
import {
  CreateExpensePayload,
  UpdateExpensePayload,
  Expense,
} from "../../types/domain/expenses";
import { expenseFetchers, useExpenses } from "../../hooks/api/useExpenses";
import { Choice } from "../../constants/propertyChoices";

type ExpenseFormPayload = CreateExpensePayload | UpdateExpensePayload;

const expenseCategoryChoices = [
  { label: "Maintenance & Repairs", value: "MAINTENANCE" },
  { label: "Utilities (Water, Electricity, etc.)", value: "UTILITIES" },
  { label: "Property Taxes", value: "TAXES" },
  { label: "Insurance", value: "INSURANCE" },
  { label: "Management Fees", value: "MANAGEMENT_FEES" },
  { label: "Other Operations", value: "OTHER" },
];

const expenseStatusChoices: Choice<Expense["status"]>[] = [
  { label: "Pending Approval", value: "Pending" },
  { label: "Paid", value: "Paid" },
];

const summary = [
  { label: "Monthly Spend", value: "₱128.4k", icon: "receipt-outline" },
  { label: "Maintenance", value: "₱42.8k", icon: "construct-outline" },
  { label: "Utilities", value: "₱18.6k", icon: "flash-outline" },
] as const;

export default function ExpensesScreen() {
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

  // --- Modal & Form State ---
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  // --- Fetch Properties for dropdown selection ---
  const { useList: usePropertiesList } = useProperties();
  const { data: properties = [] } = usePropertiesList();

  const propertyOptions = useMemo(() => {
    return properties.map((property) => ({
      label: `${property.title} · ${property.location}`,
      value: property.id,
    }));
  }, [properties]);
  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === form.propertyId),
    [form.propertyId, properties],
  );

  // --- Fetch Expenses ---
  const { useList: useExpensesList } = useExpenses();
  // Destructured 'isRefetching' and 'refetch' to power the pull-to-refresh
  const { data: expenses = [], isLoading, refetch } = useExpensesList();

  // --- Save / Edit Mutation ---
  const saveMutation = useMutation({
    mutationFn: async (payload: ExpenseFormPayload) => {
      return editingExpense
        ? await expenseFetchers.update({ id: editingExpense.id, payload })
        : await expenseFetchers.create(payload);
    },
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

  // --- Form Handlers ---
  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openForm() {
    setForm({
      ...emptyForm,
      date: new Date().toISOString().split("T")[0],
    });
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

  // --- Validation and Submit ---
  function handleSubmit() {
    setFormError("");

    if (saveMutation.isPending) return;

    if (!accessToken) {
      setFormError("Please log in before submitting transaction updates.");
      return;
    }

    const propertyId = form.propertyId.trim();
    const category = form.category.trim();
    const amount = parseNumber(form.amount);
    const referenceNumber = form.referenceNumber.trim();
    const description = form.description.trim();
    const date =
      form.date.trim().split("T")[0] || new Date().toISOString().split("T")[0];

    if (!propertyId || !selectedProperty) {
      setFormError("An active linked property asset is required.");
      return;
    }

    if (!tenantId) {
      setFormError("Your user account could not be identified.");
      return;
    }

    if (!category) {
      setFormError("Please select a transaction category.");
      return;
    }

    if (amount === undefined || amount <= 0) {
      setFormError("Amount must be a valid number greater than 0.");
      return;
    }

    const payload: ExpenseFormPayload = {
      property_id: propertyId,
      tenant_id: tenantId,
      support_ticket_id: editingExpense?.support_ticket_id ?? null,
      property: selectedProperty,
      category,
      amount,
      date,
      status: form.status,
      reference_no: referenceNumber || null,
      description: description || null,
    };

    saveMutation.mutate(payload);
  }

  return (
    <Screen className="bg-slate-50">
      <View className="flex-1 gap-4">
        {/* Header Section */}
        <View className="flex-row items-center justify-between px-1">
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-slate-400">
              Operations
            </Text>
            <Text className="font-soraSemiBold text-3xl tracking-tight text-[#1d1d1f]">
              Expenses
            </Text>
          </View>
          <AddButton onPress={openForm} />
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#2563EB" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            // Bind the refresh variables to the RefreshControl[cite: 6]
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor="#2563EB" // iOS spinner color
                colors={["#2563EB"]} // Android spinner color
              />
            }
          >
            {/* Quick Metrics Widget Panel */}
            <View className="mb-6 gap-3">
              {summary.map((item) => (
                <View
                  key={item.label}
                  className="flex-row items-center rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/10"
                >
                  <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                    <Ionicons name={item.icon} color="#2563EB" size={22} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-500">
                      {item.label}
                    </Text>
                    <Text className="mt-1 text-xl font-bold text-slate-950">
                      {item.value}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" color="#CBD5E1" size={20} />
                </View>
              ))}
            </View>

            {/* Render List of Expenses */}
            <View className="gap-3">
              {expenses.map((expense: Expense) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  key={expense.id}
                  onPress={() => openEditForm(expense)}
                  className="flex-row items-center justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <View className="flex-1 gap-1">
                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {expense.category}
                    </Text>
                    <Text
                      className="text-base font-semibold text-slate-900"
                      numberOfLines={1}
                    >
                      {expense.description || "No description provided"}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      Ref: {expense.reference_no || "N/A"} • {expense.date}
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="font-soraSemiBold text-base text-slate-900">
                      {formatPeso(expense.amount)}
                    </Text>
                    <View
                      className={`rounded-full px-2 py-0.5 ${expense.status === "Paid" ? "bg-emerald-50" : "bg-amber-50"}`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${expense.status === "Paid" ? "text-emerald-600" : "text-amber-600"}`}
                      >
                        {expense.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* --- ADD / EDIT FORM MODAL --- */}
      <AddEditModal
        isVisible={isFormVisible}
        onClose={closeForm}
        title={editingExpense ? "Expense Details" : "Record an expense"}
        subtitle={
          editingExpense
            ? "Update properties operating costs."
            : "Track property costs and recurring operating expenses."
        }
        isPending={saveMutation.isPending}
        submitText={editingExpense ? "Save Expense" : "Add Expense"}
        onSubmit={handleSubmit}
        formError={formError}
      >
        <DropdownField
          required
          label="Linked Asset"
          placeholder="Select a property"
          value={form.propertyId}
          options={propertyOptions}
          onSelect={(value) => updateForm("propertyId", value)}
        />

        <DropdownField
          label="Category"
          placeholder="Select expense category"
          value={form.category}
          options={expenseCategoryChoices}
          onSelect={(value) => updateForm("category", value)}
        />

        <BaseField
          keyboardType="decimal-pad"
          label="Amount"
          placeholder="0.00"
          value={form.amount}
          onChangeText={(value) => updateForm("amount", cleanDecimal(value))}
          required
        />

        <PickerField
          label="Transaction Date"
          placeholder="Select transaction date"
          value={form.date}
          onPress={() => setIsDatePickerVisible(true)}
        />

        {isDatePickerVisible ? (
          <Modal
            animationType="fade"
            onRequestClose={() => setIsDatePickerVisible(false)}
            transparent
            visible
          >
            <View className="flex-1 justify-center bg-black/40 px-5">
              <View className="rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-5 shadow-xl">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-[#1d1d1f]"></Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="rounded-full bg-[#2563EB]/5 px-3 py-1.5"
                    onPress={() => setIsDatePickerVisible(false)}
                  >
                    <Text className="text-xs font-bold text-[#2563EB]">
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  mode="date"
                  onChange={handleDateChange}
                  value={parseDateValue(form.date)}
                />
              </View>
            </View>
          </Modal>
        ) : null}

        <BaseField
          label="Reference No."
          required
          placeholder="Invoice, receipt, or check sequence"
          value={form.referenceNumber}
          onChangeText={(value) => updateForm("referenceNumber", value)}
        />

        <View className="gap-4 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF]/95 p-4 shadow-sm">
          <ChoiceGroup
            choices={expenseStatusChoices}
            label="Transaction Status"
            value={form.status}
            onSelect={(value) => updateForm("status", value)}
          />
        </View>

        <BaseField
          label="Description"
          multiline
          placeholder="Optional expenditure breakdown details..."
          value={form.description}
          onChangeText={(value) => updateForm("description", value)}
        />
      </AddEditModal>
    </Screen>
  );
}
