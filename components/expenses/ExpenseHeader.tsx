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
        <AddButton
          onPress={onAddExpense}
          title="Record"
          className="min-h-11 flex-row items-center gap-1.5 rounded-2xl bg-primary px-3.5"
          textClassName="font-ralewayBold text-xs text-white"
        />
      }
      eyebrow="Portfolio Operations"
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
