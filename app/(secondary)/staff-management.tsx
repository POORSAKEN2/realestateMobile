import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { ModuleEmptyState } from "../../components/ui/ModuleState";
import { Screen } from "../../components/ui/Screen";
import { colors } from "../../constants/colors";
import { appRoutes } from "../../constants/navigation";
import { useAuth } from "../../hooks/useAuth";
import { canManageStaff } from "../../utils/auth/staffAccess";

function ManagerRule({
  description,
  icon,
  title,
}: {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View className="flex-row items-start py-4">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <Ionicons name={icon} color={colors.primary} size={20} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="font-ralewayExtraBold text-sm text-textPrimary">
          {title}
        </Text>
        <Text className="mt-1 text-sm leading-5 text-description">
          {description}
        </Text>
      </View>
    </View>
  );
}

export default function StaffManagementScreen() {
  const { session } = useAuth();
  const hasStaffAccess = canManageStaff(session?.user);

  return (
    <Screen className="bg-surface">
      <ModuleHeader
        eyebrow="Account"
        leading={
          <SecondaryBackButton
            accessibilityLabel="Back from staff management"
            variant="secondary"
          />
        }
        title="Staff management"
      />

      {!hasStaffAccess ? (
        <View className="mt-8">
          <ModuleEmptyState
            description="Only administrators can create property manager accounts."
            icon="lock-closed-outline"
            title="Administrator access required"
          />
        </View>
      ) : (
        <ScrollView
          className="-mx-6 mt-7 flex-1"
          contentContainerClassName="px-6 pb-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-[28px] border border-primary/15 bg-white p-5 shadow-sm shadow-primary/10">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-accent/60">
              <Ionicons
                name="people-outline"
                color={colors.primary}
                size={28}
              />
            </View>
            <Text className="mt-5 font-ralewayExtraBold text-xl text-textPrimary">
              Property manager accounts
            </Text>
            <Text className="mt-2 text-sm leading-6 text-description">
              Create a manager with immediate account access. Your organization
              can have up to two managers.
            </Text>

            <View className="mt-4 border-t border-primary/10">
              <ManagerRule
                description="The backend always creates staff with the Manager role."
                icon="shield-checkmark-outline"
                title="Fixed Manager role"
              />
              <View className="h-px bg-primary/10" />
              <ManagerRule
                description="Managers receive the operational permissions configured for your organization."
                icon="key-outline"
                title="Role-based access"
              />
              <View className="h-px bg-primary/10" />
              <ManagerRule
                description="The API rejects creation when two managers already exist."
                icon="people-circle-outline"
                title="Two-manager limit"
              />
            </View>
          </View>

          <TouchableOpacity
            accessibilityLabel="Create Manager account"
            accessibilityRole="button"
            activeOpacity={0.82}
            className="mt-5 min-h-14 flex-row items-center justify-center rounded-2xl bg-primary"
            onPress={() => router.push(appRoutes.secondary.staffManagerForm)}
          >
            <Ionicons
              name="person-add-outline"
              color={colors.whitePrimary}
              size={20}
            />
            <Text className="ml-2 font-ralewayExtraBold text-base text-white">
              Create Manager
            </Text>
          </TouchableOpacity>

          <View className="mt-4 flex-row rounded-2xl border border-warning/20 bg-warningSurface p-4">
            <Ionicons
              name="information-circle-outline"
              color={colors.warning}
              size={20}
            />
            <Text className="ml-3 flex-1 text-sm leading-6 text-description">
              Manager listing, property assignment, and account disabling are
              unavailable until the backend exposes those operations.
            </Text>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
