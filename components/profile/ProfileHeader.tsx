import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

type ProfileHeaderProps = {
  onBack: () => void;
};

export function ProfileHeader({ onBack }: ProfileHeaderProps) {
  return (
    <View className="flex-row items-center">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Go back"
        activeOpacity={0.7}
        onPress={onBack}
        className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white"
      >
        <Ionicons name="chevron-back" color="#0F172A" size={22} />
      </TouchableOpacity>
      <View className="ml-4 flex-1">
        <Text className="font-ralewayExtraBold text-2xl text-slate-950">
          Your profile
        </Text>
        <Text className="mt-0.5 text-sm text-slate-500">
          Keep your account details current
        </Text>
      </View>
    </View>
  );
}
