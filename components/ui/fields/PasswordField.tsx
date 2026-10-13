import { useState } from "react";
import { TouchableOpacity, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";
import { BaseField } from "./BaseField";

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  disabled: boolean;
  textContentType: TextInputProps["textContentType"];
  maxLength?: number;
};

export function PasswordField({
  label,
  value,
  onChangeText,
  error,
  disabled,
  textContentType,
  maxLength,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <BaseField
      label={label}
      value={value}
      onChangeText={onChangeText}
      error={error}
      icon="lock-closed-outline"
      variant="filled"
      focused={focused}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType={textContentType}
      autoComplete={
        textContentType === "newPassword" ? "new-password" : "current-password"
      }
      secureTextEntry={!visible}
      editable={!disabled}
      maxLength={maxLength}
      placeholder={label}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      trailing={
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          accessibilityState={{ disabled }}
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
      }
    />
  );
}
