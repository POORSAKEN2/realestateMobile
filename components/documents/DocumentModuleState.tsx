import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export function DocumentModuleState({
  isError,
  isFiltered,
  isLoading,
  onClearFilters,
  onRetry,
  onUpload,
}: {
  isError: boolean;
  isFiltered: boolean;
  isLoading: boolean;
  onClearFilters: () => void;
  onRetry: () => void;
  onUpload: () => void;
}) {
  if (isLoading) {
    return (
      <View
        accessibilityLabel="Loading documents"
        accessibilityRole="progressbar"
        className="h-52 items-center justify-center rounded-[24px] border border-secondary/20 bg-white"
      >
        <ActivityIndicator color="#634CE4" />
        <Text className="mt-3 font-ralewaySemiBold text-sm text-description">
          Loading documents
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <StateCard
        actionLabel="Try again"
        description="We couldn’t load the document library. Check your connection and try again."
        icon="cloud-alert-outline"
        onAction={onRetry}
        title="Documents unavailable"
      />
    );
  }

  if (isFiltered) {
    return (
      <StateCard
        actionLabel="Clear filters"
        description="Try a different search or remove some filters to see more documents."
        icon="file-search-outline"
        onAction={onClearFilters}
        title="No matching documents"
      />
    );
  }

  return (
    <StateCard
      actionLabel="Upload document"
      description="Add leases, compliance files, contracts, and maintenance records to your library."
      icon="file-document-plus-outline"
      onAction={onUpload}
      title="Build your document library"
    />
  );
}

function StateCard({
  actionLabel,
  description,
  icon,
  onAction,
  title,
}: {
  actionLabel: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onAction: () => void;
  title: string;
}) {
  return (
    <View className="items-center rounded-[24px] border border-dashed border-secondary/30 bg-white p-8">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
        <MaterialCommunityIcons name={icon} color="#634CE4" size={28} />
      </View>
      <Text className="mt-4 text-center font-ralewayExtraBold text-lg text-textPrimary">
        {title}
      </Text>
      <Text className="mt-2 text-center font-ralewayMedium text-sm leading-6 text-description">
        {description}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        className="mt-5 min-h-12 justify-center rounded-2xl bg-primary px-5"
        onPress={onAction}
      >
        <Text className="font-ralewayExtraBold text-sm text-white">
          {actionLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
