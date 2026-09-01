import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import { ProfileAvatar } from "./ProfileAvatar";

type ProfileIdentityCardProps = {
  imageUri?: string;
  name: string;
  onPress: () => void;
  roleLabel: string;
};

export function ProfileIdentityCard({
  imageUri,
  name,
  onPress,
  roleLabel,
}: ProfileIdentityCardProps) {
  return (
    <TouchableOpacity
      accessibilityHint="Opens account details"
      accessibilityLabel={`${name}, ${roleLabel}`}
      accessibilityRole="button"
      activeOpacity={0.78}
      className="mt-7 min-h-28 flex-row items-center rounded-[26px] border border-primary/20 bg-white px-5 py-5 shadow-sm shadow-primary/10"
      onPress={onPress}
    >
      <ProfileAvatar imageUri={imageUri} name={name} size="large" tone="mint" />
      <View className="ml-4 min-w-0 flex-1">
        <Text
          className="font-ralewayExtraBold text-xl text-textPrimary"
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text className="mt-1 text-base text-description" numberOfLines={1}>
          {roleLabel}
        </Text>
      </View>
      <Ionicons name="chevron-forward" color={colors.description} size={24} />
    </TouchableOpacity>
  );
}
