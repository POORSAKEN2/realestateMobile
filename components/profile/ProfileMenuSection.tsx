import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";

export type ProfileMenuItem = {
  accessibilityHint?: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  supportingText?: string;
  badge?: string;
  trailingIcon?: keyof typeof Ionicons.glyphMap;
};

type ProfileMenuSectionProps = {
  items: ProfileMenuItem[];
  title: string;
};

function ProfileMenuRow({
  isLast,
  item,
}: {
  isLast: boolean;
  item: ProfileMenuItem;
}) {
  return (
    <TouchableOpacity
      accessibilityHint={item.accessibilityHint}
      accessibilityLabel={item.label}
      accessibilityRole="button"
      activeOpacity={0.72}
      className={`min-h-20 flex-row items-center px-5 py-3.5 ${
        isLast ? "" : "border-b border-primary/10"
      }`}
      onPress={item.onPress}
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
        <Ionicons name={item.icon} color={colors.primary} size={22} />
      </View>
      <View className="ml-3 min-w-0 flex-1">
        <Text className="font-ralewayMedium text-[15px] text-textPrimary">
          {item.label}
        </Text>
      </View>
      <Ionicons
        name={item.trailingIcon ?? "chevron-forward"}
        color={colors.primary}
        size={20}
      />
    </TouchableOpacity>
  );
}

export function ProfileMenuSection({ items, title }: ProfileMenuSectionProps) {
  return (
    <View className="mt-7">
      <Text className="mb-3 font-ralewayBold text-lg text-textPrimary">
        {title}
      </Text>
      <View className="overflow-hidden rounded-[28px] border border-primary/20 bg-white shadow-sm shadow-primary/10">
        {items.map((item, index) => (
          <ProfileMenuRow
            isLast={index === items.length - 1}
            item={item}
            key={item.label}
          />
        ))}
      </View>
    </View>
  );
}
