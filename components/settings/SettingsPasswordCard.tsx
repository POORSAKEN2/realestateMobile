import { useState } from "react";
import { Text, View } from "react-native";
import { PasswordField } from "../ui/fields/PasswordField";
import { usePasswordChange } from "../../hooks/settings/usePasswordChange";
import { FormSection } from "../ui/forms/FormSection";
import { Button } from "../ui/buttons/Button";
import { useAuth } from "../../hooks/useAuth";
import { router } from "expo-router";

export function SettingsPasswordCard() {
  const { session } = useAuth();
  const password = usePasswordChange();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const user = session?.user;
  if (
    user &&
    typeof user === "object" &&
    "has_password" in user &&
    user.has_password === false
  ) {
    return (
      <FormSection
        icon="shield-lock-outline"
        title="Security"
        description="Add a Terrane password to sign in with email. Apple sign-in will still work."
        variant="card"
      >
        <Button
          title="Set password"
          variant="secondary"
          onPress={() => router.push("/(secondary)/settings/password")}
        />
      </FormSection>
    );
  }
  return (
    <FormSection
      icon="shield-lock-outline"
      title="Security"
      description="Protect your account with a strong password."
      variant="card"
    >
      {editing ? (
        <View className="gap-4">
          <PasswordField
            label="Current password"
            textContentType="password"
            value={password.values.current}
            error={password.errors.current}
            disabled={password.saving}
            onChangeText={(value) => password.update("current", value)}
          />
          <PasswordField
            label="New password"
            textContentType="newPassword"
            value={password.values.next}
            error={password.errors.next}
            disabled={password.saving}
            onChangeText={(value) => password.update("next", value)}
          />
          <PasswordField
            label="Confirm new password"
            textContentType="newPassword"
            value={password.values.confirm}
            error={password.errors.confirm}
            disabled={password.saving}
            onChangeText={(value) => password.update("confirm", value)}
          />
          <Text className="text-xs text-description">
            Use at least 8 characters. Avoid reusing passwords.
          </Text>
          {password.error ? (
            <Text accessibilityRole="alert" className="text-sm text-danger">
              {password.error}
            </Text>
          ) : null}
          <Button
            title="Update password"
            isLoading={password.saving}
            onPress={() => {
              void password.submit().then((success) => {
                if (success) {
                  setEditing(false);
                  setSaved(true);
                }
              });
            }}
          />
          <Button
            title="Cancel"
            variant="secondary"
            disabled={password.saving}
            onPress={() => {
              password.reset();
              setEditing(false);
            }}
          />
        </View>
      ) : (
        <>
          {saved ? (
            <Text
              accessibilityLiveRegion="polite"
              className="text-sm text-success"
            >
              Password updated.
            </Text>
          ) : null}
          <Button
            title="Change password"
            variant="secondary"
            onPress={() => {
              setSaved(false);
              setEditing(true);
            }}
          />
        </>
      )}
    </FormSection>
  );
}
