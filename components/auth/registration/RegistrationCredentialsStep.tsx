import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { RegistrationField } from "./RegistrationField";

type RegistrationCredentialsStepProps = {
  email: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  password: string;
  passwordWarning: string;
};

export function RegistrationCredentialsStep({
  email,
  onEmailChange,
  onPasswordChange,
  password,
  passwordWarning,
}: RegistrationCredentialsStepProps) {
  return (
    <View className="gap-5">
      <RegistrationField
        autoCapitalize="none"
        autoComplete="email"
        icon="mail"
        keyboardType="email-address"
        label="Email address"
        onChangeText={onEmailChange}
        placeholder="you@company.com"
        returnKeyType="next"
        textContentType="emailAddress"
        value={email}
      />
      <View>
        <RegistrationField
          autoCapitalize="none"
          autoComplete="new-password"
          icon="lock"
          label="Password"
          onChangeText={onPasswordChange}
          placeholder="At least 8 characters"
          returnKeyType="done"
          secure
          textContentType="newPassword"
          value={password}
        />
        <Text
          className={`mt-2 text-xs leading-5 ${
            passwordWarning ? "text-amber-700" : "text-[#708080]"
          }`}
        >
          {passwordWarning ||
            "Use at least 8 characters with letters and numbers."}
        </Text>
      </View>

      <View className="mt-2 flex-row items-center justify-center">
        <Text className="text-sm text-[#647171]">
          Already have an account?{" "}
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable accessibilityRole="link" hitSlop={8}>
            <Text className="font-ralewayBold text-sm text-[#0f766e]">
              Sign in
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
