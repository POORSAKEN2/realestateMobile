import { useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  getThemeVariables,
  useThemeColors,
  useWorkspacePresentation,
} from "../../context/WorkspacePresentationContext";
import type {
  ApplePendingAccount,
  AppleLinkCodeResult,
} from "../../services/apple/appleAuthentication";
import { Button } from "../ui/buttons/Button";
import { BaseField } from "../ui/fields/BaseField";
import { AuthErrorFeedback } from "./AuthErrorFeedback";
import type { AuthErrorFeedback as Feedback } from "../../utils/auth/authErrorFeedback";
import { useAuthRetryDelay } from "../../hooks/auth/useAuthRetryDelay";

type Props = {
  account: ApplePendingAccount;
  busy: boolean;
  error: Feedback | null;
  linkCode:
    | (AppleLinkCodeResult & { email: string; requestedAt: number })
    | null;
  onCancel: () => void;
  onRequestCode: (email: string) => void;
  onVerifyCode: (email: string, code: string) => void;
};

export function AppleAccountModal({
  account,
  busy,
  error,
  linkCode,
  onCancel,
  onRequestCode,
  onVerifyCode,
}: Props) {
  const { resolvedTheme } = useWorkspacePresentation();
  const palette = useThemeColors();
  const [email, setEmail] = useState(account.email ?? "");
  const [code, setCode] = useState("");
  const retryDelay = useAuthRetryDelay(error);
  const cooldown = useMemo<Feedback | null>(
    () =>
      linkCode
        ? {
            title: "",
            message: "",
            retryable: false,
            retryAfterSeconds: Math.max(
              0,
              Math.ceil(
                (linkCode.requestedAt +
                  linkCode.cooldown_seconds * 1000 -
                  Date.now()) /
                  1000,
              ),
            ),
          }
        : null,
    [linkCode],
  );
  const resendDelay = useAuthRetryDelay(cooldown);
  const requested =
    linkCode?.email.toLowerCase() === email.trim().toLowerCase();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={busy ? undefined : onCancel}
    >
      <SafeAreaProvider>
        <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
        <SafeAreaView
          className="flex-1 bg-surface"
          style={getThemeVariables(palette)}
        >
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerClassName="flex-grow gap-5 px-6 py-8"
              keyboardShouldPersistTaps="handled"
            >
              <Text
                accessibilityRole="header"
                className="font-ralewayBold text-2xl text-textPrimary"
              >
                Link existing account
              </Text>
              <Text className="font-ralewayMedium text-base leading-6 text-description">
                Enter your Terrane email. We’ll send a code to verify ownership
                and connect Apple. No Terrane password is needed.
              </Text>
              <BaseField
                label="Terrane email"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setCode("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
              />
              <Button
                title={requested ? "Resend code" : "Send code"}
                variant="secondary"
                disabled={
                  !validEmail || busy || resendDelay > 0 || retryDelay > 0
                }
                onPress={() => onRequestCode(email.trim())}
              />
              {resendDelay > 0 ? (
                <Text className="text-sm text-description">
                  Resend available in {resendDelay}s.
                </Text>
              ) : null}
              {requested && linkCode ? (
                <>
                  <Text
                    accessibilityLiveRegion="polite"
                    className="text-sm leading-5 text-description"
                  >
                    {linkCode.message}
                  </Text>
                  <BaseField
                    label="Verification code"
                    value={code}
                    onChangeText={(value) =>
                      setCode(value.replace(/[^0-9]/g, "").slice(0, 6))
                    }
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    maxLength={6}
                    editable={!busy}
                  />
                  <Button
                    title="Link and sign in"
                    isLoading={busy}
                    disabled={busy || code.length !== 6 || retryDelay > 0}
                    onPress={() => onVerifyCode(email.trim(), code)}
                  />
                </>
              ) : null}
              {error ? <AuthErrorFeedback feedback={error} /> : null}
              <Button
                title="Cancel Apple sign-in"
                variant="secondary"
                disabled={busy}
                onPress={onCancel}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
