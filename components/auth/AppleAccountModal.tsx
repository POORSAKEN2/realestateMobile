import { useState } from "react";
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
import { useWorkspacePresentation } from "../../context/WorkspacePresentationContext";
import type { ApplePendingAccount } from "../../services/apple/appleAuthentication";
import { LegalLink } from "../legal/LegalLink";
import { Button } from "../ui/buttons/Button";
import { BaseField } from "../ui/fields/BaseField";
import { SelectionCheckbox } from "../ui/SelectionCheckbox";
import { LEGAL_DOCUMENT_URLS } from "../../constants/legal";

type Props = {
  account: ApplePendingAccount;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onComplete: (
    input:
      | { email: string; password: string }
      | { name: string; company: string; confirmation: boolean },
  ) => void;
};

export function AppleAccountModal({
  account,
  busy,
  error,
  onCancel,
  onComplete,
}: Props) {
  const { resolvedTheme } = useWorkspacePresentation();
  const [mode, setMode] = useState<"register" | "link" | null>(null);
  const [email, setEmail] = useState(account.email ?? "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(account.name ?? "");
  const [company, setCompany] = useState("");
  const [accepted, setAccepted] = useState(false);
  const legalReady = Boolean(
    LEGAL_DOCUMENT_URLS.terms && LEGAL_DOCUMENT_URLS.privacy,
  );
  const canComplete =
    mode === "link"
      ? email.trim() !== "" && password !== ""
      : name.trim() !== "" && company.trim() !== "" && accepted && legalReady;

  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={busy ? undefined : onCancel}
    >
      <SafeAreaProvider>
        <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
        <SafeAreaView className="flex-1 bg-surface">
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
                {mode === "link"
                  ? "Link existing account"
                  : mode === "register"
                    ? "Create your workspace"
                    : "Continue with Apple"}
              </Text>
              {mode === null ? (
                <>
                  <Text className="text-base text-description">
                    Create a workspace or connect Apple to your existing Terrane
                    account.
                  </Text>
                  <Button
                    title="Create workspace"
                    disabled={busy || !account.can_register}
                    onPress={() => setMode("register")}
                  />
                  {!account.can_register ? (
                    <Text className="text-sm text-description">
                      Apple did not provide a verified email. Link an existing
                      account instead.
                    </Text>
                  ) : null}
                  <Button
                    title="Link existing account"
                    variant="secondary"
                    disabled={busy}
                    onPress={() => setMode("link")}
                  />
                </>
              ) : mode === "link" ? (
                <>
                  <BaseField
                    label="Terrane email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                  />
                  <BaseField
                    label="Terrane password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                  />
                  <Text className="text-sm text-description">
                    Use your Terrane credentials, even if Apple uses a private
                    relay address.
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-sm text-description">
                    Apple email: {account.email}
                  </Text>
                  {!legalReady ? (
                    <Text
                      accessibilityRole="alert"
                      className="text-sm text-danger"
                    >
                      Legal documents are unavailable in this build. Account
                      creation is disabled.
                    </Text>
                  ) : null}
                  <BaseField
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    maxLength={255}
                    editable={!busy}
                  />
                  <BaseField
                    label="Company or workspace name"
                    value={company}
                    onChangeText={setCompany}
                    autoCapitalize="words"
                    maxLength={255}
                    editable={!busy}
                  />
                  <View className="gap-3">
                    <SelectionCheckbox
                      selected={accepted}
                      disabled={busy}
                      onPress={() => setAccepted(!accepted)}
                      label="Accept terms and acknowledge privacy policy"
                    />
                    <Text className="text-sm leading-6 text-textPrimary">
                      Read the{" "}
                      <LegalLink document="terms">Terms of Service</LegalLink>{" "}
                      and{" "}
                      <LegalLink document="privacy">Privacy Policy</LegalLink>.
                    </Text>
                  </View>
                </>
              )}
              {error ? (
                <Text accessibilityRole="alert" className="text-sm text-danger">
                  {error}
                </Text>
              ) : null}
              {mode ? (
                <>
                  <Button
                    title={
                      mode === "link" ? "Link and sign in" : "Create workspace"
                    }
                    isLoading={busy}
                    disabled={!canComplete}
                    onPress={() =>
                      onComplete(
                        mode === "link"
                          ? { email: email.trim(), password }
                          : {
                              name: name.trim(),
                              company: company.trim(),
                              confirmation: accepted,
                            },
                      )
                    }
                  />
                  <Button
                    title="Back"
                    variant="secondary"
                    disabled={busy}
                    onPress={() => {
                      setPassword("");
                      setMode(null);
                    }}
                  />
                </>
              ) : null}
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
