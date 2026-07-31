import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "react-native";

import { SecondaryBackButton } from "../navigation/SecondaryBackButton";
import { ModuleHeader } from "../ui/ModuleHeader";

export function DocumentsHeader({
  documentCount,
  onUpload,
}: {
  documentCount: number;
  onUpload: () => void;
}) {
  return (
    <ModuleHeader
      action={
        <TouchableOpacity
          accessibilityLabel="Upload document"
          accessibilityRole="button"
          activeOpacity={0.85}
          className="min-h-11 flex-row items-center justify-center gap-1.5 rounded-2xl bg-primary px-3.5"
          onPress={onUpload}
        >
          <MaterialCommunityIcons name="plus" color="#FFFFFF" size={20} />
          <Text className="font-ralewayExtraBold text-xs text-white">
            Upload
          </Text>
        </TouchableOpacity>
      }
      eyebrow="Portfolio Library"
      leading={
        <SecondaryBackButton accessibilityLabel="Back from documents" />
      }
      supportingText={`${documentCount} ${
        documentCount === 1 ? "document" : "documents"
      }`}
      title="Documents"
    />
  );
}
