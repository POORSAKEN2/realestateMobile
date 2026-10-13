import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { colors } from "../../constants/colors";
import { TouchableOpacity, type TextInputProps } from "react-native";
import { BaseField } from "../ui/fields/BaseField";

export type ProfileFieldProps = Pick<
  TextInputProps,
  | "autoCapitalize"
  | "autoComplete"
  | "keyboardType"
  | "maxLength"
  | "textContentType"
  | "editable"
> & {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  error?: string;
  required?: boolean;
};

export function ProfileField({
  icon,
  label,
  value,
  placeholder,
  onChangeText,
  error,
  required,
  ...inputProps
}: ProfileFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <BaseField
      variant="filled"
      label={`${label}${required ? "" : " (optional)"}`}
      accessibilityLabel={`${label}${required ? ", required" : ", optional"}`}
      icon={icon}
      required={required}
      value={value}
      onChangeText={onChangeText}
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      placeholder={placeholder}
      error={error}
      focused={isFocused}
      {...inputProps}
      trailing={
        value && inputProps.editable !== false ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label.toLowerCase()}`}
            hitSlop={8}
            onPress={() => onChangeText("")}
            className="h-11 w-11 items-center justify-center"
          >
            <Ionicons
              name="close-circle"
              color={colors.description}
              size={19}
            />
          </TouchableOpacity>
        ) : null
      }
    />
  );
}
