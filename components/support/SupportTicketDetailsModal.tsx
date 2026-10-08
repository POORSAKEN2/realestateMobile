import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSupportTicket } from "../../hooks/api/useSupport";
import { useReducedMotionPreference } from "../../hooks/ui/useReducedMotionPreference";
import type { SupportTicket } from "../../types/domain/support";
import { colors } from "../../constants/colors";
import { supportLevelLabel } from "../../utils/billing/entitlementCapabilities";
import {
  isTicketUnavailable,
  ticketStatusClass,
  ticketTimestamp,
} from "../../utils/support/ticketDetails";
import { BottomSheetModal } from "../ui/BottomSheetModal";
import { ModalHeader } from "../ui/ModalHeader";
import { FormSection } from "../ui/forms/FormSection";
import { Button } from "../ui/buttons/Button";

function DetailRow({
  label,
  value,
  column = false,
}: {
  label: string;
  value?: string;
  column?: boolean;
}) {
  return (
    <View className={`min-w-0 gap-1 ${column ? "flex-1" : ""}`}>
      <Text className="font-ralewayMedium text-sm text-description">
        {label}
      </Text>
      <Text
        selectable
        className="font-ralewaySemiBold text-base leading-6 text-textPrimary"
      >
        {value?.trim() || "Not provided"}
      </Text>
    </View>
  );
}

export function SupportTicketDetailsModal({
  ticket,
  onClose,
}: {
  ticket: SupportTicket | null;
  onClose: () => void;
}) {
  const query = useSupportTicket(ticket);
  const { height, width, fontScale } = useWindowDimensions();
  const twoColumns = width >= 360 && fontScale <= 1.3;
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotionPreference();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const visible = Boolean(ticket);
  useEffect(() => {
    if (!visible || Platform.OS !== "web") return;
    const previousFocus = document.activeElement;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      }
    };
    document.addEventListener("keydown", closeOnEscape, true);
    return () => {
      document.removeEventListener("keydown", closeOnEscape, true);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, [visible]);
  const unavailable = isTicketUnavailable(query.error);
  const detail = unavailable ? undefined : (query.data ?? ticket);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      reducedMotion={reducedMotion}
      backdropAccessibilityLabel="Close ticket details"
      statusBarTranslucent
    >
      <View
        className="overflow-hidden rounded-t-[30px] bg-surface"
        style={{ maxHeight: height * 0.84 }}
      >
        <ModalHeader
          title="Ticket Details"
          onClose={onClose}
          closeAccessibilityLabel="Close ticket details"
        />
        <ScrollView
          style={{ flexShrink: 1 }}
          contentContainerStyle={{
            padding: 24,
            paddingBottom: insets.bottom + 24,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {unavailable ? (
            <Text
              accessibilityRole="alert"
              className="text-base leading-6 text-textPrimary"
            >
              This ticket is no longer available.
            </Text>
          ) : (
            <>
              {query.isFetching ? (
                <View
                  className="flex-row items-center gap-2"
                  accessibilityLiveRegion="polite"
                >
                  <ActivityIndicator color={colors.primaryContent} />
                  <Text className="text-sm text-description">
                    {detail
                      ? "Refreshing ticket details..."
                      : "Loading ticket details..."}
                  </Text>
                </View>
              ) : null}
              {query.isError ? (
                <View className="gap-3 rounded-2xl bg-panel p-4">
                  <Text
                    accessibilityRole="alert"
                    className="text-sm leading-5 text-textPrimary"
                  >
                    {detail
                      ? "Couldn’t refresh ticket details. Showing the last loaded details."
                      : "Couldn’t load ticket details. Try again."}
                  </Text>
                  <Button
                    title="Retry ticket details"
                    variant="secondary"
                    isLoading={query.isFetching}
                    onPress={() => {
                      void query.refetch();
                    }}
                  />
                </View>
              ) : null}
              {detail ? (
                <>
                  <View className="gap-2">
                    <Text
                      selectable
                      accessibilityRole="header"
                      className="font-ralewayBold text-lg leading-6 text-textPrimary"
                    >
                      {detail.subject}
                    </Text>
                    <Text
                      className={`self-start rounded-xl px-3 py-1.5 font-ralewayBold text-sm ${ticketStatusClass(detail.status)}`}
                    >
                      {detail.status || "Status unavailable"}
                    </Text>
                  </View>
                  <FormSection
                    title="Issue Description"
                    icon="text-box-outline"
                    variant="card"
                  >
                    <Text
                      selectable
                      className="font-ralewayMedium text-base leading-6 text-textPrimary"
                    >
                      {detail.description || "Not provided"}
                    </Text>
                  </FormSection>
                  <FormSection
                    title="Ticket Information"
                    icon="ticket-outline"
                    variant="card"
                  >
                    <View
                      className={`gap-4 ${twoColumns ? "flex-row" : "flex-col"}`}
                    >
                      <DetailRow
                        column={twoColumns}
                        label="Category"
                        value={detail.category}
                      />
                      <DetailRow
                        column={twoColumns}
                        label="Priority"
                        value={detail.priority}
                      />
                    </View>
                    <View
                      className={`gap-4 ${twoColumns ? "flex-row" : "flex-col"}`}
                    >
                      <DetailRow
                        column={twoColumns}
                        label="Submitted"
                        value={ticketTimestamp(detail.created_at)}
                      />
                      <DetailRow
                        column={twoColumns}
                        label="Last updated"
                        value={ticketTimestamp(detail.updated_at)}
                      />
                    </View>
                    {detail.support_level ? (
                      <DetailRow
                        label="Support level at submission"
                        value={supportLevelLabel(detail.support_level)}
                      />
                    ) : null}
                  </FormSection>
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
    </BottomSheetModal>
  );
}
