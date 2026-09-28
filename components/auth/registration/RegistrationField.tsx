import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { colors } from "../../../constants/colors";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

type RegistrationFieldProps = Pick<
  TextInputProps,
  | "autoCapitalize"
  | "autoComplete"
  | "keyboardType"
  | "returnKeyType"
  | "textContentType"
> & {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secure?: boolean;
  value: string;
};

export function RegistrationField({
  autoCapitalize = "none",
  autoComplete,
  icon,
  keyboardType = "default",
  label,
  onChangeText,
  placeholder,
  returnKeyType,
  secure = false,
  textContentType,
  value,
}: RegistrationFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isValueVisible, setIsValueVisible] = useState(false);

  return (
    <View>
      <Text className="mb-2 font-ralewayBold text-sm text-textPrimary">
        {label}
      </Text>
      <View
        className={`h-14 flex-row items-center rounded-[14px] border-[1.5px] bg-panel pl-4 ${
          isFocused ? "border-primary" : "border-accent"
        }`}
      >
        <Feather
          name={icon}
          size={19}
          color={isFocused ? colors.primary : colors.description}
        />
        <TextInput
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          className="ml-3 h-full flex-1 pr-4 text-[15px] text-textPrimary"
          keyboardType={keyboardType}
          onBlur={() => setIsFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={colors.description}
          returnKeyType={returnKeyType}
          secureTextEntry={secure && !isValueVisible}
          textContentType={textContentType}
          value={value}
        />
        {secure ? (
          <Pressable
            accessibilityLabel={
              isValueVisible ? "Hide password" : "Show password"
            }
            accessibilityRole="button"
            className="h-full w-12 items-center justify-center"
            hitSlop={4}
            onPress={() => setIsValueVisible((current) => !current)}
          >
            <Feather
              name={isValueVisible ? "eye" : "eye-off"}
              size={19}
              color={colors.description}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
