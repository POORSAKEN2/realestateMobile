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
    ? "border-red-400 bg-red-50/40"
    : isFocused
      ? "border-blue-500 bg-white"
      : "border-slate-200 bg-slate-50";

  return (
    <View>
      <View className="mb-2 flex-row items-center">
        <Text className="font-soraMedium text-sm text-slate-700">{label}</Text>
        {required ? (
          <Text className="ml-1 text-red-500" accessibilityLabel="required">
            *
          </Text>
        ) : null}
      </View>

      <View
        className={`min-h-14 flex-row items-center rounded-2xl border px-4 ${borderClassName}`}
      >
        <Ionicons
          name={icon}
          color={error ? "#DC2626" : isFocused ? "#2563EB" : "#64748B"}
          size={20}
        />
        <TextInput
          accessibilityLabel={label}
          className="ml-3 min-h-14 flex-1 font-soraMedium text-base text-slate-950"
          value={value}
          onChangeText={onChangeText}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
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
            <Ionicons name="close-circle" color="#CBD5E1" size={19} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-2 text-xs text-red-600"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
