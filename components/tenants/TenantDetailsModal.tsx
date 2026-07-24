import { Ionicons } from "@expo/vector-icons";
import { Modal, Text, TouchableOpacity, View } from "react-native";

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
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={Boolean(tenant)}
    >
      <View className="bg-textPrimary/40 flex-1 justify-end">
        <View className="rounded-t-[32px] bg-white p-6">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="font-ralewayExtraBold text-textPrimary text-2xl">
                {tenant?.name}
              </Text>
              <Text className="mt-1 text-sm text-[#6F6D6D]">
                {tenant?.contactEmail || "No email on file"}
              </Text>
              <Text className="mt-1 text-sm text-[#6F6D6D]">
                {tenant?.phone || "No phone on file"}
              </Text>
              {linkedLeaseCount !== undefined ? (
                <View className="bg-secondary/20 mt-5 rounded-2xl p-4">
                  <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-[#6F6D6D]">
                    Active Records
                  </Text>
                  <Text className="font-ralewayExtraBold text-textPrimary mt-1 text-base">
                    {linkedLeaseCount} linked leases
                  </Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity
              accessibilityLabel="Close tenant details"
              className="bg-textPrimary/5 h-10 w-10 items-center justify-center rounded-full"
              onPress={onClose}
            >
              <Ionicons name="close" color="#1E1F45" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
