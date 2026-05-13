import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";

import { Screen } from "../../components/ui/Screen";

const summary = [
  { label: "Monthly Spend", value: "₱128.4k", icon: "receipt-outline" },
  { label: "Maintenance", value: "₱42.8k", icon: "construct-outline" },
  { label: "Utilities", value: "₱18.6k", icon: "flash-outline" },
] as const;

export default function ExpensesScreen() {
  return (
    <Screen className="bg-slate-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Operations
          </Text>
          <Text className="mt-2 text-3xl font-bold text-slate-950">
            Expenses
          </Text>
          <Text className="mt-2 text-base leading-6 text-slate-500">
            Track property costs, maintenance spend, and recurring operating
            expenses.
          </Text>
        </View>

        <View className="gap-3">
          {summary.map((item) => (
            <View
              key={item.label}
              className="flex-row items-center rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/10"
            >
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                <Ionicons name={item.icon} color="#2563EB" size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-500">
                  {item.label}
                </Text>
                <Text className="mt-1 text-xl font-bold text-slate-950">
                  {item.value}
                </Text>
              </View>
              <Ionicons name="chevron-forward" color="#CBD5E1" size={20} />
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
