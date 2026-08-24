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
    <View className="gap-4 rounded-[24px] border border-primary/20 bg-white p-4 shadow-sm shadow-primary/10">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
            <MaterialCommunityIcons
              name="file-document-outline"
              color="#8A77F4"
              size={22}
            />
          </View>
          <View className="flex-1">
            <Text className="font-ralewayExtraBold text-sm text-textPrimary">
              Property documents
            </Text>
            <Text className="mt-1 text-xs leading-4 text-description">
              PDF, DOC, DOCX, JPG, or PNG files.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityLabel={
            documents.length > 0
              ? "Add more property documents"
              : "Choose property documents"
          }
          accessibilityRole="button"
          className="min-h-11 justify-center rounded-2xl bg-primary px-4 py-2.5"
          onPress={onPick}
        >
          <Text className="font-ralewayExtraBold text-xs text-[#FFFFFF]">
            {documents.length > 0 ? "Add More" : "Choose"}
          </Text>
        </TouchableOpacity>
      </View>

      {isEditing ? (
        <View className="gap-2">
          <Text className="font-ralewayBold text-xs text-description">
            Attached documents
          </Text>
          {isLoadingExistingDocuments ? (
            <View className="h-14 justify-center rounded-2xl border border-primary/20 bg-white px-3">
              <ActivityIndicator color="#8A77F4" />
            </View>
          ) : existingDocuments.length > 0 ? (
            existingDocuments.map((document) => (
              <TouchableOpacity
                key={document.id}
                activeOpacity={0.8}
                className="flex-row items-center gap-3 rounded-2xl border border-primary/20 bg-white p-3"
                onPress={() => openPropertyDocument(document)}
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <MaterialCommunityIcons
                    name="file-eye-outline"
                    color="#8A77F4"
                    size={18}
                  />
                </View>
                <View className="min-w-0 flex-1">
                  <Text
                    className="font-ralewayBold text-sm text-textPrimary"
                    numberOfLines={1}
                  >
                    {document.name}
                  </Text>
                  <Text className="mt-0.5 text-[11px] text-description">
                    {document.category} | {document.size}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="open-in-new"
                  color={document.url ? "#8A77F4" : "#BEE3DB"}
                  size={17}
                />
              </TouchableOpacity>
            ))
          ) : (
            <View className="rounded-2xl border border-dashed border-primary/20 bg-white px-3 py-4">
              <Text className="text-center font-ralewayBold text-xs text-description">
                No documents attached yet.
              </Text>
            </View>
          )}
        </View>
      ) : null}

      {documents.length > 0 ? (
        <View className="gap-2">
          <Text className="font-ralewayBold text-xs text-description">
            New uploads
          </Text>
          {documents.map((document, index) => (
            <View
              key={`${document.name}-${document.size ?? index}`}
              className="flex-row items-center gap-3 rounded-2xl border border-primary/20 bg-white p-3"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <MaterialCommunityIcons
                  name="file-document-outline"
                  color="#8A77F4"
                  size={18}
                />
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  className="font-ralewayBold text-sm text-textPrimary"
                  numberOfLines={1}
                >
                  {document.name}
                </Text>
                <Text className="mt-0.5 text-[11px] text-description">
                  {formatSelectedDocumentSize(document.size)}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                accessibilityLabel={`Remove ${document.name}`}
                accessibilityRole="button"
                className="h-11 w-11 items-center justify-center rounded-full bg-[#FFFFFF]"
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
