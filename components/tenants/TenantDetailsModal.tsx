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
      <View className="flex-1 justify-end bg-[#1d1d1f]/40">
        <View className="rounded-t-[32px] bg-white p-6">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-[#1d1d1f]">
                {tenant?.name}
              </Text>
              <Text className="mt-1 text-sm text-[#6F6D6D]">
                {tenant?.contactEmail || "No email on file"}
              </Text>
              <Text className="mt-1 text-sm text-[#6F6D6D]">
                {tenant?.phone || "No phone on file"}
              </Text>
              {linkedLeaseCount !== undefined ? (
                <View className="mt-5 rounded-2xl bg-[#2563EB]/5 p-4">
                  <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
                    Active Records
                  </Text>
                  <Text className="mt-1 text-base font-bold text-[#1d1d1f]">
                    {linkedLeaseCount} linked leases
                  </Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity
              accessibilityLabel="Close tenant details"
              className="h-10 w-10 items-center justify-center rounded-full bg-[#1d1d1f]/5"
              onPress={onClose}
            >
              <Ionicons name="close" color="#1d1d1f" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
