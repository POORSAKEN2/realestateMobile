import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

export type RadioOption<T extends string> = {
  label: string;
  value: T;
};

export function RadioOptionList<T extends string>({
  onSelect,
  options,
  value,
}: {
  onSelect: (value: T) => void;
  options: readonly RadioOption<T>[];
  value: T;
}) {
  return (
    <View className="gap-2">
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <TouchableOpacity
            key={option.value}
            accessibilityLabel={option.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            activeOpacity={0.8}
            className={`min-h-14 flex-row items-center justify-between rounded-2xl border px-4 ${
              selected
                ? "border-primary bg-primary/10"
                : "border-slate-200 bg-white"
            }`}
            onPress={() => onSelect(option.value)}
          >
            <Text
              className={`font-ralewayBold text-base ${
                selected ? "text-secondary" : "text-textPrimary"
              }`}
            >
              {option.label}
            </Text>
            {selected ? (
              <MaterialCommunityIcons
                name="check-circle"
                color="#8A77F4"
                size={21}
              />
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
