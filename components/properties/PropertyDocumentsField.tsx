import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import type { PropertyDocument } from "../../types";
import {
  formatSelectedDocumentSize,
  openPropertyDocument,
  type SelectedDocument,
} from "../../utils/properties/propertyForm";

export function PropertyDocumentsField({
  documents,
  existingDocuments,
  isEditing,
  isLoadingExistingDocuments,
  onPick,
  onRemove,
}: {
  documents: SelectedDocument[];
  existingDocuments: PropertyDocument[];
  isEditing: boolean;
  isLoadingExistingDocuments: boolean;
  onPick: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <View className="gap-4 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF]/95 p-4 shadow-sm">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB]/5">
            <MaterialCommunityIcons
              name="file-document-outline"
              color="#2563EB"
              size={22}
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-[#1d1d1f]">
              Property Documents
            </Text>
            <Text className="mt-1 text-xs leading-4 text-[#6F6D6D]">
              PDF, DOC, DOCX, JPG, or PNG files.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityRole="button"
          className="rounded-full bg-[#2563EB] px-4 py-2.5"
          onPress={onPick}
        >
          <Text className="text-xs font-bold text-[#FFFFFF]">
            {documents.length > 0 ? "Add More" : "Choose"}
          </Text>
        </TouchableOpacity>
      </View>

      {isEditing ? (
        <View className="rounded-2xl bg-[#2563EB]/5 px-3 py-2">
          <Text className="text-xs leading-5 text-[#6F6D6D]">
            Existing documents stay attached. Add files here to upload more
            documents to this property.
          </Text>
        </View>
      ) : null}

      {isEditing ? (
        <View className="gap-2">
          <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
            Attached Documents
          </Text>
          {isLoadingExistingDocuments ? (
            <View className="h-14 justify-center rounded-2xl bg-[#2563EB]/5 px-3">
              <ActivityIndicator color="#2563EB" />
            </View>
          ) : existingDocuments.length > 0 ? (
            existingDocuments.map((document) => (
              <TouchableOpacity
                key={document.id}
                activeOpacity={0.8}
                className="flex-row items-center gap-3 rounded-2xl border border-[#1d1d1f]/10 bg-[#2563EB]/5 p-3"
                onPress={() => openPropertyDocument(document)}
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#FFFFFF]">
                  <MaterialCommunityIcons
                    name="file-eye-outline"
                    color="#2563EB"
                    size={18}
                  />
                </View>
                <View className="min-w-0 flex-1">
                  <Text
                    className="text-xs font-bold text-[#1d1d1f]"
                    numberOfLines={1}
                  >
                    {document.name}
                  </Text>
                  <Text className="mt-0.5 text-[11px] text-[#6F6D6D]">
                    {document.category} | {document.size}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="open-in-new"
                  color={document.url ? "#6F6D6D" : "#C8C8C8"}
                  size={17}
                />
              </TouchableOpacity>
            ))
          ) : (
            <View className="rounded-2xl border border-dashed border-[#1d1d1f]/15 bg-[#2563EB]/5 px-3 py-4">
              <Text className="text-center text-xs font-semibold text-[#6F6D6D]">
                No documents attached yet.
              </Text>
            </View>
          )}
        </View>
      ) : null}

      {documents.length > 0 ? (
        <View className="gap-2">
          <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
            New Uploads
          </Text>
          {documents.map((document, index) => (
            <View
              key={`${document.name}-${document.size ?? index}`}
              className="flex-row items-center gap-3 rounded-2xl border border-[#1d1d1f]/10 bg-[#2563EB]/5 p-3"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#FFFFFF]">
                <MaterialCommunityIcons
                  name="file-document-outline"
                  color="#2563EB"
                  size={18}
                />
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  className="text-xs font-bold text-[#1d1d1f]"
                  numberOfLines={1}
                >
                  {document.name}
                </Text>
                <Text className="mt-0.5 text-[11px] text-[#6F6D6D]">
                  {formatSelectedDocumentSize(document.size)}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                accessibilityLabel={`Remove ${document.name}`}
                accessibilityRole="button"
                className="h-8 w-8 items-center justify-center rounded-full bg-[#FFFFFF]"
                onPress={() => onRemove(index)}
              >
                <MaterialCommunityIcons
                  name="close"
                  color="#6F6D6D"
                  size={17}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
