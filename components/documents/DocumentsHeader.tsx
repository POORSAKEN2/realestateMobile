import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

export function DocumentsHeader({
  documentCount,
  onUpload,
}: {
  documentCount: number;
  onUpload: () => void;
}) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <View className="min-w-0 flex-1">
        <Text
          accessibilityRole="header"
          className="font-soraBold text-[30px] leading-10 text-slate-950"
        >
          Documents
        </Text>
        <Text className="mt-1 font-sora text-sm text-slate-500">
          {documentCount} {documentCount === 1 ? "document" : "documents"}
        </Text>
      </View>

      <TouchableOpacity
        accessibilityLabel="Upload document"
        accessibilityRole="button"
        activeOpacity={0.85}
        className="min-h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4"
        onPress={onUpload}
      >
        <MaterialCommunityIcons name="plus" color="#FFFFFF" size={21} />
        <Text className="font-soraBold text-sm text-white">Upload</Text>
      </TouchableOpacity>
    </View>
  );
}
