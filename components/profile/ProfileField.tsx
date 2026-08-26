import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
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
      ? "border-primary bg-white"
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
          color={error ? "#B42318" : isFocused ? "#8A77F4" : "#6F6D6D"}
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
          placeholderTextColor="#6F6D6D"
          {...inputProps}
        />
        {value ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label.toLowerCase()}`}
            hitSlop={8}
            onPress={() => onChangeText("")}
            className="h-8 w-8 items-center justify-center"
          >
            <Ionicons name="close-circle" color="#BEE3DB" size={19} />
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
