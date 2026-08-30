import { Feather } from "@expo/vector-icons";
import { Link, Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BrandCombinationVertical from "../../assets/branding/svg/brand-combination-vertical-white.svg";
import { colors } from "../../constants/colors";
import { useLogin } from "../../hooks/useLogin";

type FocusedField = "email" | "password" | null;

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

  const passwordInputRef = useRef<TextInput>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<FocusedField>(null);

  const canSubmit =
    email.trim().length > 0 && password.length > 0 && !isLoading;

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const backAction = () => {
      Alert.alert("Exit Terrane?", "Are you sure you want to close the app?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => BackHandler.exitApp(),
        },
      ]);

      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => subscription.remove();
  }, []);

  return (
    <View className="flex-1 bg-secondary">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <ScrollView
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            bounces={false}
            contentContainerClassName="flex-grow px-6"
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Branding */}
            <View className="min-h-[250px] flex-1 items-center justify-center">
              <BrandCombinationVertical width="100%" height={240} />
            </View>

            {/* Authentication form */}
            <View className="">
              {/* Email */}
              <View>
                <Text className="mb-2 font-ralewayBold text-sm text-white">
                  Email address
                </Text>

                <View
                  className={`h-14 flex-row items-center rounded-2xl border pl-4 ${
                    focusedField === "email"
                      ? "border-accent bg-white/15"
                      : "border-white/20 bg-white/10"
                  }`}
                >
                  <Feather
                    color={
                      focusedField === "email"
                        ? "#BEE3DB"
                        : "rgba(255,255,255,0.7)"
                    }
                    name="mail"
                    size={20}
                  />

                  <TextInput
                    accessibilityLabel="Email address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    keyboardType="email-address"
                    className="ml-3 h-full flex-1 items-center font-ralewayMedium text-[15px] text-white"
                    onBlur={() => setFocusedField(null)}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    returnKeyType="next"
                    selectionColor="#BEE3DB"
                    spellCheck={false}
                    textContentType="emailAddress"
                    value={email}
                  />
                </View>
              </View>

              {/* Password */}
              <View className="mt-5">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="font-ralewayBold text-sm text-white">
                    Password
                  </Text>

                  <Pressable
                    accessibilityLabel="Forgot password"
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => {
                      router.push("/(auth)/forgot-password");
                    }}
                  >
                    <Text className="font-ralewaySemiBold text-sm text-accent">
                      Forgot password?
                    </Text>
                  </Pressable>
                </View>

                <View
                  className={`h-14 flex-row items-center rounded-2xl border pl-4 ${
                    focusedField === "password"
                      ? "border-accent bg-white/15"
                      : "border-white/20 bg-white/10"
                  }`}
                >
                  <Feather
                    color={
                      focusedField === "password"
                        ? "#BEE3DB"
                        : "rgba(255,255,255,0.7)"
                    }
                    name="lock"
                    size={20}
                  />

                  <TextInput
                    ref={passwordInputRef}
                    accessibilityLabel="Password"
                    autoCapitalize="none"
                    autoComplete="password"
                    autoCorrect={false}
                    className="ml-3 h-full flex-1 items-center font-ralewayMedium text-[15px] text-white"
                    onBlur={() => setFocusedField(null)}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField("password")}
                    onSubmitEditing={() => {
                      if (canSubmit) {
                        handleLogin();
                      }
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    returnKeyType="done"
                    secureTextEntry={!showPassword}
                    selectionColor="#BEE3DB"
                    textContentType="password"
                    value={password}
                  />

                  <Pressable
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                    accessibilityRole="button"
                    className="h-full w-14 items-center justify-center"
                    onPress={() =>
                      setShowPassword((currentValue) => !currentValue)
                    }
                  >
                    <Feather
                      color="rgba(255,255,255,0.75)"
                      name={showPassword ? "eye" : "eye-off"}
                      size={21}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Error feedback */}
              {error ? (
                <View
                  accessibilityLiveRegion="polite"
                  className="mt-5 flex-row items-start rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3"
                >
                  <Feather color="#BEE3DB" name="alert-circle" size={19} />

                  <Text className="ml-3 flex-1 font-ralewayMedium text-sm leading-5 text-white">
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Sign-in button */}
              <Pressable
                accessibilityLabel="Sign in to your account"
                accessibilityRole="button"
                accessibilityState={{
                  busy: isLoading,
                  disabled: !canSubmit,
                }}
                className={`mt-12 h-14 items-center justify-center rounded-2xl ${
                  canSubmit ? "bg-accent active:opacity-90" : "bg-accent/40"
                }`}
                disabled={!canSubmit}
                onPress={handleLogin}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.secondary} />
                ) : (
                  <Text
                    className={`font-ralewayBold text-base ${
                      canSubmit ? "text-secondary" : "text-secondary/50"
                    }`}
                  >
                    Sign In
                  </Text>
                )}
              </Pressable>

              {/* Registration */}
              <View className="mb-12 mt-8 flex-row items-center justify-center gap-1">
                <Text className="font-ralewayMedium text-sm text-white/75">
                  New to Terrane?
                </Text>

                <Link href="/(auth)/register" asChild>
                  <Pressable
                    accessibilityLabel="Create a Terrane account"
                    accessibilityRole="link"
                    hitSlop={8}
                  >
                    <Text className="font-ralewayBold text-sm text-accent">
                      Create an account
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            {/* Legal copy */}
            <View className="mt-auto items-center px-4 pt-12">
              <Text className="text-center font-ralewayMedium text-xs leading-5 text-white/60">
                By signing in, you agree to our{" "}
                <Text className="font-ralewayBold text-white underline">
                  Terms of Service
                </Text>{" "}
                and acknowledge our{" "}
                <Text className="font-ralewayBold text-white underline">
                  Privacy Policy
                </Text>
                .
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
