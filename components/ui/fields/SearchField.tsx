import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  onChangeText: (value: string) => void;
  value: string;
  wrapperClassName?: string;
};

export function SearchField({
  clearAccessibilityLabel,
  onChangeText,
  placeholder,
  value,
  wrapperClassName = "",
  ...inputProps
}: SearchFieldProps) {
  return (
    <View
      className={`h-12 min-w-0 flex-row items-center rounded-2xl bg-slate-100 px-3.5 ${wrapperClassName}`}
    >
      <MaterialCommunityIcons name="magnify" color="#475569" size={20} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        className="ml-2 min-w-0 flex-1 text-base text-textPrimary"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        returnKeyType="search"
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
            color="#64748B"
            size={19}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
