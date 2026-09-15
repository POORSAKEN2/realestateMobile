import { Feather } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "../../constants/colors";
import type { BillingSyncStatus } from "../../utils/billing/billingSync";
import type { RevenueCatPurchaseSummary } from "../../utils/billing/revenueCatPurchaseSummary";
import { Button } from "../ui/buttons/Button";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4 border-b border-primary/10 py-3 last:border-b-0">
      <Text className="font-ralewayMedium text-xs text-description">
        {label}
      </Text>
      <Text className="max-w-[65%] text-right font-ralewayExtraBold text-sm text-textPrimary">
        {value}
      </Text>
    </View>
  );
}

function ActivationStatus({
  serverSyncStatus,
  syncRequired,
}: {
  serverSyncStatus: BillingSyncStatus;
  syncRequired: boolean;
}) {
  if (!syncRequired) {
    return (
      <View className="flex-row items-start gap-3 rounded-2xl bg-successSurface p-4">
        <Feather name="check-circle" color={colors.success} size={19} />
        <View className="min-w-0 flex-1">
          <Text className="font-ralewayExtraBold text-sm text-success">
            Organization access is active
          </Text>
          <Text className="mt-1 font-ralewayMedium text-xs leading-5 text-textPrimary">
            The upgraded features are available to everyone in this
            organization.
          </Text>
        </View>
      </View>
    );
  }

  const isDelayed = serverSyncStatus === "delayed";
  return (
    <View className="flex-row items-start gap-3 rounded-2xl bg-warningSurface p-4">
      <Feather
        name={isDelayed ? "clock" : "loader"}
        color={colors.warning}
        size={19}
      />
      <View className="min-w-0 flex-1">
        <Text className="font-ralewayExtraBold text-sm text-warning">
          {isDelayed
            ? "Organization activation is delayed"
            : "Activating organization access"}
        </Text>
        <Text className="mt-1 font-ralewayMedium text-xs leading-5 text-textPrimary">
          {isDelayed
            ? "Purchase confirmed. Automatic webhook and scheduled retries will continue. You may safely close this screen."
            : "Purchase confirmed—organization access is activating automatically. You may safely close this screen."}
        </Text>
      </View>
    </View>
  );
}

export function RevenueCatPurchaseSummaryCard({
  isManaging,
  onDone,
  onManage,
  serverSyncStatus,
  summary,
  syncRequired,
}: {
  isManaging: boolean;
  onDone: () => void;
  onManage: () => void;
  serverSyncStatus: BillingSyncStatus;
  summary: RevenueCatPurchaseSummary;
  syncRequired: boolean;
}) {
  return (
    <View className="gap-4">
      <View className="items-center rounded-[28px] bg-white px-5 py-6">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-successSurface">
          <Feather name="check" color={colors.success} size={28} />
        </View>
        <View className="mt-4 flex-row flex-wrap items-center justify-center gap-2">
          <Text className="text-center font-ralewayExtraBold text-xl text-textPrimary">
            {summary.productLabel}
          </Text>
          {summary.isTestPurchase ? (
            <View className="rounded-full bg-warningSurface px-3 py-1">
              <Text className="font-ralewayExtraBold text-[10px] uppercase text-warning">
                Test purchase
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-2 text-center font-ralewayMedium text-sm leading-5 text-description">
          Your transaction was confirmed by {summary.storeLabel}.
        </Text>
      </View>

      <View className="rounded-2xl border border-primary/15 bg-white px-4">
        <SummaryRow label="Plan" value={summary.planLabel} />
        <SummaryRow label="Billing" value={summary.billingPeriodLabel} />
        <SummaryRow label="Status" value={summary.lifecycleLabel} />
        <SummaryRow label="Access" value={summary.accessDateLabel} />
        <SummaryRow label="Applies to" value="Everyone in this organization" />
      </View>

      <ActivationStatus
        serverSyncStatus={serverSyncStatus}
        syncRequired={syncRequired}
      />

      <View className="gap-3">
        <Button title="Done" onPress={onDone} />
        <Button
          isLoading={isManaging}
          onPress={onManage}
          title={
            summary.isLifetime ? "Purchase support" : "Manage subscription"
          }
          variant="secondary"
        />
      </View>
    </View>
  );
}
