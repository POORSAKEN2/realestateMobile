import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

type ProfileAccountActionsProps = {
  onOpenSecurity: () => void;
  onSignOut: () => void;
};

export function ProfileAccountActions({
  onOpenSecurity,
  onSignOut,
}: ProfileAccountActionsProps) {
  return (
    <View className="mt-8 border-t border-slate-200 pt-6">
      <Text className="font-soraSemiBold text-base text-slate-950">
        Account
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.7}
        onPress={onOpenSecurity}
        className="mt-3 min-h-14 flex-row items-center rounded-2xl bg-white px-4"
      >
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
          <Ionicons
            name="shield-checkmark-outline"
            color="#475569"
            size={19}
          />
        </View>
        <Text className="ml-3 flex-1 font-soraMedium text-sm text-slate-800">
          Password and security
        </Text>
        <Ionicons name="chevron-forward" color="#94A3B8" size={20} />
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        activeOpacity={0.7}
        onPress={onSignOut}
        className="mt-3 min-h-14 flex-row items-center rounded-2xl bg-red-50 px-4"
      >
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-white">
          <Ionicons name="log-out-outline" color="#DC2626" size={19} />
        </View>
        <Text className="ml-3 flex-1 font-soraSemiBold text-sm text-red-600">
          Sign out
        </Text>
      </TouchableOpacity>
    </View>
  );
}
