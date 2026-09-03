import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
export function StaffActionButton({ label, onPress, disabled = false, pending = false, destructive = false }: {
  label: string; onPress: () => void; disabled?: boolean; pending?: boolean; destructive?: boolean;
}) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled: disabled || pending, busy: pending }} disabled={disabled || pending}
    onPress={onPress} className={`min-h-12 items-center justify-center rounded-2xl border border-primary/20 px-4 py-3 ${disabled || pending ? "opacity-40" : ""}`}>
    {pending ? <ActivityIndicator /> : <Text className={`font-ralewayBold ${destructive ? "text-danger" : "text-primary"}`}>{label}</Text>}
  </TouchableOpacity>;
}
