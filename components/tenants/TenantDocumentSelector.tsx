import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { PropertyDocument } from "../../types";
import { SearchField } from "../ui/fields/SearchField";
import { SkeletonBlock, SkeletonGroup } from "../ui/Skeleton";

export type TenantDocumentSelectorProps = {
  documents: PropertyDocument[];
  error: unknown;
  isLinking: boolean;
  isLoading: boolean;
  linkingDocumentId?: string;
  onBack: () => void;
  onChangeQuery: (query: string) => void;
  onLink: (document: PropertyDocument) => void;
  query: string;
};

export function TenantDocumentSelector({
  documents,
  error,
  isLinking,
  isLoading,
  linkingDocumentId,
  onBack,
  onChangeQuery,
  onLink,
  query,
}: TenantDocumentSelectorProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityViewIsModal
      className="overflow-hidden rounded-t-[30px] bg-white"
      style={{ height: height * 0.84, paddingBottom: insets.bottom + 8 }}
    >
      <View className="flex-row items-center border-b border-textPrimary/10 px-5 pb-4 pt-2">
        <Text
          accessibilityRole="header"
          className="min-w-0 flex-1 font-ralewayExtraBold text-lg text-textPrimary"
        >
          Select Existing Document
        </Text>
        <TouchableOpacity
          accessibilityLabel="Back to tenant details"
          accessibilityRole="button"
          activeOpacity={0.75}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface"
          disabled={isLinking}
          onPress={onBack}
        >
          <Ionicons color="#6F6D6D" name="close" size={21} />
        </TouchableOpacity>
      </View>

      <View className="px-5 pb-3 pt-4">
        <SearchField
          accessibilityLabel="Search document vault"
          clearAccessibilityLabel="Clear document vault search"
          onChangeText={onChangeQuery}
          placeholder="Search vault..."
          value={query}
          wrapperClassName="border-textPrimary/10 bg-surface"
        />
      </View>

      {isLoading ? (
        <SkeletonGroup
          accessibilityLabel="Loading available documents"
          className="gap-2 px-5 pb-5"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonBlock className="h-20 rounded-2xl" key={index} />
          ))}
        </SkeletonGroup>
      ) : error ? (
        <SelectorMessage
          description="Return to tenant details and try again."
          icon="alert-circle-outline"
          title="Documents could not be loaded"
        />
      ) : (
        <FlatList
          className="flex-1"
          contentContainerClassName="gap-2 px-5 pb-5"
          data={documents}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(document) => document.id}
          ListEmptyComponent={
            <SelectorMessage
              description={
                query.trim()
                  ? "Try a different document name, category, or file type."
                  : "All vault documents are already assigned to tenants."
              }
              icon="document-text-outline"
              title={
                query.trim()
                  ? "No matching documents"
                  : "No documents available"
              }
            />
          }
          renderItem={({ item }) => (
            <DocumentOption
              document={item}
              disabled={isLinking}
              isLinking={linkingDocumentId === item.id}
              onLink={() => onLink(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function DocumentOption({
  disabled,
  document,
  isLinking,
  onLink,
}: {
  disabled: boolean;
  document: PropertyDocument;
  isLinking: boolean;
  onLink: () => void;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-textPrimary/10 bg-white p-4">
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-dangerSurface">
        <Ionicons color="#B42318" name="document-outline" size={21} />
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className="font-ralewayExtraBold text-sm text-textPrimary"
          numberOfLines={1}
        >
          {document.name}
        </Text>
        <Text
          className="mt-1 font-ralewayMedium text-xs text-description"
          numberOfLines={1}
        >
          {[document.category, document.size].filter(Boolean).join(" · ")}
        </Text>
      </View>
      <TouchableOpacity
        accessibilityLabel={`Link ${document.name}`}
        accessibilityRole="button"
        activeOpacity={0.75}
        className="min-h-10 min-w-20 flex-row items-center justify-center gap-1.5 rounded-xl border border-primary px-3"
        disabled={disabled}
        onPress={onLink}
      >
        {isLinking ? (
          <ActivityIndicator color="#8A77F4" size="small" />
        ) : (
          <>
            <Ionicons color="#8A77F4" name="checkmark" size={16} />
            <Text className="font-ralewayBold text-xs text-secondary">
              Link
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function SelectorMessage({
  description,
  icon,
  title,
}: {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View className="items-center px-7 py-10">
      <Ionicons color="#8A77F4" name={icon} size={30} />
      <Text className="mt-3 text-center font-ralewayExtraBold text-sm text-textPrimary">
        {title}
      </Text>
      <Text className="mt-1 text-center font-ralewayMedium text-xs leading-5 text-description">
        {description}
      </Text>
    </View>
  );
}
