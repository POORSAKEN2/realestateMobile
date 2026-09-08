import { Text, View } from "react-native";
import type { StaffGateway, StaffManager } from "../../types/domain/staff";
import { StaffActionButton } from "./StaffActionButton";
export function StaffManagerCard({ manager, gateway, busy, onEdit, onToggle, onRemove }: {
  manager: StaffManager; gateway: StaffGateway; busy: boolean;
  onEdit: () => void; onToggle: () => void; onRemove: () => void;
}) {
  const canToggle = manager.status === "active" || manager.status === "disabled";
  return <View className="gap-3 rounded-3xl border border-primary/15 bg-white p-5">
    <View><Text className="font-ralewayExtraBold text-lg text-textPrimary">{manager.name}</Text>
      <Text className="mt-1 text-description">{manager.email}</Text></View>
    <Text className="font-ralewayBold text-primary">{manager.status === "unknown" ? "Status unavailable" : manager.status === "invited" ? "Invitation pending" : manager.status === "disabled" ? "Disabled" : "Active"}</Text>
    {gateway.supportsAssignments && <Text className="text-description">{manager.propertyIds.length} assigned {manager.propertyIds.length === 1 ? "property" : "properties"}</Text>}
    <View className="flex-row flex-wrap gap-2">
      <StaffActionButton label="Edit" disabled={busy || !gateway.update} onPress={onEdit} />
      <StaffActionButton label={manager.status === "disabled" ? "Enable" : "Disable"} disabled={busy || !gateway.setEnabled || !canToggle} onPress={onToggle} />
      <StaffActionButton label="Remove" destructive disabled={busy || !gateway.remove} onPress={onRemove} />
    </View>
  </View>;
}
