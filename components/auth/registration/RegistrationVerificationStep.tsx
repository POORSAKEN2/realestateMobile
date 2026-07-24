import { Feather } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import {
  EmailVerificationCodeInput,
  type EmailVerificationCodeInputHandle,
} from "../EmailVerificationCodeInput";

type RegistrationVerificationStepProps = {
  digits: string[];
  email: string;
  isRequestingCode: boolean;
  onDigitsChange: (digits: string[]) => void;
  onResend: () => void;
  secondsRemaining: number;
};

export function RegistrationVerificationStep({
  digits,
  email,
  isRequestingCode,
  onDigitsChange,
  onResend,
  secondsRemaining,
}: RegistrationVerificationStepProps) {
  const codeInputRef = useRef<EmailVerificationCodeInputHandle>(null);
  const isResendDisabled = isRequestingCode || secondsRemaining > 0;

  useEffect(() => {
    if (!isRequestingCode) {
      codeInputRef.current?.focusFirst();
    }
  }, [isRequestingCode]);

  return (
    <View>
      <View className="mb-7 flex-row items-center rounded-[14px] bg-[#eef5ff] px-4 py-3">
        {isRequestingCode ? (
          <ActivityIndicator color="#2563EB" />
        ) : (
          <Feather name="mail" size={18} color="#2563EB" />
        )}
        <View className="ml-3 flex-1">
          <Text className="text-xs text-[#647171]">
            {isRequestingCode ? "Sending code to" : "Code sent to"}
          </Text>
          <Text
            className="mt-0.5 font-ralewayBold text-sm text-[#173f3b]"
            numberOfLines={1}
          >
            {email.trim()}
          </Text>
        </View>
      </View>

      <EmailVerificationCodeInput
        ref={codeInputRef}
        onChange={onDigitsChange}
        values={digits}
      />

      <Text className="mt-5 text-center text-sm leading-5 text-[#647171]">
        Check your inbox and spam folder. The code expires in 10 minutes.
      </Text>

      <Pressable
        accessibilityLabel="Resend verification code"
        accessibilityRole="button"
        className="mt-5 self-center px-3 py-2"
        disabled={isResendDisabled}
        hitSlop={8}
        onPress={onResend}
      >
        <Text
          className={`font-ralewayBold text-sm ${
            isResendDisabled ? "text-[#9ba7a7]" : "text-[#0f766e]"
          }`}
        >
          {isRequestingCode
            ? "Sending..."
            : secondsRemaining > 0
              ? `Resend code in 0:${secondsRemaining
                  .toString()
                  .padStart(2, "0")}`
              : "Resend code"}
        </Text>
      </Pressable>
    </View>
  );
}
