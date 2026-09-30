import AddButton from "../ui/buttons/AddButton";
import { ModuleHeader } from "../ui/ModuleHeader";
import { SecondaryBackButton } from "../navigation/SecondaryBackButton";

type ExpenseHeaderProps = {
  onAddExpense: () => void;
};

export function ExpenseHeader({ onAddExpense }: ExpenseHeaderProps) {
  return (
    <ModuleHeader
      action={
        <AddButton permission="expenses.create"
          iconOnly
          onPress={onAddExpense}
          title="Record expense"
        />
      }
      eyebrow="Operations"
      leading={
        <SecondaryBackButton
          accessibilityLabel="Back from expenses"
          variant="secondary"
        />
      }
      title="Expenses"
    />
  );
}
