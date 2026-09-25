import { ActionSheet, type ActionSheetItem } from "../ui/ActionSheet";
import type { Expense } from "../../types/domain/expenses";

export function ExpenseActionSheet({
  expense,
  onClose,
  onEdit,
  onView,
}: {
  expense: Expense | null;
  onClose: () => void;
  onEdit?: (expense: Expense) => void;
  onView?: (expense: Expense) => void;
}) {
  const actions: ActionSheetItem[] = expense
    ? [
        ...(onView
          ? [
              {
                description:
                  "Review lifecycle, evidence, and immutable activity.",
                icon: "shield-check-outline" as const,
                label: "Open governance",
                permission: "expenses.approve" as const,
                propertyId: expense.property_id,
                onPress: () => onView(expense),
              },
            ]
          : []),
        ...(onEdit
          ? [
              {
                description:
                  "Update expense details, payment status, or notes.",
                icon: "pencil-outline" as const,
                label: "Edit expense",
                permission: "expenses.update" as const,
                propertyId: expense.property_id,
                onPress: () => onEdit(expense),
              },
            ]
          : []),
      ]
    : [];

  return (
    <ActionSheet
      actions={actions}
      onClose={onClose}
      subtitle={expense?.description || expense?.category.replaceAll("_", " ")}
      title="Expense actions"
      visible={Boolean(expense)}
    />
  );
}
