import { Feather } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { colors } from "../../constants/colors";
import type { BillingEntitlement } from "../../types/domain/billing";
import { getBillingAccountState } from "../../utils/billing/billingAccountState";
import { billingStatusMessage } from "../../utils/billing/entitlementPresentation";
import { BillingActionButton } from "./BillingActionButton";
import { BillingUsageRow } from "./BillingUsageRow";

export function ServerAccessCard({
  entitlement,
  canManage,
  onViewPlans,
}: {
  entitlement: BillingEntitlement;
  canManage: boolean;
  onViewPlans: () => void;
}) {
  const properties = entitlement.limits?.properties ?? {
    used: entitlement.property_count,
    limit: entitlement.property_limit,
    unlimited: entitlement.property_limit === null,
  };
  const readOnly = entitlement.access_mode === "read_only";
  return (
    <View className="gap-4 rounded-[28px] border border-primary/20 bg-primary/10 p-5">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary">
          <Feather name="shield" size={20} color={colors.whitePrimary} />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-ralewayBold text-xs uppercase tracking-wide text-primary">
            Server access
          </Text>
          <Text className="font-ralewayExtraBold text-xl text-textPrimary">
            {getBillingAccountState(entitlement, null).serverLabel}
          </Text>
          <Text className="font-ralewayMedium text-xs leading-5 text-description">
            {billingStatusMessage(entitlement)}
          </Text>
        </View>
      </View>
      <View className="gap-3 border-t border-primary/15 pt-4">
        <BillingUsageRow dimension="properties" usage={properties} />
        {entitlement.gating_enabled !== false &&
        !readOnly &&
        properties.limit !== null &&
        properties.used >= properties.limit ? (
          <Text
            accessibilityRole="alert"
            className="text-xs leading-5 text-danger"
          >
            Property limit reached. Reduce usage or choose a larger plan to add
            properties.
          </Text>
        ) : null}
      </View>
      {canManage ? (
        <BillingActionButton
          label="Compare plans"
          icon="layers"
          onPress={onViewPlans}
          primary
        />
      ) : (
        <Text className="font-ralewayMedium text-xs text-description">
          Plan changes are managed by your account administrator.
        </Text>
      )}
    </View>
  );
}
