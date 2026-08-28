import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { DocumentUpload, PropertyDocument } from "../../types";

export function DocumentFileField({
  editingDocument,
  error,
  onClear,
  onPick,
  selectedFile,
}: {
  editingDocument: PropertyDocument | null;
  error?: string;
  onClear: () => void;
  onPick: () => void;
  selectedFile: DocumentUpload | null;
}) {
  return (
    <View className="gap-2">
      <Text className="font-ralewaySemiBold text-sm text-description">
        File{!editingDocument ? <Text className="text-danger"> *</Text> : null}
      </Text>
      <View
        className={`flex-row items-center gap-2 rounded-2xl border border-dashed bg-surface p-2 ${error ? "border-danger" : "border-textPrimary/20"}`}
      >
        <TouchableOpacity
          accessibilityLabel={
            selectedFile
              ? `Replace ${selectedFile.name}`
              : "Choose document file"
          }
          accessibilityRole="button"
          activeOpacity={0.82}
          className="min-h-14 min-w-0 flex-1 flex-row items-center gap-3 px-2"
          onPress={onPick}
        >
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
            <MaterialCommunityIcons
              name={
                selectedFile ? "file-check-outline" : "cloud-upload-outline"
              }
              color="#8A77F4"
              size={23}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text
              className="font-ralewayExtraBold text-sm text-textPrimary"
              numberOfLines={1}
            >
              {selectedFile
                ? selectedFile.name
                : editingDocument
                  ? "Choose replacement file"
                  : "Choose file"}
            </Text>
            <Text className="mt-1 font-ralewayMedium text-xs text-description">
              {selectedFile
                ? formatFileSize(selectedFile.size)
                : editingDocument
                  ? "Leave unchanged to keep the current file"
                  : "PDF, DOC, DOCX, JPG, or PNG · 10 MB max"}
            </Text>
          </View>
        </TouchableOpacity>
        {selectedFile ? (
          <TouchableOpacity
            accessibilityLabel={`Remove ${selectedFile.name}`}
            accessibilityRole="button"
            activeOpacity={0.75}
            className="h-11 w-11 items-center justify-center rounded-full bg-white"
            onPress={onClear}
          >
            <MaterialCommunityIcons name="close" color="#6F6D6D" size={19} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="assertive"
          className="font-ralewaySemiBold text-xs text-danger"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function formatFileSize(size?: number | null) {
  if (!size) return "Selected file";
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)} MB`;
  if (size >= 1_000) return `${Math.round(size / 1_000)} KB`;
  return `${size} B`;
}
