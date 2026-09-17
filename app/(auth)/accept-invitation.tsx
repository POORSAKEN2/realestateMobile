import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import {
  acceptStaffInvitation,
  resolveStaffInvitation,
  type InvitationResolution,
} from "../../api/staffInvitations";
import { colors } from "../../constants/colors";
import {
  invitationPasswordError,
  tokenFromInvitationUrl,
} from "../../utils/staff/invitationAcceptance";

export default function AcceptInvitationScreen() {
  const params = useLocalSearchParams<{
    token?: string | string[];
    "#"?: string | string[];
  }>();
  const liveUrl = Linking.useURL();
  const token = useMemo(() => {
    const direct = Array.isArray(params.token) ? params.token[0] : params.token;
    const fragment = Array.isArray(params["#"]) ? params["#"][0] : params["#"];
    return (
      direct ?? tokenFromInvitationUrl(fragment ? `#${fragment}` : liveUrl)
    );
  }, [params.token, params["#"], liveUrl]);
  const [invitation, setInvitation] = useState<InvitationResolution>();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [state, setState] = useState<
    "loading" | "ready" | "submitting" | "accepted" | "unavailable"
  >("loading");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setError("");
    if (!token) {
      setState("unavailable");
      setError(
        "This invitation link is incomplete. Ask the account owner to resend it.",
      );
      return;
    }
    setState("loading");
    resolveStaffInvitation(token)
      .then((value) => {
        if (active) {
          setInvitation(value);
          setState("ready");
        }
      })
      .catch(() => {
        if (active) {
          setError(
            "This invitation has expired or was revoked. Ask the account owner to resend it.",
          );
          setState("unavailable");
        }
      });
    return () => {
      active = false;
    };
  }, [token]);
  async function accept() {
    if (state !== "ready") return;
    const passwordError = invitationPasswordError(password, confirmation);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    setState("submitting");
    setError("");
    try {
      await acceptStaffInvitation(token, password);
      setPassword("");
      setConfirmation("");
      setState("accepted");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Invitation could not be accepted.",
      );
      setState("ready");
    }
  }
  const pending = state === "loading" || state === "submitting";
  return (
    <View className="flex-1 bg-secondary">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="flex-grow justify-center px-6 py-10"
          >
            <View className="rounded-3xl bg-white p-6">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Feather name="user-check" size={26} color={colors.primary} />
              </View>
              <Text className="mt-5 font-ralewayExtraBold text-3xl text-textPrimary">
                Join Terrane
              </Text>
              {pending && state === "loading" ? (
                <View className="mt-8 items-center">
                  <ActivityIndicator color={colors.primary} />
                  <Text className="mt-3 text-description">
                    Checking invitation…
                  </Text>
                </View>
              ) : null}
              {invitation && state !== "unavailable" ? (
                <Text className="mt-3 leading-6 text-description">
                  {invitation.name}, accept the manager invitation for{" "}
                  {invitation.email}.
                </Text>
              ) : null}
              {error ? (
                <Text
                  accessibilityRole="alert"
                  className="mt-5 rounded-2xl bg-dangerSurface p-4 text-danger"
                >
                  {error}
                </Text>
              ) : null}
              {state === "ready" || state === "submitting" ? (
                <View className="mt-6 gap-4">
                  <TextInput
                    accessibilityLabel="Password"
                    autoCapitalize="none"
                    autoComplete="new-password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    editable={!pending}
                    placeholder="Create password"
                    className="h-14 rounded-2xl border border-primary/20 px-4 text-textPrimary"
                  />
                  <TextInput
                    accessibilityLabel="Confirm password"
                    autoCapitalize="none"
                    secureTextEntry
                    value={confirmation}
                    onChangeText={setConfirmation}
                    editable={!pending}
                    placeholder="Confirm password"
                    className="h-14 rounded-2xl border border-primary/20 px-4 text-textPrimary"
                  />
                  <Pressable
                    accessibilityRole="button"
                    disabled={pending}
                    onPress={() => void accept()}
                    className="h-14 items-center justify-center rounded-2xl bg-primary"
                  >
                    {pending ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="font-ralewayBold text-white">
                        Accept invitation
                      </Text>
                    )}
                  </Pressable>
                </View>
              ) : null}
              {state === "accepted" ? (
                <View className="mt-6">
                  <Text className="rounded-2xl bg-successSurface p-4 text-description">
                    Invitation accepted. Sign in with your new password.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.replace({
                        pathname: "/(auth)/login",
                        params: { email: invitation?.email ?? "" },
                      })
                    }
                    className="mt-4 h-14 items-center justify-center rounded-2xl bg-primary"
                  >
                    <Text className="font-ralewayBold text-white">
                      Continue to sign in
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              {state === "unavailable" ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.replace("/(auth)/login")}
                  className="mt-5 h-14 items-center justify-center rounded-2xl border border-primary"
                >
                  <Text className="font-ralewayBold text-primary">
                    Go to sign in
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
