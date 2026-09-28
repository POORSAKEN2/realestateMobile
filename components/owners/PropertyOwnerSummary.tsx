import { Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { useOwnerDetail } from "../../hooks/api/useOwnerManagement";
import { Button } from "../ui/buttons/Button";
import { appRoutes } from "../../constants/navigation";
import Feather from "@expo/vector-icons/Feather";
import { colors } from "../../constants/colors";
import { PropertyAdminSection } from "../properties/PropertyAdminSection";
import { SkeletonBlock } from "../ui/Skeleton";

export function PropertyOwnerSummary({ ownerId }: { ownerId?: string }) {
  const owner = useOwnerDetail(ownerId);
  return (
    <PropertyAdminSection
      title="Property owner"
      description="Contact details for the owner assigned to this property."
      icon="user"
    >
      {!ownerId ? (
        <Text className="text-description">
          No owner assigned. Create or choose an owner in Property Owners, then
          assign them when editing this property.
        </Text>
      ) : owner.isPending ? (
        <View accessibilityLabel="Loading property owner" className="gap-3">
          <SkeletonBlock className="h-5 w-2/3" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-1/2" />
        </View>
      ) : owner.data ? (
        <>
          <Text
            selectable
            className="font-ralewayBold text-lg text-textPrimary"
          >
            {owner.data.name}
          </Text>
          <View className="gap-3 rounded-xl bg-surface p-3">
            <OwnerContact
              icon="mail"
              value={owner.data.contactEmail}
              fallback="No email provided"
            />
            <OwnerContact
              icon="phone"
              value={owner.data.phone}
              fallback="No phone provided"
            />
          </View>
        </>
      ) : (
        <>
          <Text accessibilityRole="alert" className="text-sm text-danger">
            {owner.error?.message ?? "Owner unavailable."}
          </Text>
          <Button
            title="Retry owner"
            onPress={() => {
              void owner.refetch();
            }}
          />
        </>
      )}
      <Button
        title={ownerId ? "View owner details" : "Manage property owners"}
        variant="secondary"
        onPress={() =>
          router.push(
            ownerId
              ? (`${appRoutes.secondary.propertyOwners}?ownerId=${encodeURIComponent(ownerId)}` as Href)
              : appRoutes.secondary.propertyOwners,
          )
        }
      />
    </PropertyAdminSection>
  );
}

function OwnerContact({
  icon,
  value,
  fallback,
}: {
  icon: "mail" | "phone";
  value?: string;
  fallback: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <Feather name={icon} color={colors.description} size={16} />
      <Text selectable className="min-w-0 flex-1 text-sm text-description">
        {value || fallback}
      </Text>
    </View>
  );
}
