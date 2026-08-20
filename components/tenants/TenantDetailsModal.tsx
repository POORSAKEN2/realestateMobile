import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { BottomSheetModal } from "../ui/BottomSheetModal";
import type { Lessee } from "../../types";

export function TenantDetailsModal({
  linkedLeaseCount,
  onClose,
  tenant,
}: {
  linkedLeaseCount?: number;
  onClose: () => void;
  tenant: Lessee | null;
}) {
  return (
    <BottomSheetModal
      backdropAccessibilityLabel="Close tenant details"
      backdropClassName="bg-textPrimary/40"
      closeOnBackdropPress={false}
      onClose={onClose}
      visible={Boolean(tenant)}
    >
      <View className="rounded-t-[32px] bg-white px-6 pb-20 pt-6">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="font-ralewayExtraBold text-2xl text-textPrimary">
              {tenant?.name}
            </Text>
            <Text className="mt-1 text-sm text-description">
              {tenant?.contactEmail || "No email on file"}
            </Text>
            <Text className="mt-1 text-sm text-description">
              {tenant?.phone || "No phone on file"}
            </Text>
            {linkedLeaseCount !== undefined ? (
              <View className="mt-5 rounded-2xl border border-secondary/20 bg-secondary/10 p-4">
                <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
                  Active Records
                </Text>
                <Text className="mt-1 font-ralewayExtraBold text-base text-textPrimary">
                  {linkedLeaseCount} linked leases
                </Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity
            accessibilityLabel="Close tenant details"
            className="h-10 w-10 items-center justify-center rounded-full bg-secondary/10"
            onPress={onClose}
          >
            <Ionicons name="close" color="#634CE4" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetModal>
  );
}
