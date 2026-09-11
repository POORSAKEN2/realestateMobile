import { useLocalSearchParams } from "expo-router";
import { Linking, Text, TouchableOpacity, View } from "react-native";

import { UpgradePlanModal } from "../../components/billing/UpgradePlanModal";
import { InquiryDetail } from "../../components/inquiries/InquiryDetail";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import {
  ModuleEmptyState,
  ModuleLoadingState,
} from "../../components/ui/ModuleState";
import { PullToRefreshScrollView } from "../../components/ui/PullToRefreshScrollView";
import { Screen } from "../../components/ui/Screen";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { appRoutes } from "../../constants/navigation";
import { useInquiryDetail } from "../../hooks/api/useInquiries";
import { useInquiryStatusController } from "../../hooks/inquiries/useInquiryStatusController";

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

export default function InquiryDetailsScreen() {
  const params = useLocalSearchParams<{
    inquiryId?: string | string[];
    propertyTitle?: string | string[];
  }>();
  const inquiryId = firstParam(params.inquiryId);
  const propertyTitle = firstParam(params.propertyTitle) || "Public listing";
  const inquiryQuery = useInquiryDetail(inquiryId);
  const statusController = useInquiryStatusController();

  return (
    <Screen className="bg-surface">
      <View className="flex-1 gap-5">
        <ModuleHeader
          eyebrow="Engagement"
          leading={
            <SecondaryBackButton
              accessibilityLabel="Back from inquiry details"
              fallbackRoute={appRoutes.secondary.inquiries}
              variant="secondary"
            />
          }
          supportingText={propertyTitle}
          title="Inquiry Details"
        />

        {inquiryQuery.isLoading ? (
          <ModuleLoadingState
            description="Loading guest, listing, property, and message details."
            title="Loading inquiry"
          />
        ) : inquiryQuery.data ? (
          <PullToRefreshScrollView
            className="flex-1"
            contentContainerClassName="pb-8"
            onRefresh={inquiryQuery.refetch}
            showsVerticalScrollIndicator={false}
          >
            <InquiryDetail
              canUpdate={statusController.canUpdate(inquiryQuery.data)}
              inquiry={inquiryQuery.data}
              isUpdating={statusController.isUpdating(inquiryQuery.data.id)}
              onContactGuest={async () => {
                if (
                  !(await statusController.requestInquiryAction(
                    inquiryQuery.data,
                  ))
                ) {
                  return;
                }
                const contact = inquiryQuery.data.guest.contact;
                const uri = contact.includes("@")
                  ? `mailto:${contact}`
                  : `tel:${contact}`;
                await Linking.openURL(uri);
              }}
              onStatusChange={(status) =>
                void statusController.requestStatusChange(
                  inquiryQuery.data,
                  status,
                )
              }
            />
          </PullToRefreshScrollView>
        ) : (
          <View className="flex-1 justify-center gap-4">
            <ModuleEmptyState
              description={
                inquiryId
                  ? (inquiryQuery.error?.message ??
                    "This inquiry could not be loaded.")
                  : "Open an inquiry from the engagement list."
              }
              icon={inquiryId ? "cloud-offline-outline" : "mail-outline"}
              title={inquiryId ? "Inquiry unavailable" : "No inquiry selected"}
            />
            {inquiryId ? (
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.8}
                className="self-center rounded-2xl bg-primary px-5 py-3"
                onPress={() => void inquiryQuery.refetch()}
              >
                <Text className="font-ralewayExtraBold text-sm text-white">
                  Try again
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>

      <UpgradePlanModal
        isVisible={statusController.isUpgradeVisible}
        message="Tier 1 or All-In is required to update inquiry status."
        onClose={statusController.closeUpgrade}
        requiredTier="tier1"
      />
      <ScreenSnackbar
        message={statusController.snackbar.message}
        onDismiss={statusController.snackbar.dismiss}
      />
    </Screen>
  );
}
