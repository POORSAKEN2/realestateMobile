import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { Expense } from "../../types/domain/expenses";

function getExpenseIcon(
  category: string,
): keyof typeof MaterialCommunityIcons.glyphMap {
  const normalizedCategory = category.toUpperCase();

  if (normalizedCategory.includes("MAINTENANCE")) return "tools";
  if (normalizedCategory.includes("INSURANCE")) return "shield-check-outline";
  if (normalizedCategory.includes("UTILIT")) return "lightning-bolt-outline";
  if (normalizedCategory.includes("TAX")) return "bank-outline";
  if (normalizedCategory.includes("MANAGEMENT")) return "briefcase-outline";
  return "receipt-text-outline";
}

function formatExpenseCategory(category: string) {
  return category.replaceAll("_", " ").replaceAll(" & REPAIRS", "");
}

type ExpenseTransactionCardProps = {
  expense: Expense;
  formattedAmount: string;
};

export function ExpenseTransactionCard({
  expense,
  formattedAmount,
}: ExpenseTransactionCardProps) {
  const isPaid = expense.status === "Paid";
  const isCancelled = expense.status === "Cancelled";
  const statusContainerClass = isPaid
    ? "bg-accent"
    : isCancelled
      ? "bg-surface"
      : "bg-warningSurface";
  const statusTextClass = isPaid
    ? "text-success"
    : isCancelled
      ? "text-description"
      : "text-warning";

  return (
    <Pressable
      accessibilityLabel={`${expense.category}, ${expense.description ?? "Expense"}, ${formattedAmount}, ${expense.status}`}
      className="min-h-[84px] flex-row items-center rounded-[20px] border border-primary/20 bg-white px-3.5 py-3"
      style={{
        shadowColor: "#8A77F4",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-[14px] bg-primary/10 ">
        <MaterialCommunityIcons
          name={getExpenseIcon(expense.category)}
          color="#8A77F4"
          size={21}
        />
      </View>

      <View className="min-w-0 flex-1 pr-2">
        <Text
          className="font-ralewaySemiBold text-[11px] uppercase tracking-[0.4px] text-description"
          numberOfLines={1}
        >
          {formatExpenseCategory(expense.category)}
        </Text>
        <Text
          className="mt-0.5 font-ralewayMedium text-[14px] text-textPrimary"
          numberOfLines={1}
        >
          {expense.description || "No description provided"}
        </Text>
        <Text
          className="mt-1 font-ralewayMedium text-[10px] text-description"
          numberOfLines={1}
        >
          Ref: {expense.reference_no || "N/A"} • {expense.date}
        </Text>
      </View>

      <View className="items-end">
        <Text
          className="max-w-[98px] font-ralewayBold text-[14px] text-textPrimary"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formattedAmount}
        </Text>
        <View
          className={`mt-1.5 rounded-full px-2 py-0.5 ${statusContainerClass}`}
        >
          <Text
            className={`font-ralewayExtraBold text-[9px] uppercase ${statusTextClass}`}
          >
            {expense.status}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
