import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { Lease, Lessee, Property } from "../../types";
import { formatCurrency } from "../../utils/formatters";

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
      className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-300/30"
    >
      <View className="p-5">
        {/* --- HEADER: Identity, Status & Actions --- */}
        <View className="flex-row items-start justify-between gap-3">
          {/* Identity & Location */}
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-2">
              <Text
                className="min-w-0 flex-1 font-soraSemiBold text-lg tracking-tight text-[#1d1d1f]"
                numberOfLines={1}
              >
                {lessee?.name ?? lease.lessee?.name ?? "Unknown Tenant"}
              </Text>

              {/* Semantic Status Pill */}
              <View
                className={`shrink-0 rounded-md px-2 py-0.5 ${
                  isActive
                    ? "bg-emerald-50"
                    : isExpired
                      ? "bg-rose-50"
                      : "bg-slate-100"
                }`}
              >
                <Text
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isActive
                      ? "text-emerald-600"
                      : isExpired
                        ? "text-rose-600"
                        : "text-slate-600"
                  }`}
                >
                  {lease.status}
                </Text>
              </View>
            </View>

            {/* Grouped Property Details */}
            <View className="mt-1 flex-row items-center gap-1.5">
              <Ionicons name="business-outline" size={14} color="#94A3B8" />
              <Text
                className="min-w-0 flex-1 text-sm font-medium text-slate-500"
                numberOfLines={1}
              >
                {property?.title ?? "Unknown Property"}
                {lease.roomNumber ? ` • Room ${lease.roomNumber}` : ""}
              </Text>
            </View>
          </View>

          {/* Quick Actions (Top Right to match Tenant Card) */}
          <View className="shrink-0 flex-row items-center gap-1 rounded-full border border-slate-100 bg-slate-50 p-1">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onEdit}
              className="rounded-full p-1.5 hover:bg-slate-200"
            >
              <Ionicons name="pencil" size={16} color="#64748B" />
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
        <View className="my-4 h-[1px] w-full bg-slate-100" />

        {/* --- METRICS GRID: Rent & Terms Side-by-Side --- */}
        <View className="flex-row items-center justify-between gap-4">
          {/* Financials */}
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="wallet-outline" color="#94A3B8" size={14} />
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Monthly Rent
              </Text>
            </View>
            <Text
              className="mt-1.5 font-soraSemiBold text-xl tracking-tight text-[#2563EB]"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(lease.monthlyRent)}
            </Text>
          </View>

          {/* Vertical Separator */}
          <View className="h-10 w-[1px] bg-slate-100" />

          {/* Lease Term */}
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="calendar-outline" color="#94A3B8" size={14} />
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Lease Term
              </Text>
            </View>
            <Text
              className="mt-1.5 text-sm font-medium leading-5 text-[#1d1d1f]"
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
