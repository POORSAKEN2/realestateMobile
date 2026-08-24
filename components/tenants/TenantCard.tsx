import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { Lessee } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { colors } from "../../constants/colors";

export function TenantCard({
  tenant,
  leaseCount,
  monthlyRent,
  propertyNames,
  onDelete,
  onEdit,
  onOpen,
}: {
  tenant: Lessee;
  leaseCount: number;
  monthlyRent: number;
  propertyNames: string[];
  onDelete: () => void;
  onEdit: () => void;
  onOpen: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onOpen}
      className="w-full overflow-hidden rounded-3xl border border-primary/20 bg-white shadow-sm shadow-primary/10"
    >
      <View className="p-5">
        {/* --- HEADER: Identity & Actions --- */}
        <View className="flex-row items-start justify-between gap-3">
          {/* Avatar & Info */}
          <View className="min-w-0 flex-1 flex-row gap-3.5">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Ionicons name="person" color="#8A77F4" size={20} />
            </View>

            <View className="min-w-0 flex-1 pt-0.5">
              <View className="flex-row items-center gap-2">
                <Text
                  className="font-ralewayBold text-lg tracking-tight text-textPrimary"
                  numberOfLines={1}
                >
                  {tenant.name}
                </Text>
                {/* Subtle Inline Badge */}
                <View className="rounded-md bg-primary/10 px-2 py-0.5">
                  <Text className="font-ralewayExtraBold text-[10px] uppercase tracking-wider text-description">
                    {leaseCount} Lease{leaseCount === 1 ? "" : "s"}
                  </Text>
                </View>
              </View>

              {/* Contact Info (Simplified layout) */}
              <View className="mt-1 flex-row items-center gap-3">
                <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
                  <Ionicons name="mail" size={12} color={colors.description} />
                  <Text className="text-sm text-description" numberOfLines={1}>
                    {tenant.contactEmail || "No email"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions (Moved to top right to declutter bottom) */}
          <View className="flex-row items-center gap-1 rounded-full border border-primary/20 bg-primary/10 p-1">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              className="rounded-full p-1.5 hover:bg-primary/10"
            >
              <Ionicons name="pencil" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              className="rounded-full p-1.5 hover:bg-red-50"
            >
              <Ionicons name="trash" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- DIVIDER --- */}
        <View className="my-4 h-[1px] w-full bg-primary/10" />

        {/* --- METRICS GRID: Rent & Properties Side-by-Side --- */}
        <View className="flex-row items-center justify-between gap-4">
          {/* Financials */}
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name="wallet-outline"
                color={colors.description}
                size={14}
              />
              <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wider text-description">
                Monthly Rent
              </Text>
            </View>
            <Text
              className="mt-1.5 font-ralewayBold text-2xl tracking-tight text-secondary"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(monthlyRent)}
            </Text>
          </View>

          {/* Vertical Separator */}
          <View className="h-10 w-[1px] bg-primary/10" />

          {/* Assets/Properties */}
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name="business-outline"
                color={colors.description}
                size={14}
              />
              <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wider text-description">
                Properties
              </Text>
            </View>
            <Text
              className="mt-1.5 font-ralewaySemiBold text-sm leading-5 text-textPrimary"
              numberOfLines={2}
            >
              {propertyNames.length > 0
                ? propertyNames.join(", ")
                : "Unassigned"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
