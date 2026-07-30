import { Text, View } from "react-native";

import AddButton from "../ui/buttons/AddButton";

type ExpenseHeaderProps = {
  onAddExpense: () => void;
};

export function ExpenseHeader({ onAddExpense }: ExpenseHeaderProps) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        accessibilityRole="header"
        className="font-ralewayExtraBold text-[28px] uppercase tracking-tight text-[#111113]"
      >
        Expenses
      </Text>
      <AddButton
        onPress={onAddExpense}
        title="New Expense"
        className="min-h-11 flex-row items-center gap-2 rounded-[15px] bg-primary px-4 py-3 shadow-lg shadow-primary/30"
        textClassName="font-ralewayBold text-[12px] uppercase text-white"
      />
    </View>
  );
}
