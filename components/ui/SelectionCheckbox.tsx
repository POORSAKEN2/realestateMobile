import { Text, TouchableOpacity } from "react-native";

export function SelectionCheckbox({
  label,
  selected,
  onPress,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-11 justify-center rounded-xl border px-3 py-2 ${selected ? "border-primary bg-primary/10" : "border-primary/20"}`}
    >
      <Text
        className={
          selected ? "font-ralewayBold text-primary" : "text-description"
        }
      >
        {selected ? "✓ " : ""}
        {label}
      </Text>
    </TouchableOpacity>
  );
}
