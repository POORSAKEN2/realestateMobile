import { router, useLocalSearchParams } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import { PropertyDetailsModal } from "../../components/properties/PropertyDetailsModal";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import {
  ModuleEmptyState,
  ModuleLoadingState,
} from "../../components/ui/ModuleState";
import { Screen } from "../../components/ui/Screen";
import { appRoutes } from "../../constants/navigation";
import { useProperties } from "../../hooks/api/useProperties";
import { useAuth } from "../../hooks/useAuth";

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

function leavePropertyDetails() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(appRoutes.primary.properties);
}

export default function PropertyDetailsScreen() {
  const params = useLocalSearchParams<{
    propertyId?: string | string[];
    propertyTitle?: string | string[];
  }>();
  const propertyId = firstParam(params.propertyId);
  const propertyTitle = firstParam(params.propertyTitle) || "Property";
  const { session } = useAuth();
  const { useDetail } = useProperties(session?.accessToken);
  const propertyQuery = useDetail(propertyId);

  if (propertyQuery.data) {
    return (
      <PropertyDetailsModal
        accessToken={session?.accessToken}
        mode="screen"
        onClose={leavePropertyDetails}
        property={propertyQuery.data}
      />
    );
  }

  return (
    <Screen className="bg-surface">
      <View className="flex-1 gap-6">
        <ModuleHeader
          eyebrow="Portfolio Intelligence"
          leading={
            <SecondaryBackButton
              accessibilityLabel="Back from property details"
              fallbackRoute={appRoutes.primary.properties}
              variant="secondary"
            />
          }
          supportingText={propertyTitle}
          title="Property Details"
        />

        {propertyQuery.isLoading ? (
          <ModuleLoadingState
            description="Loading the complete property profile."
            title="Loading property details"
          />
        ) : (
          <View className="flex-1 justify-center gap-4">
            <ModuleEmptyState
              description={
                propertyId
                  ? (propertyQuery.error?.message ??
                    "The property profile could not be loaded.")
                  : "Open property details from the dashboard or Properties page."
              }
              icon={propertyId ? "cloud-offline-outline" : "home-outline"}
              title={
                propertyId
                  ? "Property details unavailable"
                  : "No property selected"
              }
            />
            {propertyId ? (
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.8}
                className="self-center rounded-xl bg-primary px-5 py-3"
                onPress={() => void propertyQuery.refetch()}
              >
                <Text className="font-ralewayBold text-white">Try again</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    </Screen>
  );
}
