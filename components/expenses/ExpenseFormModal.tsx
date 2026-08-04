import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { DropdownOption } from "../ui/fields/DropdownField";
import { AddEditModal } from "../ui/AddEditModal";
import { BaseField } from "../ui/fields/BaseField";
import { DropdownField } from "../ui/fields/DropdownField";
import { DateTimePickerModal } from "../ui/fields/DateTimePickerModal";
import { PickerField } from "../ui/fields/PickerField";
import { FormSection } from "../ui/forms/FormSection";
import { ChoiceGroup } from "../ui/groups/ChoiceGroup";
import type { Expense } from "../../types/domain/expenses";
import {
  cleanDecimal,
  parseDateValue,
  type FormState,
} from "../../utils/expenses/expenseForm";

const expenseCategoryChoices = [
  { label: "Maintenance & Repairs", value: "MAINTENANCE" },
  { label: "Utilities (Water, Electricity, etc.)", value: "UTILITIES" },
  { label: "Property Taxes", value: "TAXES" },
  { label: "Insurance", value: "INSURANCE" },
  { label: "Management Fees", value: "MANAGEMENT_FEES" },
  { label: "Other Operations", value: "OTHER" },
];

const expenseStatusChoices: {
  label: string;
  value: Expense["status"];
}[] = [
  { label: "Pending Approval", value: "Pending" },
  { label: "Paid", value: "Paid" },
];

const expenseDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

type ExpenseFormUpdater = <K extends keyof FormState>(
  key: K,
  value: FormState[K],
) => void;

type ExpenseFormModalProps = {
  editingExpense: Expense | null;
  form: FormState;
  formError: string;
  isDatePickerVisible: boolean;
  isSaving: boolean;
  isVisible: boolean;
  propertyOptions: readonly DropdownOption[];
  onClose: () => void;
  onDateConfirm: (selectedDate: Date) => void;
  onSetDatePickerVisible: (visible: boolean) => void;
  onSubmit: () => void;
  onUpdateForm: ExpenseFormUpdater;
};

export function ExpenseFormModal({
  editingExpense,
  form,
  formError,
  isDatePickerVisible,
  isSaving,
  isVisible,
  propertyOptions,
  onClose,
  onDateConfirm,
  onSetDatePickerVisible,
  onSubmit,
  onUpdateForm,
}: ExpenseFormModalProps) {
  return (
    <AddEditModal
      appearance="card"
      isVisible={isVisible}
      onClose={onClose}
      title={editingExpense ? "Expense Details" : "Record an expense"}
      subtitle={
        editingExpense
          ? "Update properties operating costs."
          : "Track property costs and recurring operating expenses."
      }
      isPending={isSaving}
      submitText={editingExpense ? "Save Expense" : "Add Expense"}
      onSubmit={onSubmit}
      formError={formError}
      showCancelAction
    >
      <View className="flex-row items-start gap-3 rounded-2xl border border-primary bg-secondary/10 px-4 py-3.5">
        <MaterialCommunityIcons
          name="information-outline"
          color="#634CE4"
          size={20}
        />
        <Text className="min-w-0 flex-1 font-ralewayMedium text-sm leading-5 text-primary">
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
          onSelect={(value) => onUpdateForm("propertyId", value)}
          variant="filled"
        />
        <DropdownField
          required
          label="Category"
          placeholder="Select expense category"
          value={form.category}
          options={expenseCategoryChoices}
          onSelect={(value) => onUpdateForm("category", value)}
          variant="filled"
        />
      </FormSection>

      <FormSection icon="cash-multiple" title="Payment details" variant="card">
        <BaseField
          keyboardType="decimal-pad"
          label="Amount (PHP)"
          placeholder="0.00"
          value={form.amount}
          onChangeText={(value) => onUpdateForm("amount", cleanDecimal(value))}
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
            onPress={() => onSetDatePickerVisible(true)}
            variant="filled"
          />
          <BaseField
            label="Reference number"
            placeholder="Optional"
            value={form.referenceNumber}
            onChangeText={(value) => onUpdateForm("referenceNumber", value)}
            variant="filled"
            wrapperClassName="min-w-0 flex-1"
          />
        </View>

        {isDatePickerVisible ? (
          <DateTimePickerModal
            mode="date"
            onClose={() => onSetDatePickerVisible(false)}
            onConfirm={onDateConfirm}
            title="Select transaction date"
            value={parseDateValue(form.date)}
          />
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
          onSelect={(value) => onUpdateForm("status", value)}
          variant="segmented"
        />
        <BaseField
          label="Description"
          multiline
          numberOfLines={4}
          placeholder="Add an optional cost breakdown or note"
          value={form.description}
          onChangeText={(value) => onUpdateForm("description", value)}
          variant="filled"
        />
      </FormSection>
    </AddEditModal>
  );
}
