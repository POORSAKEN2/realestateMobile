import { Ionicons } from "@expo/vector-icons";
import { GestureResponderEvent, ScrollView, Text, View } from "react-native";

import { Screen } from "../../components/ui/Screen";
import AddButton from "../../components/ui/buttons/AddButton";
import { useState } from "react";
import { AddEditModal } from "../../components/ui/AddEditModal";
import { BaseField } from "../../components/ui/fields/BaseField";
import { DropdownField } from "../../components/ui/fields/DropdownField";
import { emptyForm, FormState } from "../../utils/expenses/expenseForm";

const summary = [
  { label: "Monthly Spend", value: "₱128.4k", icon: "receipt-outline" },
  { label: "Maintenance", value: "₱42.8k", icon: "construct-outline" },
  { label: "Utilities", value: "₱18.6k", icon: "flash-outline" },
] as const;

export default function ExpensesScreen() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  const handleSubmit = () => {};

  return (
    <Screen className="bg-slate-50">
      <View className="flex-1 gap-4">
        <View className="flex-row items-center justify-between px-1">
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-slate-400">
              Operations
            </Text>
            <Text className="font-soraSemiBold text-3xl tracking-tight text-[#1d1d1f]">
              Expenses
            </Text>
          </View>
          <AddButton onPress={() => setIsModalOpen(!isModalOpen)} />
        </View>
        {/* <Text className="mt-2 text-base leading-6 text-slate-500">
          Track property costs, maintenance spend, and recurring operating
          expenses.
        </Text> */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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

      <AddEditModal
        isVisible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={"Record an expense"}
        isPending={false}
        submitText={"Add Expense"}
        onSubmit={function (): void {
          throw new Error("Function not implemented.");
        }}
      >
        <DropdownField
          label={"Linked Asset"}
          value={"Asset"}
          options={[]}
          onSelect={function (value: string): void {
            throw new Error("Function not implemented.");
          }}
        />

        <BaseField
          label={"Amount"}
          value={""}
          onChangeText={() => console.log("amount")}
        />
        <BaseField
          label={"Reference No."}
          value={""}
          onChangeText={() => console.log("amount")}
        />
        <BaseField
          label={"Description"}
          multiline
          value={""}
          onChangeText={() => console.log("amount")}
        />
      </AddEditModal>
    </Screen>
  );
}
