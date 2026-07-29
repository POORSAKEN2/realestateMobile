import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { Expense } from "../../types/domain/expenses";
import { formatPeso } from "../../utils/expenses/expenseForm";
import { ExpenseTransactionCard } from "./ExpenseTransactionCard";

type ExpenseTransactionListProps = {
  expenses: Expense[];
};

export function ExpenseTransactionList({
  expenses,
}: ExpenseTransactionListProps) {
  return (
    <View className="mt-4">
      <Text className="font-ralewayBold text-[13px] uppercase text-[#18181B]">
        Recent Transactions &amp; Approvals
      </Text>
      <View className="mt-3 gap-3">
        {expenses.length > 0 ? (
          expenses.map((expense) => (
            <ExpenseTransactionCard
              key={expense.id}
              expense={expense}
              formattedAmount={formatPeso(expense.amount)}
            />
          ))
        ) : (
          <View className="items-center rounded-[20px] border border-dashed border-[#D9D5E8] bg-white px-6 py-10">
            <MaterialCommunityIcons
              name="receipt-text-outline"
              color="#8D82B7"
              size={30}
            />
            <Text className="mt-3 font-ralewayBold text-sm text-[#37333F]">
              No recent transactions
            </Text>
            <Text className="mt-1 text-center font-ralewayMedium text-xs leading-5 text-[#77727F]">
              New expenses and approvals will appear here.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
