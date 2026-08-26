import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import type { PropsWithChildren } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { REGISTRATION_STEPS } from "../../../constants/registration";
import { Screen } from "../../ui/Screen";

type RegistrationStepLayoutProps = PropsWithChildren<{
  buttonDisabled?: boolean;
  buttonLabel: string;
  feedback?: {
    message: string;
    tone: "error" | "info";
  } | null;
  isLoading?: boolean;
  onBack: () => void;
  onContinue: () => void;
  stepIndex: number;
  subtitle: string;
  title: string;
}>;

export function RegistrationStepLayout({
  buttonDisabled = false,
  buttonLabel,
  children,
  feedback,
  isLoading = false,
  onBack,
  onContinue,
  stepIndex,
  subtitle,
  title,
}: RegistrationStepLayoutProps) {
  const stepCount = REGISTRATION_STEPS.length;
  const isButtonDisabled = buttonDisabled || isLoading;

  return (
    <Screen className="bg-surface">
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityLabel="Go to the previous registration step"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full border border-accent bg-white active:bg-surface"
            hitSlop={8}
            onPress={onBack}
          >
            <Feather name="arrow-left" size={21} color="#1E1F45" />
          </Pressable>
          <Text className="font-ralewayBold text-xs uppercase tracking-[2px] text-description">
            Step {stepIndex + 1} of {stepCount}
          </Text>
        </View>

        <View className="mt-6 flex-row gap-2">
          {REGISTRATION_STEPS.map((step) => (
            <View
              key={step}
              className={`h-1 flex-1 rounded-full ${
                REGISTRATION_STEPS.indexOf(step) <= stepIndex
                  ? "bg-primary"
                  : "bg-accent"
              }`}
            />
          ))}
        </View>

        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          className="-mx-1 mt-9"
          contentContainerClassName="flex-grow px-1 pb-8"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="font-ralewayExtraBold text-[34px] leading-[40px] text-textPrimary">
            {title}
          </Text>
          <Text className="mt-3 font-ralewayMedium text-[15px] leading-6 text-description">
            {subtitle}
          </Text>

          <View className="mt-9">{children}</View>

          {feedback ? (
            <View
              className={`mt-6 flex-row rounded-[12px] border px-4 py-3 ${
                feedback.tone === "error"
                  ? "border-danger/20 bg-dangerSurface"
                  : "border-primary bg-primary/10"
              }`}
            >
              <Feather
                name={
                  feedback.tone === "error" ? "alert-circle" : "check-circle"
                }
                size={18}
                color={feedback.tone === "error" ? "#B42318" : "#8A77F4"}
              />
              <Text
                className={`ml-3 flex-1 text-sm leading-5 ${
                  feedback.tone === "error" ? "text-danger" : "text-secondary"
                }`}
              >
                {feedback.message}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <Pressable
          accessibilityLabel={buttonLabel}
          accessibilityRole="button"
          className={`h-14 items-center justify-center rounded-[16px] ${
            isButtonDisabled ? "bg-accent/60" : "bg-primary active:opacity-90"
          }`}
          disabled={isButtonDisabled}
          onPress={onContinue}
        >
          {isLoading ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="#ffffff" />
              <Text className="ml-3 font-ralewayBold text-[16px] text-white">
                Creating account...
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center">
              <Text className="font-ralewayBold text-[16px] text-white">
                {buttonLabel}
              </Text>
              <Feather
                className="ml-2"
                name={stepIndex === stepCount - 1 ? "check" : "arrow-right"}
                size={19}
                color="#ffffff"
              />
            </View>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}
