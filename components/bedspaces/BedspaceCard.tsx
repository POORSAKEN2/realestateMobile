import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { Bedspace, BedspaceStatus } from "../../types";
import { formatCurrency } from "../../utils/formatters";

const STATUS_STYLES: Record<
  BedspaceStatus,
  { background: string; dot: string; text: string }
> = {
  Maintenance: {
    background: "border-warning/25 bg-warningSurface",
    dot: "bg-warning",
    text: "text-warning",
  },
  Occupied: {
    background: "border-info/20 bg-infoSurface",
    dot: "bg-info",
    text: "text-info",
  },
  Vacant: {
    background: "border-success/25 bg-successSurface",
    dot: "bg-success",
    text: "text-success",
  },
};

export function BedspaceCard({ bedspace }: { bedspace: Bedspace }) {
  const statusStyle = STATUS_STYLES[bedspace.status];

  return (
    <View className="rounded-2xl border border-textPrimary/10 bg-white p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <MaterialCommunityIcons
            name="bed-single-outline"
            color="#8A77F4"
            size={21}
          />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            className="font-ralewayBold text-base text-textPrimary"
            numberOfLines={1}
          >
            Bedspace {bedspace.bedspaceNumber}
          </Text>
          <Text className="mt-0.5 font-ralewaySemiBold text-sm text-secondary">
            {formatCurrency(bedspace.monthlyPrice)} / month
          </Text>
        </View>
        <View
          accessibilityLabel={`Status: ${bedspace.status}`}
          className={`flex-row items-center gap-1.5 rounded-full border px-2.5 py-2 ${statusStyle.background}`}
        >
          <View className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
          <Text className={`font-ralewayBold text-xs ${statusStyle.text}`}>
            {bedspace.status}
          </Text>
        </View>
      </View>

      {bedspace.activeLeaseId || bedspace.notes ? (
        <View className="mt-3 border-t border-textPrimary/10 pt-3">
          {bedspace.activeLeaseId ? (
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons
                name="account-check-outline"
                color="#2563EB"
                size={16}
              />
              <Text className="font-ralewaySemiBold text-xs text-info">
                Active lease assigned
              </Text>
            </View>
          ) : null}
          {bedspace.notes ? (
            <Text
              className={
                bedspace.activeLeaseId
                  ? "mt-2 text-xs leading-5 text-description"
                  : "text-xs leading-5 text-description"
              }
              numberOfLines={2}
            >
              {bedspace.notes}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
