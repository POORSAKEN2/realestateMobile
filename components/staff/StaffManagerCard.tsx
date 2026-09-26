import { Text, View } from "react-native";
import type { StaffGateway, StaffManager } from "../../types/domain/staff";
import { StaffActionButton } from "./StaffActionButton";
export function StaffManagerCard({
  manager,
  gateway,
  busy,
  onEdit,
  onResend,
  onToggle,
  onRemove,
}: {
  manager: StaffManager;
  gateway: StaffGateway;
  busy: boolean;
  onEdit: () => void;
  onResend: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const invitation = manager.kind === "invitation";
  const canToggle =
    !invitation &&
    (manager.status === "active" || manager.status === "disabled");
  const statusLabel = {
    active: "Active",
    disabled: "Disabled",
    pending: "Invitation pending",
    delivery_failed: "Delivery failed",
    expired: "Expired",
    unknown: "Status unavailable",
  }[manager.status];
  return (
    <View className="gap-3 rounded-3xl border border-primary/15 bg-panel p-5">
      <View>
        <Text className="font-ralewayExtraBold text-lg text-textPrimary">
          {manager.name}
        </Text>
        <Text className="mt-1 text-description">{manager.email}</Text>
      </View>
      <Text
        className={`font-ralewayBold ${manager.status === "delivery_failed" || manager.status === "expired" ? "text-danger" : "text-primary"}`}
      >
        {statusLabel}
      </Text>
      {gateway.supportsAssignments && (
        <Text className="text-description">
          {manager.propertyIds.length} assigned{" "}
          {manager.propertyIds.length === 1 ? "property" : "properties"}
        </Text>
      )}
      <View className="flex-row flex-wrap gap-2">
        <StaffActionButton
          label="Edit"
          disabled={
            busy || (invitation ? !gateway.updateInvitation : !gateway.update)
          }
          onPress={onEdit}
        />
        {invitation && (
          <StaffActionButton
            label="Resend"
            disabled={busy || !gateway.resendInvitation}
            onPress={onResend}
          />
        )}
        {!invitation && (
          <StaffActionButton
            label={manager.status === "disabled" ? "Enable" : "Disable"}
            disabled={busy || !gateway.setEnabled || !canToggle}
            onPress={onToggle}
          />
        )}
        <StaffActionButton
          label={invitation ? "Revoke" : "Remove"}
          destructive
          disabled={
            busy || (invitation ? !gateway.revokeInvitation : !gateway.remove)
          }
          onPress={onRemove}
        />
      </View>
    </View>
  );
}
