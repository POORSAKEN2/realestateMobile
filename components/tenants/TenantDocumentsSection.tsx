import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { PropertyDocument } from "../../types";
import { SkeletonBlock, SkeletonGroup } from "../ui/Skeleton";
import { DetailError, TenantSection } from "./TenantFinancialLedgerSection";

export function TenantDocumentsSection({
  documents,
  error,
  isLoading,
  onAdd,
  onOpen,
  onSelect,
  onViewAll,
}: {
  documents: PropertyDocument[];
  error: unknown;
  isLoading: boolean;
  onAdd: () => void;
  onOpen: (document: PropertyDocument) => void;
  onSelect: () => void;
  onViewAll: () => void;
}) {
  return (
    <TenantSection icon="document-text-outline" title="Documentation & files">
      <View className="mb-3 flex-row justify-end gap-2">
        <SectionAction icon="link-outline" label="Select" onPress={onSelect} />
        <SectionAction
          icon="cloud-upload-outline"
          label="Add document"
          onPress={onAdd}
        />
      </View>

      {isLoading ? (
        <SkeletonGroup
          accessibilityLabel="Loading tenant documents"
          className="gap-2"
        >
          {Array.from({ length: 2 }, (_, index) => (
            <SkeletonBlock className="h-20 rounded-2xl" key={index} />
          ))}
        </SkeletonGroup>
      ) : error ? (
        <DetailError message="Tenant documents could not be loaded." />
      ) : documents.length ? (
        <View className="overflow-hidden rounded-2xl border border-primary/20 bg-white">
          {documents.slice(0, 4).map((document, index) => (
            <TouchableOpacity
              accessibilityHint="Opens the document"
              accessibilityLabel={`Open ${document.name}`}
              accessibilityRole="button"
              activeOpacity={0.75}
              className={`flex-row items-center gap-3 p-4 ${index ? "border-t border-primary/10" : ""}`}
              key={document.id}
              onPress={() => onOpen(document)}
            >
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Ionicons color="#8A77F4" name="document-outline" size={21} />
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  className="font-ralewayExtraBold text-sm text-textPrimary"
                  numberOfLines={1}
                >
                  {document.name}
                </Text>
                <Text className="mt-1 font-ralewayMedium text-[11px] text-description">
                  {[document.type, document.category, document.size]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
              <Ionicons color="#8A77F4" name="open-outline" size={18} />
            </TouchableOpacity>
          ))}
          {documents.length > 4 ? (
            <TouchableOpacity
              accessibilityRole="button"
              className="border-t border-primary/10 px-4 py-3"
              onPress={onViewAll}
            >
              <Text className="text-center font-ralewayBold text-xs text-secondary">
                View all {documents.length} documents
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <View className="items-center rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-7">
          <Ionicons color="#8A77F4" name="document-text-outline" size={30} />
          <Text className="mt-2 font-ralewayBold text-sm text-textPrimary">
            No documents attached
          </Text>
          <Text className="mt-1 text-center font-ralewayMedium text-xs text-description">
            Upload a lease, contract, or supporting file for this tenant.
          </Text>
        </View>
      )}
    </TenantSection>
  );
}

function SectionAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.75}
      className="min-h-10 flex-row items-center gap-2 rounded-xl border border-primary px-3"
      onPress={onPress}
    >
      <Ionicons color="#8A77F4" name={icon} size={16} />
      <Text className="font-ralewayBold text-xs text-secondary">{label}</Text>
    </TouchableOpacity>
  );
}
