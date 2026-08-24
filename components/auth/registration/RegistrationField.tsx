import { Feather } from "@expo/vector-icons";
import { useState } from "react";
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
        className={`h-14 flex-row items-center rounded-[14px] border-[1.5px] bg-white pl-4 ${
          isFocused ? "border-primary" : "border-accent"
        }`}
      >
        <Feather
          name={icon}
          size={19}
          color={isFocused ? "#8A77F4" : "#6F6D6D"}
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
          placeholderTextColor="#6F6D6D"
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
              color="#6F6D6D"
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
