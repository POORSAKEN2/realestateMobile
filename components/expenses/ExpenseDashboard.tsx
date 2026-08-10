import type { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";

import type { Expense } from "../../types/domain/expenses";
import {
  formatExpenseCategory,
  getMonthlyExpenseSummary,
} from "../../utils/expenses/expenseDashboard";
import { formatPeso } from "../../utils/expenses/expenseForm";
import {
  ExpenseDashboardCard,
  type ExpenseDashboardCardProps,
  type ExpenseDashboardVisual,
} from "./ExpenseDashboardCard";

type CategoryPresentation = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  visual: ExpenseDashboardVisual;
};

const CATEGORY_PRESENTATION: Record<string, CategoryPresentation> = {
  INSURANCE: {
    icon: "shield-check-outline",
    label: "Insurance",
    visual: "insurance",
  },
  MAINTENANCE: {
    icon: "tools",
    label: "Maintenance & Repairs",
    visual: "maintenance",
  },
  MANAGEMENT_FEES: {
    icon: "briefcase-outline",
    label: "Management Fees",
    visual: "management",
  },
  OTHER: {
    icon: "receipt-text-outline",
    label: "Other Operations",
    visual: "other",
  },
  TAXES: { icon: "bank-outline", label: "Property Taxes", visual: "taxes" },
  UTILITIES: {
    icon: "lightning-bolt-outline",
    label: "Utilities",
    visual: "utilities",
  },
};

function getCategoryPresentation(category: string): CategoryPresentation {
  return (
    CATEGORY_PRESENTATION[category] ?? {
      icon: "cash-multiple",
      label: formatExpenseCategory(category),
      visual: "spend",
    }
  );
}

export function ExpenseDashboard({ expenses }: { expenses: Expense[] }) {
  const summary = useMemo(() => getMonthlyExpenseSummary(expenses), [expenses]);
  const dashboardMetrics = useMemo<ExpenseDashboardCardProps[]>(
    () => [
      {
        label: "Monthly Spend",
        value: formatPeso(summary.total),
        icon: "receipt-text-outline",
        visual: "spend",
      },
      ...summary.categoryTotals.map(({ category, total }) => ({
        ...getCategoryPresentation(category),
        value: formatPeso(total),
      })),
    ],
    [summary],
  );

  return (
    <View>
      <View className="flex-row items-end justify-between gap-3">
        <Text className="font-ralewayBold text-[13px] uppercase text-[#18181B]">
          Overview Dashboard
        </Text>
        <Text className="font-ralewayMedium text-[11px] text-[#77727F]">
          {summary.monthLabel}
        </Text>
      </View>
      <ScrollView
        className="-mx-1 mt-3"
        contentContainerStyle={{
          gap: 12,
          paddingHorizontal: 4,
          paddingBottom: 18,
          paddingRight: 28,
        }}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
      >
        {dashboardMetrics.map((metric) => (
          <ExpenseDashboardCard key={metric.label} {...metric} />
        ))}
      </ScrollView>
    </View>
  );
}
