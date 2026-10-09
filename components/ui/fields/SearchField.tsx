import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { colors } from "../../../constants/colors";
import {
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";

type SearchFieldProps = Omit<
  TextInputProps,
  "onChange" | "onChangeText" | "value"
> & {
  clearAccessibilityLabel: string;
  endAccessory?: ReactNode;
  onChangeText: (value: string) => void;
  value: string;
  wrapperClassName?: string;
};

export function SearchField({
  clearAccessibilityLabel,
  endAccessory,
  onChangeText,
  placeholder,
  value,
  wrapperClassName = "",
  ...inputProps
}: SearchFieldProps) {
  return (
    <View
      className={`h-12 min-w-0 flex-row items-center rounded-2xl border border-primary/20 bg-panel px-3.5 ${wrapperClassName}`}
    >
      <MaterialCommunityIcons name="magnify" color={colors.primary} size={20} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        className="ml-2 h-full min-w-0 flex-1 py-0 text-[16px] text-textPrimary"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.description}
        returnKeyType="search"
        style={{ includeFontPadding: false }}
        textAlignVertical="center"
        value={value}
        {...inputProps}
      />
      {value ? (
        <TouchableOpacity
          accessibilityLabel={clearAccessibilityLabel}
          accessibilityRole="button"
          activeOpacity={0.75}
          className="h-11 w-11 items-center justify-center"
          onPress={() => onChangeText("")}
        >
          <MaterialCommunityIcons
            name="close-circle"
            color={colors.muted}
            size={19}
          />
        </TouchableOpacity>
      ) : null}
      {endAccessory}
    </View>
  );
}
