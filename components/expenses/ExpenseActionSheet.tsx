import { ActionSheet, type ActionSheetItem } from "../ui/ActionSheet";
import type { Expense } from "../../types/domain/expenses";

export function ExpenseActionSheet({
  expense,
  onClose,
  onEdit,
}: {
  expense: Expense | null;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
}) {
  const actions: ActionSheetItem[] = expense
    ? [
        {
          description: "Update expense details, payment status, or notes.",
          icon: "pencil-outline",
          label: "Edit expense",
          onPress: () => onEdit(expense),
        },
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
