import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../hooks/useAuth";

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
      <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </Text>
      <View className="h-14 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm shadow-slate-900/5">
        <Ionicons name="lock-closed-outline" color="#64748B" size={18} />
        <TextInput
          className="ml-3 flex-1 text-base font-semibold text-slate-950"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
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
            name={isVisible ? "eye-off-outline" : "eye-outline"}
            color="#64748B"
            size={20}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleSignOut() {
    signOut();
    router.replace("/(auth)/login");
  }

  function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing details", "Complete all password fields to continue.");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Password too short",
        "Use at least 8 characters for your new password.",
      );
      return;
    }

    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      Alert.alert(
        "Weak password",
        "Use a mix of letters and numbers for a stronger password.",
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

    setTimeout(() => {
      setIsSaving(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert(
        "Password updated",
        "Your password change has been saved in this app flow.",
      );
    }, 500);
  }

  return (
    <Screen className="bg-slate-50">
      <View className="flex-1">
        <ScrollView
          className="-mx-6"
          contentContainerClassName="px-6 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Account
          </Text>
          <Text className="mt-2 text-3xl font-bold text-slate-950">
            Settings
          </Text>
          <Text className="mt-2 text-base leading-6 text-slate-500">
            Manage your password, account security, and secure access.
          </Text>

          <View className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/10">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-bold text-slate-950">
                  Change Password
                </Text>
                <Text className="mt-1 text-sm text-slate-500">
                  Keep your real estate account protected.
                </Text>
              </View>
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
                <Ionicons name="shield-checkmark-outline" color="#2563EB" size={21} />
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

            <View className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
              <Text className="text-sm leading-6 text-slate-600">
                Use at least 8 characters with both letters and numbers.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.82}
              className={`mt-5 h-14 flex-row items-center justify-center rounded-2xl ${
                isSaving ? "bg-blue-400" : "bg-blue-600"
              }`}
              disabled={isSaving}
              onPress={handleChangePassword}
            >
              <Ionicons
                name={isSaving ? "sync-outline" : "key-outline"}
                color="#FFFFFF"
                size={20}
              />
              <Text className="ml-2 text-base font-bold text-white">
                {isSaving ? "Updating Password" : "Update Password"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* <TouchableOpacity
          activeOpacity={0.82}
          onPress={handleSignOut}
          className="mb-2 mt-4 flex-row items-center justify-center rounded-2xl bg-slate-950 px-5 py-4"
        >
          <Ionicons name="log-out-outline" color="#FFFFFF" size={20} />
          <Text className="ml-2 font-bold text-white">Sign out</Text>
        </TouchableOpacity> */}
      </View>
    </Screen>
  );
}
