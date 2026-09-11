import { router, type Href } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

import { UpgradePlanModal } from "../../components/billing/UpgradePlanModal";
import { InquiryCard } from "../../components/inquiries/InquiryCard";
import { InquiryFilters } from "../../components/inquiries/InquiryFilters";
import { InquiryListState } from "../../components/inquiries/InquiryListState";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { PullToRefreshFlatList } from "../../components/ui/PullToRefreshFlatList";
import { Screen } from "../../components/ui/Screen";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { colors } from "../../constants/colors";
import { appRoutes } from "../../constants/navigation";
import { useInquiryInboxController } from "../../hooks/inquiries/useInquiryInboxController";
import { useInquiryStatusController } from "../../hooks/inquiries/useInquiryStatusController";

export default function InquiriesScreen() {
  const inbox = useInquiryInboxController();
  const statusController = useInquiryStatusController();
  const showState = inbox.isLoading || inbox.isError || inbox.data.length === 0;

  return (
    <Screen className="bg-surface">
      <View className="flex-1">
        <ModuleHeader
          eyebrow="Engagement"
          leading={
            <SecondaryBackButton
              accessibilityLabel="Back from inquiries"
              variant="secondary"
            />
          }
          title="Guest Inquiries"
        />
        <Text className="mt-2 font-ralewayMedium text-sm leading-6 text-description">
          Review messages submitted through public property listings.
        </Text>

        <View className="mt-4">
          <InquiryFilters
            onQueryChange={inbox.setQuery}
            onStatusChange={inbox.setStatus}
            query={inbox.query}
            status={inbox.status}
          />
        </View>

        {showState ? (
          <View className="mt-5 flex-1 justify-center">
            <InquiryListState
              isError={inbox.isError}
              isFiltered={inbox.isFiltered}
              isLoading={inbox.isLoading}
              onClearFilters={inbox.clearFilters}
              onRetry={() => void inbox.refetch()}
            />
          </View>
        ) : (
          <PullToRefreshFlatList
            className="-mx-1 mt-4 flex-1 px-1"
            contentContainerClassName="pb-16 pt-1"
            data={inbox.data}
            keyExtractor={(item) => item.id}
            ListFooterComponent={
              inbox.isFetchingNextPage ? (
                <ActivityIndicator
                  accessibilityLabel="Loading more inquiries"
                  className="py-5"
                  color={colors.primary}
                />
              ) : null
            }
            onEndReached={inbox.fetchNextPage}
            onEndReachedThreshold={0.4}
            onRefresh={inbox.refetch}
            renderItem={({ item }) => (
              <InquiryCard
                canUpdate={statusController.canUpdate(item)}
                inquiry={item}
                isUpdating={statusController.isUpdating(item.id)}
                onOpen={() =>
                  router.push({
                    pathname: appRoutes.secondary.inquiryDetails,
                    params: {
                      inquiryId: item.id,
                      propertyId: item.property.id,
                      propertyTitle: item.property.title,
                    },
                  } as Href)
                }
                onStatusChange={(status) =>
                  void statusController.requestStatusChange(item, status)
                }
              />
            )}
            showsVerticalScrollIndicator={false}
          />
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
