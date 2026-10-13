import { router } from "expo-router";
import { useMemo } from "react";
import { ScrollView } from "react-native";

import { appRoutes } from "../../constants/navigation";
import { useBillingEntitlement } from "../../hooks/api/useBillingEntitlement";
import { useAuth } from "../../hooks/useAuth";
import { useRevenueCat } from "../../hooks/useRevenueCat";
import { hasAppPermission } from "../../utils/auth/accessPolicy";
import { getBillingAccountState } from "../../utils/billing/billingAccountState";
import { canManageStaff } from "../../utils/auth/staffAccess";
import {
  formatRole,
  getProfileImageUri,
  isAuthUser,
} from "../../utils/profile/profileForm";
import { Screen } from "../ui/Screen";
import { ProfileIdentityCard } from "./ProfileIdentityCard";
import { ProfileMenuSection, type ProfileMenuItem } from "./ProfileMenuSection";

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
  const { session } = useAuth();
  const user = isAuthUser(session?.user) ? session.user : null;
  const name = user?.name?.trim() || "Your profile";
  const imageUri = getProfileImageUri(user);
  const roleLabel = getRoleLabel(user?.role);
  const { data: entitlement } = useBillingEntitlement({
    enabled: Boolean(user),
  });
  const { customerInfo, serverSyncStatus } = useRevenueCat();
  const billingState = useMemo(
    () => getBillingAccountState(entitlement, customerInfo),
    [customerInfo, entitlement],
  );
  const planLabel = billingState.syncRequired
    ? `${billingState.storeLabel} · ${serverSyncStatus === "delayed" ? "sync delayed" : "syncing"}`
    : `${billingState.serverLabel} plan`;
  const showTeamAccess = canManageStaff(user);
  const canManageBilling = hasAppPermission(user, "billing.checkout");

  const organizationItems = useMemo<ProfileMenuItem[]>(() => {
    const items: ProfileMenuItem[] = [
      {
        accessibilityHint: "Opens subscription and billing information",
        badge: billingState.syncRequired
          ? serverSyncStatus === "delayed"
            ? "Sync delayed"
            : "Syncing"
          : canManageBilling
            ? billingState.serverLabel
            : "View only",
        icon: "card-outline",
        label: "Plan & Billing",
        onPress: () => router.push(appRoutes.secondary.billing),
        supportingText: billingState.syncRequired
          ? `${billingState.storeLabel} found; server verification ${serverSyncStatus === "delayed" ? "will retry automatically" : "is running automatically"}`
          : canManageBilling
            ? `${billingState.serverLabel} access · View limits and plan actions`
            : `${billingState.serverLabel} access · Changes require an administrator`,
      },
    ];

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

    items.push({
      accessibilityHint: "Opens notifications and reminders",
      icon: "notifications-outline",
      label: "Notifications",
      onPress: () => router.push(appRoutes.secondary.notifications),
      supportingText: "Review alerts and rent reminders",
    });

    return items;
  }, [billingState, canManageBilling, serverSyncStatus, showTeamAccess]);
  const accountItems = useMemo<ProfileMenuItem[]>(
    () => [
      {
        accessibilityHint: "Opens workspace, security, and privacy settings",
        icon: "settings-outline",
        label: "Settings",
        onPress: () => router.push(appRoutes.secondary.settings),
        supportingText: "Workspace, security, and privacy",
      },
    ],
    [],
  );
  const supportItems = useMemo<ProfileMenuItem[]>(
    () => [
      {
        accessibilityHint: "Opens support center",
        icon: "help-circle-outline",
        label: "Help Center",
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

  return (
    <Screen bottomInset="none" className="bg-surface">
      <ScrollView
        className="-mx-6 flex-1"
        contentContainerClassName="px-6 pb-36"
        showsVerticalScrollIndicator={false}
      >
        <ProfileIdentityCard
          imageUri={imageUri}
          name={name}
          onPress={openAccountDetails}
          planLabel={planLabel}
          roleLabel={roleLabel}
        />

        <ProfileMenuSection items={organizationItems} title="Organization" />
        <ProfileMenuSection items={accountItems} title="Account" />
        <ProfileMenuSection items={supportItems} title="Support" />
      </ScrollView>
    </Screen>
  );
}
