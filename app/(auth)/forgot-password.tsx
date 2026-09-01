import { Feather } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  requestForgotPasswordOtp,
  submitResetPassword,
} from "../../api/authRecovery";
import { EmailVerificationCodeInput } from "../../components/auth/EmailVerificationCodeInput";
import { colors } from "../../constants/colors";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const otpCode = codeDigits.join("");
  const isRequestDisabled = !EMAIL_PATTERN.test(email.trim()) || isLoading || cooldownSeconds > 0;
  const isResetDisabled =
    otpCode.length !== 6 ||
    newPassword.length < 8 ||
    confirmPassword.length < 8 ||
    newPassword !== confirmPassword ||
    isLoading;

  async function handleRequestOtp() {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await requestForgotPasswordOtp({ email: email.trim() });
      setCooldownSeconds(response.cooldown_seconds ?? 30);
      setStep("reset");
      Alert.alert(
        "Verification code sent",
        `We emailed a 6-digit recovery code to ${email.trim()}.`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send recovery code.";
      setError(message);
      Alert.alert("Request failed", message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword() {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await submitResetPassword({
        email: email.trim(),
        otp_code: otpCode,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      Alert.alert(
        "Password reset successful",
        "Your password has been updated. Please sign in with your new password.",
        [
          {
            text: "Sign In",
            onPress: () => router.replace("/(auth)/login"),
          },
        ],
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Password reset failed.";
      setError(message);
      Alert.alert("Reset failed", message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-secondary">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <ScrollView
            bounces={false}
            contentContainerClassName="flex-grow px-6 pt-4 pb-8"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header / Back */}
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Go back"
                activeOpacity={0.75}
                className="h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10"
                onPress={() => {
                  if (step === "reset") {
                    setStep("request");
                  } else {
                    router.back();
                  }
                }}
              >
                <Feather name="arrow-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <Text className="font-ralewayBold text-xs uppercase tracking-widest text-accent">
                {step === "request" ? "Step 1 of 2" : "Step 2 of 2"}
              </Text>
            </View>

            {/* Title */}
            <View className="mt-8">
              <Text className="font-ralewayExtraBold text-3xl text-white">
                {step === "request" ? "Forgot password?" : "Reset your password"}
              </Text>
              <Text className="mt-2 text-sm leading-6 text-white/75">
                {step === "request"
                  ? "Enter your account email address and we'll send you a 6-digit recovery code."
                  : `Enter the code sent to ${email.trim()} and choose a strong new password.`}
              </Text>
            </View>

            {/* Error banner */}
            {error ? (
              <View className="mt-6 flex-row items-start rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3">
                <Feather color="#BEE3DB" name="alert-circle" size={19} />
                <Text className="ml-3 flex-1 font-ralewayMedium text-sm leading-5 text-white">
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Form */}
            {step === "request" ? (
              <View className="mt-8 gap-5">
                <View>
                  <Text className="mb-2 font-ralewayBold text-sm text-white">
                    Email address
                  </Text>
                  <View className="h-14 flex-row items-center rounded-2xl border border-white/20 bg-white/10 pl-4">
                    <Feather color="#BEE3DB" name="mail" size={20} />
                    <TextInput
                      accessibilityLabel="Account email address"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect={false}
                      className="ml-3 h-full flex-1 font-ralewayMedium text-[15px] text-white"
                      keyboardType="email-address"
                      onChangeText={setEmail}
                      onSubmitEditing={handleRequestOtp}
                      placeholder="Enter registered email"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      returnKeyType="send"
                      selectionColor="#BEE3DB"
                      value={email}
                    />
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send recovery code"
                  className={`mt-6 h-14 items-center justify-center rounded-2xl ${
                    isRequestDisabled ? "bg-accent/40" : "bg-accent active:opacity-90"
                  }`}
                  disabled={isRequestDisabled}
                  onPress={handleRequestOtp}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.secondary} />
                  ) : (
                    <Text
                      className={`font-ralewayBold text-base ${
                        isRequestDisabled ? "text-secondary/50" : "text-secondary"
                      }`}
                    >
                      {cooldownSeconds > 0
                        ? `Resend in ${cooldownSeconds}s`
                        : "Send Recovery Code"}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View className="mt-8 gap-5">
                {/* OTP Digits */}
                <View>
                  <Text className="mb-2 font-ralewayBold text-sm text-white">
                    6-digit verification code
                  </Text>
                  <EmailVerificationCodeInput
                    onChange={setCodeDigits}
                    values={codeDigits}
                  />
                </View>

                {/* New Password */}
                <View>
                  <Text className="mb-2 font-ralewayBold text-sm text-white">
                    New password
                  </Text>
                  <View className="h-14 flex-row items-center rounded-2xl border border-white/20 bg-white/10 pl-4">
                    <Feather color="#BEE3DB" name="lock" size={20} />
                    <TextInput
                      ref={newPasswordRef}
                      accessibilityLabel="New password"
                      autoCapitalize="none"
                      autoCorrect={false}
                      className="ml-3 h-full flex-1 font-ralewayMedium text-[15px] text-white"
                      onChangeText={setNewPassword}
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                      placeholder="At least 8 characters"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      returnKeyType="next"
                      secureTextEntry={!showPassword}
                      selectionColor="#BEE3DB"
                      value={newPassword}
                    />
                    <Pressable
                      accessibilityRole="button"
                      className="h-full w-14 items-center justify-center"
                      onPress={() => setShowPassword((prev) => !prev)}
                    >
                      <Feather
                        color="rgba(255,255,255,0.75)"
                        name={showPassword ? "eye" : "eye-off"}
                        size={20}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Confirm Password */}
                <View>
                  <Text className="mb-2 font-ralewayBold text-sm text-white">
                    Confirm new password
                  </Text>
                  <View className="h-14 flex-row items-center rounded-2xl border border-white/20 bg-white/10 pl-4">
                    <Feather color="#BEE3DB" name="lock" size={20} />
                    <TextInput
                      ref={confirmPasswordRef}
                      accessibilityLabel="Confirm new password"
                      autoCapitalize="none"
                      autoCorrect={false}
                      className="ml-3 h-full flex-1 font-ralewayMedium text-[15px] text-white"
                      onChangeText={setConfirmPassword}
                      onSubmitEditing={() => {
                        if (!isResetDisabled) handleResetPassword();
                      }}
                      placeholder="Re-enter new password"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      returnKeyType="done"
                      secureTextEntry={!showPassword}
                      selectionColor="#BEE3DB"
                      value={confirmPassword}
                    />
                  </View>
                </View>

                {/* Resend link */}
                <View className="flex-row items-center justify-between pt-2">
                  <Text className="text-xs text-white/70">
                    Didn't receive the code?
                  </Text>
                  <TouchableOpacity
                    disabled={cooldownSeconds > 0 || isLoading}
                    onPress={handleRequestOtp}
                  >
                    <Text className="font-ralewayBold text-xs text-accent">
                      {cooldownSeconds > 0
                        ? `Resend (${cooldownSeconds}s)`
                        : "Resend Code"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Submit Reset Button */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Reset password"
                  className={`mt-6 h-14 items-center justify-center rounded-2xl ${
                    isResetDisabled ? "bg-accent/40" : "bg-accent active:opacity-90"
                  }`}
                  disabled={isResetDisabled}
                  onPress={handleResetPassword}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.secondary} />
                  ) : (
                    <Text
                      className={`font-ralewayBold text-base ${
                        isResetDisabled ? "text-secondary/50" : "text-secondary"
                      }`}
                    >
                      Reset Password
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* Return to Login */}
            <View className="mt-auto items-center pt-10">
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                activeOpacity={0.8}
              >
                <Text className="font-ralewayBold text-sm text-accent">
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
