import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  EmailVerificationCodeInput,
  type EmailVerificationCodeInputHandle,
} from "../../components/auth/EmailVerificationCodeInput";
import { Screen } from "../../components/ui/Screen";
import { useEmailVerificationController } from "../../hooks/auth/useEmailVerificationController";
import { previewEmailVerificationService } from "../../services/emailVerification";

const VERIFICATION_CODE_LENGTH = 6;
const RESEND_DELAY_SECONDS = 30;

export default function EmailVerificationScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const codeInputRef = useRef<EmailVerificationCodeInputHandle>(null);
  const {
    digits,
    feedback,
    isComplete,
    isRequestingCode,
    isVerifying,
    requestNewCode,
    secondsRemaining,
    updateDigits,
    verifyCode,
  } = useEmailVerificationController({
    codeLength: VERIFICATION_CODE_LENGTH,
    resendDelaySeconds: RESEND_DELAY_SECONDS,
    service: previewEmailVerificationService,
  });
  const destination =
    typeof email === "string" && email.trim()
      ? email.trim()
      : "your work email";

  async function handleRequestNewEmail() {
    const didRequestCode = await requestNewCode();
    if (didRequestCode) {
      codeInputRef.current?.focusFirst();
    }
  }

  return (
    <Screen className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />

      <TouchableOpacity
        activeOpacity={0.8}
        className="absolute left-5 top-14 z-50 h-12 w-12 overflow-hidden rounded-full border border-white/40 bg-white/20 shadow-lg"
        onPress={() => router.back()}
      >
        <BlurView
          intensity={35}
          tint="light"
          className="h-full w-full items-center justify-center"
        >
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </BlurView>
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          className="-mx-6 bg-white"
          contentContainerClassName="flex-grow justify-center px-6 pb-24 pt-20"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-[18px] bg-white px-5 py-7 shadow-lg shadow-slate-900/10">
            <View className="items-center">
              <View className="relative mb-5 h-16 w-16 items-center justify-center rounded-[18px] bg-[#e6fffb]">
                <Feather name="mail" size={30} color="#0f766e" />
                <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#2563EB]">
                  <Feather name="check" size={13} color="#ffffff" />
                </View>
              </View>

              <Text className="text-center font-ralewayExtraBold text-3xl text-[#151717]">
                Verify your email
              </Text>
              <Text className="mt-3 text-center font-ralewayMedium text-sm leading-5 text-[#5f6b6b]">
                We sent a 6-digit verification code to your email address.
              </Text>

              <View className="mt-4 max-w-full flex-row items-center rounded-full bg-[#f0fdfa] px-4 py-2.5">
                <Feather name="mail" size={16} color="#0f766e" />
                <Text
                  className="ml-2 shrink font-ralewayBold text-sm text-[#0f766e]"
                  numberOfLines={1}
                >
                  {destination}
                </Text>
              </View>
            </View>

            <View className="mt-8">
              <EmailVerificationCodeInput
                ref={codeInputRef}
                onChange={updateDigits}
                values={digits}
              />
            </View>

            <Text className="mt-4 text-center text-xs text-[#788383]">
              Enter the code from the email before it expires.
            </Text>

            {feedback ? (
              <View
                className={`mt-5 flex-row items-center rounded-[10px] border px-4 py-3 ${
                  feedback.tone === "error"
                    ? "border-rose-200 bg-rose-50"
                    : "border-[#cce8e3] bg-[#f0fdfa]"
                }`}
              >
                <Feather
                  name={feedback.tone === "error" ? "alert-circle" : "info"}
                  size={17}
                  color={feedback.tone === "error" ? "#e11d48" : "#0f766e"}
                />
                <Text
                  className={`ml-3 flex-1 text-sm leading-5 ${
                    feedback.tone === "error"
                      ? "text-rose-600"
                      : "text-[#0f766e]"
                  }`}
                >
                  {feedback.message}
                </Text>
              </View>
            ) : null}

            <Pressable
              accessibilityLabel="Verify email address"
              accessibilityRole="button"
              className={`mt-7 h-[52px] items-center justify-center rounded-[12px] ${
                isComplete && !isVerifying
                  ? "bg-[#2563EB] active:bg-[#1d4ed8]"
                  : "bg-[#bfdbfe]"
              }`}
              disabled={!isComplete || isVerifying}
              onPress={verifyCode}
            >
              {isVerifying ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="font-ralewaySemiBold text-[15px] text-white">
                  Verify Email
                </Text>
              )}
            </Pressable>

            <View className="mt-6 flex-row items-center justify-center">
              <Text className="text-sm text-[#5f6b6b]">
                Didn&apos;t get the email?{" "}
              </Text>
              <Pressable
                accessibilityLabel="Resend verification email"
                accessibilityRole="button"
                disabled={secondsRemaining > 0 || isRequestingCode}
                hitSlop={8}
                onPress={handleRequestNewEmail}
              >
                <Text
                  className={`font-ralewayBold text-sm ${
                    secondsRemaining > 0 || isRequestingCode
                      ? "text-[#8a9494]"
                      : "text-[#0f766e]"
                  }`}
                >
                  {isRequestingCode
                    ? "Sending..."
                    : secondsRemaining > 0
                      ? `Resend in 0:${secondsRemaining
                          .toString()
                          .padStart(2, "0")}`
                      : "Resend email"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
