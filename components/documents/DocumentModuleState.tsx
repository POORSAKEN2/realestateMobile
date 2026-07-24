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
        className="h-52 items-center justify-center rounded-[24px] border border-slate-200 bg-white"
      >
        <ActivityIndicator color="#2563EB" />
        <Text className="mt-3 font-ralewaySemiBold text-sm text-slate-500">
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
    <View className="items-center rounded-[24px] border border-dashed border-slate-300 bg-white p-8">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
        <MaterialCommunityIcons name={icon} color="#2563EB" size={28} />
      </View>
      <Text className="mt-4 text-center font-ralewayExtraBold text-lg text-slate-950">
        {title}
      </Text>
      <Text className="mt-2 text-center font-ralewayMedium text-sm leading-6 text-slate-500">
        {description}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        className="mt-5 min-h-12 justify-center rounded-2xl bg-blue-600 px-5"
        onPress={onAction}
      >
        <Text className="font-ralewayExtraBold text-sm text-white">{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function DocumentFeedbackToast({ message }: { message: string }) {
  if (!message) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="absolute bottom-28 left-4 right-4 z-50 flex-row items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 shadow-lg shadow-slate-950/20"
    >
      <MaterialCommunityIcons
        name="check-circle-outline"
        color="#86EFAC"
        size={20}
      />
      <Text className="min-w-0 flex-1 font-ralewayBold text-sm text-white">
        {message}
      </Text>
    </View>
  );
}
