import { Text, View } from "react-native";
import type { Property } from "../../types";
import { useAccess } from "../../hooks/auth/useAccess";
import { PropertyOwnerSummary } from "../owners/PropertyOwnerSummary";
import { PropertyManagerAssignments } from "./PropertyManagerAssignments";
import { PropertyVerificationPanel } from "./PropertyVerificationPanel";

export function PropertyAdministration({ property }: { property: Property }) {
  const { can } = useAccess();
  if (!can("staff.manage")) return null;
  return (
    <View className="gap-4 border-t border-primary/15 bg-surface px-5 py-6">
      <View>
        <Text
          accessibilityRole="header"
          className="font-ralewayExtraBold text-lg text-textPrimary"
        >
          Property management
        </Text>
        <Text className="mt-1 text-sm leading-5 text-description">
          Owner details, team access, and marketplace readiness.
        </Text>
      </View>
      <PropertyOwnerSummary ownerId={property.ownerId} />
      <PropertyManagerAssignments propertyId={property.id} />
      <PropertyVerificationPanel propertyId={property.id} />
    </View>
  );
}
