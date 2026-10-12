import { Text } from "react-native";
import { BaseField } from "../ui/fields/BaseField";

export function AccountIdentityField({
  passwordless,
  busy,
  password,
  onChange,
}: {
  passwordless: boolean;
  busy: boolean;
  password: string;
  onChange: (value: string) => void;
}) {
  if (passwordless)
    return (
      <Text className="text-sm leading-6 text-description">
        Apple will verify your identity when you submit. Use the iOS app, or set
        a Terrane password through email recovery.
      </Text>
    );
  return (
    <BaseField
      label="Current password"
      required
      secureTextEntry
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="password"
      editable={!busy}
      placeholder="Current password"
      value={password}
      onChangeText={onChange}
    />
  );
}
