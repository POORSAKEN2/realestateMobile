import { Feather } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { colors } from "../../constants/colors";
import type { PlanTier } from "../../types/domain/billing";
import { getPlanTierFeatures } from "../../utils/billing/planCatalog";

export function BillingPlanFeatures({ tier }: { tier: PlanTier }) {
  return (
    <View className="gap-2.5">
      {getPlanTierFeatures(tier).map((feature) => (
        <View key={feature} className="flex-row items-start gap-2.5">
          <Feather
            name="check-circle"
            color={colors.primaryContent}
            size={17}
            style={{ marginTop: 1 }}
            accessible={false}
          />
          <Text className="min-w-0 flex-1 font-ralewayMedium text-sm leading-6 text-textPrimary">
            {feature}
          </Text>
        </View>
      ))}
    </View>
  );
}
