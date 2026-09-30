import { PermissionGate } from "../auth/PermissionGate";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

import { SecondaryBackButton } from "../navigation/SecondaryBackButton";
import { ModuleHeader } from "../ui/ModuleHeader";

export function DocumentsHeader({
  documentCount,
  isLoading = false,
  onUpload,
  showUpload = true,
}: {
  documentCount: number;
  isLoading?: boolean;
  onUpload: () => void;
  showUpload?: boolean;
}) {
  return (
    <ModuleHeader
      action={showUpload ? (
        <PermissionGate permission="documents.create"><TouchableOpacity
          accessibilityLabel="Upload document"
          accessibilityRole="button"
          activeOpacity={0.85}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-primary"
          onPress={onUpload}
        >
          <MaterialCommunityIcons name="plus" color="#FFFFFF" size={20} />
        </TouchableOpacity></PermissionGate>
      ) : undefined}
      eyebrow="Operations"
      leading={
        <SecondaryBackButton
          accessibilityLabel="Back from documents"
          variant="secondary"
        />
      }
      supportingText={
        isLoading
          ? "Loading library"
          : `${documentCount} ${documentCount === 1 ? "document" : "documents"}`
      }
      title="Documents"
    />
  );
}
