import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ActivityIndicator,
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
import {
  PickerField,
  PickerModalShell,
} from "../../components/ui/fields/PickerField";
import { FormSection } from "../../components/ui/forms/FormSection";
import { ChoiceGroup } from "../../components/ui/groups/ChoiceGroup";

import {
  cleanDecimal,
  formatPeso,
  parseDateValue,
} from "../../utils/expenses/expenseForm";
import { Expense } from "../../types/domain/expenses";
import { Choice } from "../../constants/propertyChoices";
import { useExpenseForm } from "../../hooks/expenses/useExpenseForm";

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

const expenseDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const summary = [
  { label: "Monthly Spend", value: "₱128.4k", icon: "receipt-outline" },
  { label: "Maintenance", value: "₱42.8k", icon: "construct-outline" },
  { label: "Utilities", value: "₱18.6k", icon: "flash-outline" },
] as const;

export default function ExpensesScreen() {
  const {
    closeForm,
    editingExpense,
    expenses,
    form,
    formError,
    handleDateChange,
    isDatePickerVisible,
    isFormVisible,
    isLoading,
    isSaving,
    openEditForm,
    openForm,
    propertyOptions,
    refetch,
    setIsDatePickerVisible,
    submit,
    updateForm,
  } = useExpenseForm();

  return (
    <Screen className="bg-slate-50">
      <View className="flex-1 gap-4">
        {/* Header Section */}
        <View className="flex-row items-center justify-between px-1">
          <View>
            <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-[2px] text-slate-400">
              Operations
            </Text>
            <Text className="font-ralewayBold text-3xl tracking-tight text-[#1d1d1f]">
              Expenses
            </Text>
          </View>
          <AddButton
            onPress={openForm}
            textClassName="font-ralewayBold text-sm text-white"
          />
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
                    <Text className="font-ralewayBold text-sm text-slate-500">
                      {item.label}
                    </Text>
                    <Text className="mt-1 font-ralewayExtraBold text-xl text-slate-950">
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
                    <Text className="font-ralewayExtraBold text-xs uppercase tracking-wider text-slate-400">
                      {expense.category}
                    </Text>
                    <Text
                      className="font-ralewayBold text-base text-slate-900"
                      numberOfLines={1}
                    >
                      {expense.description || "No description provided"}
                    </Text>
                    <Text className="font-ralewayMedium text-xs text-slate-500">
                      Ref: {expense.reference_no || "N/A"} • {expense.date}
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="font-ralewayBold text-base text-slate-900">
                      {formatPeso(expense.amount)}
                    </Text>
                    <View
                      className={`rounded-full px-2 py-0.5 ${expense.status === "Paid" ? "bg-emerald-50" : "bg-amber-50"}`}
                    >
                      <Text
                        className={`font-ralewayExtraBold text-[10px] ${expense.status === "Paid" ? "text-emerald-600" : "text-amber-600"}`}
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
        appearance="card"
        isVisible={isFormVisible}
        onClose={closeForm}
        title={editingExpense ? "Expense Details" : "Record an expense"}
        subtitle={
          editingExpense
            ? "Update properties operating costs."
            : "Track property costs and recurring operating expenses."
        }
        isPending={isSaving}
        submitText={editingExpense ? "Save Expense" : "Add Expense"}
        onSubmit={submit}
        formError={formError}
        showCancelAction
      >
        <View className="flex-row items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5">
          <MaterialCommunityIcons
            name="information-outline"
            color="#2563EB"
            size={20}
          />
          <Text className="min-w-0 flex-1 font-ralewayMedium text-sm leading-5 text-[#1E40AF]">
            Link each expense to a property for accurate reporting.
          </Text>
        </View>

        <FormSection
          icon="office-building-outline"
          title="Expense details"
          variant="card"
        >
          <DropdownField
            required
            label="Linked property"
            placeholder="Select a property"
            value={form.propertyId}
            options={propertyOptions}
            onSelect={(value) => updateForm("propertyId", value)}
            variant="filled"
          />

          <DropdownField
            required
            label="Category"
            placeholder="Select expense category"
            value={form.category}
            options={expenseCategoryChoices}
            onSelect={(value) => updateForm("category", value)}
            variant="filled"
          />
        </FormSection>

        <FormSection
          icon="cash-multiple"
          title="Payment details"
          variant="card"
        >
          <BaseField
            keyboardType="decimal-pad"
            label="Amount (PHP)"
            placeholder="0.00"
            value={form.amount}
            onChangeText={(value) => updateForm("amount", cleanDecimal(value))}
            required
            variant="filled"
          />

          <View className="flex-row gap-3">
            <PickerField
              className="min-w-0 flex-1 gap-2"
              label="Transaction date"
              placeholder="Select transaction date"
              required
              value={
                form.date
                  ? expenseDateFormatter.format(parseDateValue(form.date))
                  : ""
              }
              onPress={() => setIsDatePickerVisible(true)}
              variant="filled"
            />

            <BaseField
              label="Reference number"
              placeholder="Optional"
              value={form.referenceNumber}
              onChangeText={(value) => updateForm("referenceNumber", value)}
              variant="filled"
              wrapperClassName="min-w-0 flex-1"
            />
          </View>

          {isDatePickerVisible ? (
            <PickerModalShell
              onClose={() => setIsDatePickerVisible(false)}
              title="Select transaction date"
            >
              <DateTimePicker
                display={Platform.OS === "ios" ? "inline" : "default"}
                mode="date"
                onChange={handleDateChange}
                value={parseDateValue(form.date)}
              />
            </PickerModalShell>
          ) : null}
        </FormSection>

        <FormSection
          icon="clipboard-text-outline"
          title="Status & notes"
          variant="card"
        >
          <ChoiceGroup
            choices={expenseStatusChoices}
            label="Transaction status"
            value={form.status}
            onSelect={(value) => updateForm("status", value)}
            variant="segmented"
          />

          <BaseField
            label="Description"
            multiline
            numberOfLines={4}
            placeholder="Add an optional cost breakdown or note"
            value={form.description}
            onChangeText={(value) => updateForm("description", value)}
            variant="filled"
          />
        </FormSection>
      </AddEditModal>
    </Screen>
  );
}
