import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Link, router, Stack } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ScrollView as ScrollViewType,
} from "react-native";

import { Screen } from "../../components/ui/Screen";
import { useRegister } from "../../hooks/useRegister";

type RegisterField =
  | "name"
  | "company"
  | "email"
  | "password"
  | "password_confirmation";

export default function RegisterScreen() {
  const {
    formData,
    handleChange,
    isLoading,
    error,
    passwordWarning,
    register,
  } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<RegisterField | null>(null);
  const scrollViewRef = useRef<ScrollViewType>(null);

  function focusField(field: RegisterField) {
    setFocusedField(field);

    if (field === "password" || field === "password_confirmation") {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 120);
    }
  }

  return (
    <Screen className="flex-1 bg-[#ffffff]">
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          className="-mx-6 bg-[#ffffff]"
          contentContainerClassName="flex-grow justify-start px-6 pt-20 pb-48"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-[18px]  bg-white px-5 py-6 shadow-lg shadow-slate-900/10">
            <View className="mb-6 items-center">
              <View className="mb-4 h-14 w-14 items-center justify-center rounded-[14px] bg-[#134e4a]">
                <Feather name="home" size={28} color="#FFFFFF" />
              </View>
              <Text className="font-soraBold text-3xl text-[#151717]">
                Create Tenant
              </Text>
              <Text className="mt-1 text-center font-soraMedium text-sm text-[#5f6b6b]">
                Initialize your real estate portfolio
              </Text>
            </View>

            <View className="gap-5">
              <AuthInput
                autoCapitalize="words"
                focused={focusedField === "name"}
                icon="user"
                label="Full Name"
                onBlur={() => setFocusedField(null)}
                onChangeText={(value) => handleChange("name", value)}
                onFocus={() => focusField("name")}
                placeholder="Admin Name"
                textContentType="name"
                value={formData.name}
              />

              <AuthInput
                autoCapitalize="words"
                focused={focusedField === "company"}
                icon="briefcase"
                label="Company Name"
                onBlur={() => setFocusedField(null)}
                onChangeText={(value) => handleChange("company", value)}
                onFocus={() => focusField("company")}
                placeholder="Metropolitan Inc."
                textContentType="organizationName"
                value={formData.company}
              />

              <AuthInput
                autoCapitalize="none"
                autoComplete="email"
                focused={focusedField === "email"}
                icon="mail"
                keyboardType="email-address"
                label="Work Email"
                onBlur={() => setFocusedField(null)}
                onChangeText={(value) => handleChange("email", value)}
                onFocus={() => focusField("email")}
                placeholder="admin@company.com"
                textContentType="emailAddress"
                value={formData.email}
              />

              <View>
                <Text className="mb-2 font-soraSemiBold text-sm text-[#151717]">
                  Password
                </Text>
                <View
                  className={`h-[50px] flex-row items-center rounded-[10px] border-[1.5px] bg-white pl-3 ${
                    focusedField === "password"
                      ? "border-[#2d79f3]"
                      : "border-[#ecedec]"
                  }`}
                >
                  <Feather name="lock" size={20} color="#5f6b6b" />
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="new-password"
                    className="ml-3 h-full flex-1 text-sm text-[#151717]"
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(value) => handleChange("password", value)}
                    onFocus={() => focusField("password")}
                    placeholder="Password"
                    placeholderTextColor="#8a9494"
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    value={formData.password}
                  />
                  <Pressable
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                    accessibilityRole="button"
                    className="h-full w-12 items-center justify-center"
                    onPress={() => setShowPassword((current) => !current)}
                  >
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#5f6b6b"
                    />
                  </Pressable>
                </View>
                {passwordWarning ? (
                  <Text className="mt-2 text-xs text-amber-600">
                    {passwordWarning}
                  </Text>
                ) : null}
              </View>

              <View>
                <Text className="mb-2 font-soraSemiBold text-sm text-[#151717]">
                  Confirm Password
                </Text>
                <View
                  className={`h-[50px] flex-row items-center rounded-[10px] border-[1.5px] bg-white pl-3 ${
                    focusedField === "password_confirmation"
                      ? "border-[#2d79f3]"
                      : "border-[#ecedec]"
                  }`}
                >
                  <Feather name="lock" size={20} color="#5f6b6b" />
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="new-password"
                    className="ml-3 h-full flex-1 text-sm text-[#151717]"
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(value) =>
                      handleChange("password_confirmation", value)
                    }
                    onFocus={() => focusField("password_confirmation")}
                    placeholder="Confirm"
                    placeholderTextColor="#8a9494"
                    secureTextEntry={!showConfirmPassword}
                    textContentType="newPassword"
                    value={formData.password_confirmation}
                  />
                  <Pressable
                    accessibilityLabel={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    accessibilityRole="button"
                    className="h-full w-12 items-center justify-center"
                    onPress={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                  >
                    <Feather
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#5f6b6b"
                    />
                  </Pressable>
                </View>
              </View>
            </View>

            {error ? (
              <View className="mt-5 flex-row items-center rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3">
                <View className="mr-3 h-1.5 w-1.5 rounded-full bg-rose-500" />
                <Text className="flex-1 text-sm text-rose-600">{error}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityLabel="Create account"
              accessibilityRole="button"
              className={`mt-6 h-[52px] items-center justify-center rounded-[12px] ${
                isLoading ? "bg-[#93c5fd]" : "bg-[#2563EB] active:bg-[#1d4ed8]"
              }`}
              disabled={isLoading}
              onPress={register}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="font-soraMedium text-[15px] text-white">
                  Create Account
                </Text>
              )}
            </Pressable>

            <View className="my-5 flex flex-row items-center justify-between">
              <View>
                <Text className="text-center text-sm text-[#476764]">
                  Already have an account?
                </Text>
              </View>
              <View>
                <Link href="/(auth)/login" asChild>
                  <Pressable
                    accessibilityLabel="Go to sign in"
                    accessibilityRole="link"
                    className="items-center justify-center  active:bg-[#e6fffb]"
                  >
                    <Text className="font-soraSemiBold text-sm text-[#0f766e]">
                      Login to your account
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

type AuthInputProps = {
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: "email";
  focused: boolean;
  icon: keyof typeof Feather.glyphMap;
  keyboardType?: "default" | "email-address";
  label: string;
  onBlur: () => void;
  onChangeText: (value: string) => void;
  onFocus: () => void;
  placeholder: string;
  textContentType?: "emailAddress" | "name" | "organizationName";
  value: string;
};

function AuthInput({
  autoCapitalize = "none",
  autoComplete,
  focused,
  icon,
  keyboardType = "default",
  label,
  onBlur,
  onChangeText,
  onFocus,
  placeholder,
  textContentType,
  value,
}: AuthInputProps) {
  return (
    <View>
      <Text className="mb-2 font-soraSemiBold text-sm text-[#151717]">
        {label}
      </Text>
      <View
        className={`h-[50px] flex-row items-center rounded-[10px] border-[1.5px] bg-white pl-3 ${
          focused ? "border-[#2d79f3]" : "border-[#ecedec]"
        }`}
      >
        <Feather name={icon} size={20} color="#5f6b6b" />
        <TextInput
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          className="ml-3 h-full flex-1 pr-3 text-sm text-[#151717]"
          keyboardType={keyboardType}
          onBlur={onBlur}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor="#8a9494"
          textContentType={textContentType}
          value={value}
        />
      </View>
    </View>
  );
}
