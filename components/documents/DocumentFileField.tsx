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
      <Text className="font-soraMedium text-sm text-slate-600">
        File{!editingDocument ? <Text className="text-red-600"> *</Text> : null}
      </Text>
      <View
        className={`flex-row items-center gap-2 rounded-2xl border border-dashed bg-blue-50 p-2 ${error ? "border-red-400" : "border-blue-300"}`}
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
              color="#2563EB"
              size={23}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text
              className="font-soraBold text-sm text-slate-950"
              numberOfLines={1}
            >
              {selectedFile
                ? selectedFile.name
                : editingDocument
                  ? "Choose replacement file"
                  : "Choose file"}
            </Text>
            <Text className="mt-1 font-sora text-xs text-slate-500">
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
            <MaterialCommunityIcons name="close" color="#64748B" size={19} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="assertive"
          className="font-soraMedium text-xs text-red-600"
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
