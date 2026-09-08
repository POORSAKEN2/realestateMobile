import { ActionSheet, type ActionSheetItem } from "../ui/ActionSheet";
import type { Expense } from "../../types/domain/expenses";

export function ExpenseActionSheet({
  expense,
  onClose,
  onEdit,
  onApprove,
  onReject,
}: {
  expense: Expense | null;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onApprove?: (expense: Expense) => void;
  onReject?: (expense: Expense) => void;
}) {
  const isPendingApproval = !expense?.approval_status || expense.approval_status === "Pending";

  const actions: ActionSheetItem[] = expense
    ? [
        {
          description: "Update expense details, payment status, or notes.",
          icon: "pencil-outline",
          label: "Edit expense",
          permission: "expenses.update" as const,
          propertyId: expense.property_id,
          onPress: () => onEdit(expense),
        },
        ...(isPendingApproval && onApprove
          ? [
              {
                description: "Authorize and approve this operating expense.",
                icon: "check-circle-outline" as const,
                label: "Approve expense",
          permission: "expenses.approve" as const,
          propertyId: expense.property_id,
                onPress: () => onApprove(expense),
              },
            ]
          : []),
        ...(isPendingApproval && onReject
          ? [
              {
                description: "Decline and reject this expense item.",
                icon: "close-circle-outline" as const,
                label: "Reject expense",
          permission: "expenses.approve" as const,
          propertyId: expense.property_id,
                onPress: () => onReject(expense),
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
