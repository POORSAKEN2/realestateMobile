import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { usePasswordChange } from "../../hooks/settings/usePasswordChange";
import { FormSection } from "../ui/forms/FormSection";
import { Button } from "../ui/buttons/Button";

function PasswordField({
  label,
  value,
  onChangeText,
  error,
  disabled,
  textContentType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  disabled: boolean;
  textContentType: TextInputProps["textContentType"];
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View className="gap-2">
      <Text className="font-ralewaySemiBold text-sm text-textPrimary">
        {label}
      </Text>
      <View
        className={`min-h-14 flex-row items-center rounded-xl border bg-surface px-3 ${error ? "border-danger" : "border-primary/20"}`}
      >
        <TextInput
          accessibilityLabel={label}
          className="min-h-14 min-w-0 flex-1 text-base text-textPrimary"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType={textContentType}
          secureTextEntry={!visible}
          editable={!disabled}
          value={value}
          onChangeText={onChangeText}
          placeholder={label}
          placeholderTextColor={colors.description}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          disabled={disabled}
          className="h-11 w-11 items-center justify-center"
          onPress={() => setVisible((current) => !current)}
        >
          <Ionicons
            name={visible ? "eye-outline" : "eye-off-outline"}
            color={colors.description}
            size={20}
          />
        </TouchableOpacity>
      </View>
      {error ? (
        <Text accessibilityRole="alert" className="text-xs text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function SettingsPasswordCard() {
  const password = usePasswordChange();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
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
