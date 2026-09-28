import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { colors } from "../../constants/colors";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from "react-native";

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

  const borderClassName = error
    ? "border-danger bg-dangerSurface"
    : isFocused
      ? "border-primary bg-panel"
      : "border-primary/20 bg-primary/5";

  return (
    <View>
      <View className="mb-2 flex-row items-center">
        <Text className="font-ralewaySemiBold text-sm text-textPrimary">
          {label}
        </Text>
        {required ? (
          <Text className="ml-1 text-danger" accessibilityLabel="required">
            *
          </Text>
        ) : null}
      </View>

      <View
        className={`min-h-14 flex-row items-center rounded-2xl border px-4 ${borderClassName}`}
      >
        <Ionicons
          name={icon}
          color={
            error
              ? colors.danger
              : isFocused
                ? colors.primary
                : colors.description
          }
          size={20}
        />
        <TextInput
          accessibilityLabel={label}
          className="ml-3 min-h-14 flex-1 font-ralewaySemiBold text-base text-textPrimary"
          value={value}
          onChangeText={onChangeText}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={colors.description}
          {...inputProps}
        />
        {value && inputProps.editable !== false ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label.toLowerCase()}`}
            hitSlop={8}
            onPress={() => onChangeText("")}
            className="h-8 w-8 items-center justify-center"
          >
            <Ionicons
              name="close-circle"
              color={colors.description}
              size={19}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-2 text-xs text-danger"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
