import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Screen } from "../../components/ui/Screen";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { StaffManagementEntryCard } from "../../components/staff/StaffManagementEntryCard";
import { useAuth } from "../../hooks/useAuth";
import { colors } from "../../constants/colors";
import { appRoutes } from "../../constants/navigation";
import { canManageStaff } from "../../utils/auth/staffAccess";
import {
  changePassword,
  exportUserData,
  requestAccountDeletion,
} from "../../api/user";

type PasswordFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
};

function PasswordField({
  label,
  placeholder,
  value,
  onChangeText,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View className="gap-2">
      <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
        {label}
      </Text>
      <View className="h-14 flex-row items-center rounded-2xl border border-primary/20 bg-white px-4 shadow-sm shadow-primary/10">
        <Ionicons
          name="lock-closed-outline"
          color={colors.description}
          size={18}
        />
        <TextInput
          className="ml-3 flex-1 font-ralewayBold text-base text-textPrimary"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.description}
          secureTextEntry={!isVisible}
          value={value}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isVisible ? "Hide password" : "Show password"}
          activeOpacity={0.8}
          onPress={() => setIsVisible((current) => !current)}
        >
          <Ionicons
            name={isVisible ? "eye-outline" : "eye-off-outline"}
            color={colors.description}
            size={20}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { hasCompletedOnboarding, session, setOnboardingCompleted } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const shouldShowOnboarding = !hasCompletedOnboarding;
  const showStaffManagement = canManageStaff(session?.user);

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(
        "Missing details",
        "Complete all password fields to continue.",
      );
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Password too short",
        "Use at least 8 characters for your new password.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords do not match", "Confirm the same new password.");
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        "Choose a new password",
        "Your new password should be different from the current one.",
      );
      return;
    }

    setIsSaving(true);

    try {
      await changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert(
        "Password updated",
        "Your account password has been successfully updated.",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update password.";
      Alert.alert("Update failed", message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExportData() {
    setIsExporting(true);
    try {
      const data = await exportUserData();
      const jsonString = JSON.stringify(data, null, 2);
      await Share.share({
        title: "Terrane_User_Data.json",
        message: jsonString,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not export user data.";
      Alert.alert("Export failed", message);
    } finally {
      setIsExporting(false);
    }
  }

  function handleRequestAccountDeletion() {
    Alert.alert(
      "Request Account Deletion",
      "Are you sure you want to submit an account deletion request? An administrator will review and process your request per DPA guidelines.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit Request",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await requestAccountDeletion({
                reason: "Self-service deletion requested from mobile settings",
                confirmation: true,
              });
              Alert.alert(
                "Request Submitted",
                "Your account deletion request has been submitted for administrative review.",
              );
            } catch (err) {
              const message =
                err instanceof Error
                  ? err.message
                  : "Could not submit deletion request.";
              Alert.alert("Request Failed", message);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen className="bg-surface">
      <View className="flex-1">
        <ModuleHeader
          eyebrow="Account"
          leading={
            <SecondaryBackButton
              accessibilityLabel="Back from settings"
              variant="secondary"
            />
          }
          title="Settings"
        />
        <Text className="mt-2 text-base leading-6 text-description">
          Manage your password, account security, and privacy access.
        </Text>

        <ScrollView
          className="-mx-6 flex-1"
          contentContainerClassName="px-6 pb-10"
          showsVerticalScrollIndicator={false}
        >
          {showStaffManagement ? (
            <StaffManagementEntryCard
              onPress={() => router.push(appRoutes.secondary.staffManagement)}
            />
          ) : null}

          {/* Onboarding preview section */}
          <View
            className={`${showStaffManagement ? "mt-5" : "mt-8"} rounded-[28px] border border-primary/20 bg-primary/10 p-5 shadow-sm shadow-primary/10`}
          >
            <View className="flex-row items-center justify-between gap-4">
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-2">
                  <View className="h-9 w-9 items-center justify-center rounded-2xl bg-primary/10">
                    <Ionicons
                      name="construct-outline"
                      color={colors.primary}
                      size={19}
                    />
                  </View>
                  <Text className="font-ralewayExtraBold text-lg text-textPrimary">
                    Onboarding Preview
                  </Text>
                </View>
                <Text className="mt-3 text-sm leading-6 text-description">
                  Temporarily show onboarding on launch while testing this flow.
                </Text>
              </View>
              <Switch
                value={shouldShowOnboarding}
                trackColor={{
                  false: colors.description,
                  true: colors.primary,
                }}
                thumbColor={colors.whitePrimary}
                ios_backgroundColor={colors.description}
                onValueChange={(enabled) => setOnboardingCompleted(!enabled)}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.82}
              className="mt-4 h-12 flex-row items-center justify-center rounded-2xl bg-primary"
              onPress={() => {
                setOnboardingCompleted(false);
                router.replace("/(onboarding)/screen-1");
              }}
            >
              <Ionicons
                name="play-outline"
                color={colors.whitePrimary}
                size={19}
              />
              <Text className="ml-2 font-ralewayExtraBold text-white">
                Open Onboarding
              </Text>
            </TouchableOpacity>
          </View>

          {/* Change Password section */}
          <View className="mt-5 rounded-[28px] border border-primary/20 bg-white p-5 shadow-sm shadow-primary/10">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-ralewayExtraBold text-lg text-textPrimary">
                  Change Password
                </Text>
                <Text className="mt-1 text-sm text-description">
                  Keep your real estate account protected.
                </Text>
              </View>
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Ionicons
                  name="shield-checkmark-outline"
                  color={colors.primary}
                  size={21}
                />
              </View>
            </View>

            <View className="mt-5 gap-4">
              <PasswordField
                label="Current password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <PasswordField
                label="New password"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <PasswordField
                label="Confirm new password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <View className="mt-4 rounded-2xl bg-primary/10 px-4 py-3">
              <Text className="text-sm leading-6 text-description">
                Use at least 8 characters with both letters and numbers.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.82}
              className={`mt-5 h-14 flex-row items-center justify-center rounded-2xl ${
                isSaving ? "bg-primary/60" : "bg-primary"
              }`}
              disabled={isSaving}
              onPress={handleChangePassword}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.whitePrimary} />
              ) : (
                <>
                  <Ionicons
                    name="key-outline"
                    color={colors.whitePrimary}
                    size={20}
                  />
                  <Text className="ml-2 font-ralewayExtraBold text-base text-white">
                    Update Password
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Data & Privacy (DPA) section */}
          <View className="mt-5 rounded-[28px] border border-primary/20 bg-white p-5 shadow-sm shadow-primary/10">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-ralewayExtraBold text-lg text-textPrimary">
                  Data & Privacy
                </Text>
                <Text className="mt-1 text-sm text-description">
                  Self-service data rights and export.
                </Text>
              </View>
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Ionicons
                  name="finger-print-outline"
                  color={colors.primary}
                  size={21}
                />
              </View>
            </View>

            <View className="mt-5 gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                className="h-13 flex-row items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5"
                disabled={isExporting}
                onPress={handleExportData}
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons
                    name="download-outline"
                    color={colors.primary}
                    size={20}
                  />
                  <Text className="font-ralewayBold text-sm text-textPrimary">
                    Export My Data (JSON)
                  </Text>
                </View>
                {isExporting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.description}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                className="h-13 flex-row items-center justify-between rounded-2xl border border-danger/25 bg-dangerSurface px-4 py-3.5"
                disabled={isDeleting}
                onPress={handleRequestAccountDeletion}
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons
                    name="trash-outline"
                    color={colors.danger}
                    size={20}
                  />
                  <Text className="font-ralewayBold text-sm text-danger">
                    Request Account Deletion
                  </Text>
                </View>
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.danger}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}
