import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { Lease, Lessee, Property } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { colors } from "../../constants/colors";

export function LeaseCard({
  lease,
  property,
  lessee,
  onEdit,
  onDelete,
  onOpenTenant,
}: {
  lease: Lease;
  property?: Property;
  lessee?: Lessee;
  onEdit: () => void;
  onDelete: () => void;
  onOpenTenant: () => void;
}) {
  const isActive = lease.status === "Active";
  const isExpired = lease.status === "Expired";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onOpenTenant}
      className="w-full overflow-hidden rounded-3xl border border-secondary/20 bg-white shadow-sm shadow-secondary/10"
    >
      <View className="p-5">
        {/* --- HEADER: Identity, Status & Actions --- */}
        <View className="flex-row items-start justify-between gap-3">
          {/* Identity & Location */}
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-2">
              <Text
                className="min-w-0 flex-1 font-ralewayBold text-lg tracking-tight text-textPrimary"
                numberOfLines={1}
              >
                {lessee?.name ?? lease.lessee?.name ?? "Unknown Tenant"}
              </Text>

              {/* Semantic Status Pill */}
              <View
                className={`shrink-0 rounded-md px-2 py-0.5 ${
                  isActive
                    ? "bg-accent"
                    : isExpired
                      ? "bg-rose-50"
                      : "bg-secondary/10"
                }`}
              >
                <Text
                  className={`font-ralewayExtraBold text-[10px] uppercase tracking-wider ${
                    isActive
                      ? "text-textPrimary"
                      : isExpired
                        ? "text-rose-600"
                        : "text-description"
                  }`}
                >
                  {lease.status}
                </Text>
              </View>
            </View>

            {/* Grouped Property Details */}
            <View className="mt-1 flex-row items-center gap-1.5">
              <Ionicons
                name="business-outline"
                size={14}
                color={colors.description}
              />
              <Text
                className="min-w-0 flex-1 font-ralewaySemiBold text-sm text-description"
                numberOfLines={1}
              >
                {property?.title ?? "Unknown Property"}
                {lease.roomNumber ? ` • Room ${lease.roomNumber}` : ""}
              </Text>
            </View>
          </View>

          {/* Quick Actions (Top Right to match Tenant Card) */}
          <View className="shrink-0 flex-row items-center gap-1 rounded-full border border-secondary/20 bg-secondary/10 p-1">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onEdit}
              className="rounded-full p-1.5 hover:bg-secondary/10"
            >
              <Ionicons name="pencil" size={16} color={colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onDelete}
              className="rounded-full p-1.5 hover:bg-red-50"
            >
              <Ionicons name="trash" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- DIVIDER --- */}
        <View className="my-4 h-[1px] w-full bg-secondary/10" />

        {/* --- METRICS GRID: Rent & Terms Side-by-Side --- */}
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
              className="mt-1.5 font-ralewayBold text-xl tracking-tight text-secondary"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(lease.monthlyRent)}
            </Text>
          </View>

          {/* Vertical Separator */}
          <View className="h-10 w-[1px] bg-secondary/10" />

          {/* Lease Term */}
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name="calendar-outline"
                color={colors.description}
                size={14}
              />
              <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wider text-description">
                Lease Term
              </Text>
            </View>
            <Text
              className="mt-1.5 font-ralewaySemiBold text-sm leading-5 text-textPrimary"
              numberOfLines={1}
            >
              {lease.startDate} to {lease.endDate}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
