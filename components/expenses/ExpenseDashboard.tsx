import { ScrollView, Text, View } from "react-native";

import {
  ExpenseDashboardCard,
  type ExpenseDashboardCardProps,
} from "./ExpenseDashboardCard";

const dashboardMetrics: ExpenseDashboardCardProps[] = [
  {
    label: "Monthly Spend",
    value: "₱128.4k",
    icon: "receipt-text-outline",
    visual: "spend",
  },
  {
    label: "Maintenance",
    value: "₱42.8k",
    icon: "tools",
    visual: "maintenance",
  },
  {
    label: "Utilities",
    value: "₱18.6k",
    icon: "lightning-bolt-outline",
    visual: "utilities",
  },
];

export function ExpenseDashboard() {
  return (
    <View>
      <Text className="font-ralewayBold text-[13px] uppercase text-[#18181B]">
        Overview Dashboard
      </Text>
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
