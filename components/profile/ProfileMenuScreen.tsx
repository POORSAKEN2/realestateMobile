import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import { appRoutes } from "../../constants/navigation";
import { useAuth } from "../../hooks/useAuth";
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

  if (normalizedRole === "ADMIN" || normalizedRole === "OWNER") {
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

  const accountItems = useMemo<ProfileMenuItem[]>(
    () => [
      {
        accessibilityHint: "Opens personal and professional details",
        icon: "person-outline",
        label: "Account details",
        onPress: () => router.push(appRoutes.secondary.profile),
      },
      {
        accessibilityHint: "Opens password and security settings",
        icon: "lock-closed-outline",
        label: "Security",
        onPress: () => router.push(appRoutes.secondary.settings),
      },
      {
        accessibilityHint: "Opens notifications",
        icon: "notifications-outline",
        label: "Notifications",
        onPress: () => router.push(appRoutes.secondary.notifications),
      },
      {
        accessibilityHint: "Opens additional account settings",
        icon: "settings-outline",
        label: "Additional settings",
        onPress: () => router.push(appRoutes.secondary.settings),
      },
    ],
    [],
  );
  const supportItems = useMemo<ProfileMenuItem[]>(
    () => [
      {
        accessibilityHint: "Opens support center",
        icon: "help-circle-outline",
        label: "Help center",
        onPress: () => router.push(appRoutes.secondary.support),
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
      <ScrollView
        className="-mx-6 flex-1"
        contentContainerClassName="px-6"
        showsVerticalScrollIndicator={false}
      >
        <ProfileIdentityCard
          imageUri={imageUri}
          name={name}
          onPress={openAccountDetails}
          roleLabel={roleLabel}
        />

        <ProfileMenuSection items={accountItems} title="Account" />
        <ProfileMenuSection items={supportItems} title="Support" />
      </ScrollView>
    </Screen>
  );
}
