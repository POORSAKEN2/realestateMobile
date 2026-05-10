import { Feather } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { useState } from "react";
  
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { Screen } from "../../components/ui/Screen";
import { useLogin } from "../../hooks/useLogin";

export default function LoginScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleLogin,
  } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(
    null,
  );

  return (
    <Screen className="=">
        <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          className="-mx-6 bg-[#ffffff]"
          contentContainerClassName="flex-grow justify-center px-6 pt-8 pb-40"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-[18px]  bg-white px-5 py-6 shadow-lg shadow-slate-900/10">
            <View className="mb-6 items-center">
              <View className="mb-4 h-14 w-14 items-center justify-center rounded-[14px] bg-[#0f766e]">
                <Feather name="home" size={28} color="#FFFFFF" />
              </View>
              <Text className="font-soraBold text-3xl text-[#151717]">
                R.E.M
              </Text>
              <Text className="mt-1 text-center font-soraMedium text-sm text-[#5f6b6b]">
                Enterprise Asset Management
              </Text>
            </View>

            <View className="gap-5">
              <View>
                <Text className="mb-2 font-soraSemiBold text-sm text-[#151717]">
                  Email Address
                </Text>
                <View
                  className={`h-[50px] flex-row items-center rounded-[10px] border-[1.5px] bg-white pl-3 ${
                    focusedField === "email"
                      ? "border-[#2d79f3]"
                      : "border-[#ecedec]"
                  }`}
                >
                  <Feather name="mail" size={20} color="#5f6b6b" />
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="email"
                    className="ml-3 h-full flex-1 pr-3 text-sm text-[#151717]"
                    keyboardType="email-address"
                    onBlur={() => setFocusedField(null)}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    placeholder="name@company.com"
                    placeholderTextColor="#8a9494"
                    returnKeyType="next"
                    textContentType="emailAddress"
                    value={email}
                  />
                </View>
              </View>

              <View>
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="font-soraSemiBold text-sm text-[#151717]">
                    Password
                  </Text>
                  <Pressable accessibilityRole="button" hitSlop={8}>
                    <Text className="font-soraMedium text-sm text-[#2d79f3]">
                      Forgot password?
                    </Text>
                  </Pressable>
                </View>
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
                    autoComplete="password"
                    className="ml-3 h-full flex-1 text-sm text-[#151717]"
                    onBlur={() => setFocusedField(null)}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField("password")}
                    placeholder="Password"
                    placeholderTextColor="#8a9494"
                    returnKeyType="done"
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    value={password}
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
              </View>
            </View>

            {error ? (
              <View className="mt-5 flex-row items-center rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3">
                <View className="mr-3 h-1.5 w-1.5 rounded-full bg-rose-500" />
                <Text className="flex-1 text-sm text-rose-600">{error}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityLabel="Sign in to your account"
              accessibilityRole="button"
              className={`mt-6 h-[52px] items-center justify-center rounded-[12px] ${
                isLoading ? "bg-[#93c5fd]" : "bg-[#2563EB] active:bg-[#1d4ed8]"
              }`}
              disabled={isLoading}
              onPress={handleLogin}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="font-soraMedium text-[15px] text-white">
                  Sign In
                </Text>
              )}
            </Pressable>

            <View className="flex flex-row justify-between items-center my-5">
              <View>
                 <Text className="text-center text-sm text-[#476764]">
              New to R.E.M?
            </Text>

              </View>
              <View>
                <Link href="/(auth)/register" asChild>
              <Pressable
                accessibilityLabel="Create tenant account"
                accessibilityRole="link"
                className=" h-12 items-center justify-center  active:bg-[#e6fffb]"
              >
                <Text className="font-soraSemiBold text-sm text-[#0f766e]">
                  Create Tenant Account
                </Text>
              </Pressable>
            </Link>
              </View>
            </View>
          </View>

          {/* <View className="mt-5 rounded-[16px] border border-[#cce8e3] bg-white/80 px-4 py-4">
            <Text className="text-center text-sm text-[#476764]">
              New to R.E.M?
            </Text>
            
          </View> */}

          <View className="mt-5 flex-row items-center justify-center">
            <View className="mr-2 h-2 w-2 rounded-full bg-[#14b8a6]" />
            <Text className="text-center text-xs uppercase tracking-widest text-[#476764]">
              2026 Real Estate Management - v2.4.0
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
