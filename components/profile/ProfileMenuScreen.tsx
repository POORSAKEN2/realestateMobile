import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import { appRoutes } from "../../constants/navigation";
import { useAuth } from "../../hooks/useAuth";
import { hasAppPermission } from "../../utils/auth/accessPolicy";
import { canManageStaff } from "../../utils/auth/staffAccess";
import {
  formatRole,
  getProfileImageUri,
  isAuthUser,
} from "../../utils/profile/profileForm";
import { Screen } from "../ui/Screen";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileIdentityCard } from "./ProfileIdentityCard";
import { ProfileMenuSection, type ProfileMenuItem } from "./ProfileMenuSection";
import { ModuleHeader } from "../ui/ModuleHeader";

function getRoleLabel(role?: string) {
  const normalizedRole = role?.toUpperCase();

  if (normalizedRole === "ADMIN") {
    return "Administrator";
  }

  if (normalizedRole === "OWNER") {
    return "Owner";
  }

  return formatRole(role) || "Account member";
}

export function ProfileMenuScreen() {
  const { session, signOut } = useAuth();
  const user = isAuthUser(session?.user) ? session.user : null;
  const name = user?.name?.trim() || "Your profile";
  const imageUri = getProfileImageUri(user);
  const roleLabel = getRoleLabel(user?.role);
  const showTeamAccess = canManageStaff(user);
  const canManageBilling = hasAppPermission(user, "billing.checkout");

  const accountOrganizationItems = useMemo<ProfileMenuItem[]>(() => {
    const items: ProfileMenuItem[] = [];

    if (showTeamAccess) {
      items.push({
        accessibilityHint: "Opens property manager account setup",
        badge: "Admin",
        icon: "people-circle-outline",
        label: "Team & Access",
        onPress: () => router.push(appRoutes.secondary.staffManagement),
        supportingText: "Create property manager accounts",
      });
    }

    items.push(
      {
        accessibilityHint: "Opens notifications and reminders",
        icon: "notifications-outline",
        label: "Notifications",
        onPress: () => router.push(appRoutes.secondary.notifications),
        supportingText: "Review alerts and rent reminders",
      },
      {
        accessibilityHint: "Opens subscription and billing information",
        badge: canManageBilling ? undefined : "View only",
        icon: "card-outline",
        label: "Plan & Billing",
        onPress: () => router.push(appRoutes.secondary.billing),
        supportingText: canManageBilling
          ? "View subscription and property limits"
          : "View plan details; changes require an administrator",
      },
    );

    return items;
  }, [canManageBilling, showTeamAccess]);
  const supportItems = useMemo<ProfileMenuItem[]>(
    () => [
      {
        accessibilityHint: "Opens support center",
        icon: "help-circle-outline",
        label: "Help center",
        onPress: () => router.push(appRoutes.secondary.support),
        supportingText: "Browse FAQs or contact support",
        trailingIcon: "open-outline",
      },
    ],
    [],
  );

  function openAccountDetails() {
    router.push(appRoutes.secondary.profile);
  }

  function confirmSignOut() {
    Alert.alert(
      "Sign out?",
      "You’ll need to sign in again to manage your properties.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            signOut();
            router.replace(appRoutes.auth.login);
          },
        },
      ],
    );
  }

  return (
    <Screen bottomInset="none" className="bg-surface">
      <View className="-mx-6 flex-1 px-6 pb-36">
        <ModuleHeader
          action={<ProfileAvatar imageUri={imageUri} name={name} />}
          eyebrow="Account"
          supportingText="Manage your profile, security, and support."
          title="Profile"
        />

        <ProfileIdentityCard
          imageUri={imageUri}
          name={name}
          onPress={openAccountDetails}
          roleLabel={roleLabel}
        />

        <ProfileMenuSection
          items={accountOrganizationItems}
          title="Account & Organization"
        />
        <ProfileMenuSection items={supportItems} title="Support" />
      </View>
    </Screen>
  );
}
