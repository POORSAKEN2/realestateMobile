import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { StaffManager } from "../../types";

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "PM"
  );
}

export function StaffManagerCard({ manager }: { manager: StaffManager }) {
  const isActive = manager.status === "active";

  return (
    <View className="rounded-[24px] border border-primary/20 bg-white p-4 shadow-sm shadow-primary/10">
      <View className="flex-row items-center">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/15">
          <Text className="font-ralewayExtraBold text-base text-primary">
            {getInitials(manager.name)}
          </Text>
        </View>
        <View className="ml-3 min-w-0 flex-1">
          <Text
            className="font-ralewayExtraBold text-base text-textPrimary"
            numberOfLines={1}
          >
            {manager.name}
          </Text>
          <Text className="mt-1 text-sm text-description" numberOfLines={1}>
            {manager.email}
          </Text>
        </View>
        <View
          className={`rounded-full px-3 py-1.5 ${
            isActive ? "bg-successSurface" : "bg-warningSurface"
          }`}
        >
          <Text
            className={`font-ralewayBold text-xs ${
              isActive ? "text-success" : "text-warning"
            }`}
          >
            {isActive ? "Active" : "Pending"}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center border-t border-primary/10 pt-3">
        <Ionicons name="shield-checkmark-outline" color="#8A77F4" size={17} />
        <Text className="ml-2 text-sm text-description">
          Property access is configured separately
        </Text>
      </View>
    </View>
  );
}
