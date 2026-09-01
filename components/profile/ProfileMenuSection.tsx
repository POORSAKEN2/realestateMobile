import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";

export type ProfileMenuItem = {
  accessibilityHint?: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
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
      className={`min-h-[72px] flex-row items-center px-5 ${
        isLast ? "" : "border-b border-primary/10"
      }`}
      onPress={item.onPress}
    >
      <View className="h-10 w-10 items-center justify-center">
        <Ionicons name={item.icon} color={colors.text} size={25} />
      </View>
      <Text className="ml-3 flex-1 font-ralewayBold text-base text-textPrimary">
        {item.label}
      </Text>
      <Ionicons
        name={item.trailingIcon ?? "chevron-forward"}
        color={colors.description}
        size={22}
      />
    </TouchableOpacity>
  );
}

export function ProfileMenuSection({ items, title }: ProfileMenuSectionProps) {
  return (
    <View className="mt-8">
      <Text className="mb-3 font-ralewayExtraBold text-xs uppercase tracking-[1.5px] text-primary">
        {title}
      </Text>
      <View className="overflow-hidden rounded-[24px] border border-primary/20 bg-white shadow-sm shadow-primary/10">
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
