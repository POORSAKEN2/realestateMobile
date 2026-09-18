import { useAccess } from "../../hooks/auth/useAccess";
import type { AppPermission } from "../../types/auth/access";
import React, { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { BackButton } from "./buttons/BackButton";
import {
  BottomSheetHost,
  type BottomSheetHostHandle,
} from "./BottomSheetModal";
import { FormActionRow } from "./forms/FormActionRow";
import { ModalActionFooter } from "./ModalActionFooter";
import { ModalHeader } from "./ModalHeader";
import { EntitlementLimitPrompt } from "../billing/EntitlementLimitPrompt";

function AddEditModalHost({
  children,
  hostRef,
}: React.PropsWithChildren<{ hostRef: React.Ref<BottomSheetHostHandle> }>) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetHost ref={hostRef}>{children}</BottomSheetHost>
    </GestureHandlerRootView>
  );
}

interface AddEditModalProps {
  permission?: AppPermission;
  propertyId?: string;
  appearance?: "default" | "card";
  backAccessibilityLabel?: string;
  cancelText?: string;
  compactHeader?: boolean;
  isVisible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  isPending: boolean;
  onBack?: () => void;
  submitText: string;
  onSubmit: () => void | Promise<void>;
  formError?: string | null;
  headerAccessory?: React.ReactNode;
  showCancelAction?: boolean;
  showSubmitAction?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AddEditModal: React.FC<AddEditModalProps> = ({
  permission,
  propertyId,
  appearance = "default",
  backAccessibilityLabel,
  cancelText = "Cancel",
  compactHeader = false,
  isVisible,
  onClose,
  title,
  subtitle,
  isPending,
  onBack,
  submitText,
  onSubmit,
  formError,
  headerAccessory,
  showCancelAction = false,
  showSubmitAction = true,
  children,
  footer,
}) => {
  const { can } = useAccess();
  const canSubmit = !permission || can(permission, propertyId);
  const sheetHostRef = useRef<BottomSheetHostHandle>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const submitting = useRef(false);
  const [submittingLocally, setSubmittingLocally] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const busy = isPending || submittingLocally;
  const displayedError = formError || submitError;
  async function handleSubmit() {
    if (!canSubmit || busy || submitting.current) return;
    submitting.current = true;
    setSubmittingLocally(true);
    setSubmitError(null);
    try {
      await onSubmit();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "The form could not be saved. Please try again.",
      );
    } finally {
      submitting.current = false;
      setSubmittingLocally(false);
    }
  }
  useEffect(() => {
    if (!isVisible) setSubmitError(null);
  }, [isVisible]);
  const isCardAppearance = appearance === "card";

  useEffect(() => {
    if (displayedError) scrollRef.current?.scrollTo({ animated: true, y: 0 });
  }, [displayedError]);

  // Dismissing mid-save would abandon an in-flight upload and desync the form.
  const handleClose = () => {
    if (sheetHostRef.current?.requestClose()) return;
    if (busy || submitting.current) return;
    onClose();
  };

  return (
    <Modal
      allowSwipeDismissal={false}
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="formSheet"
      visible={isVisible}
    >
      <AddEditModalHost hostRef={sheetHostRef}>
        <EntitlementLimitPrompt active={isVisible} priority={1} />
        <SafeAreaView
          className="flex-1 bg-surface"
          edges={Platform.OS === "android" ? ["top"] : []}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1 bg-surface"
          >
            <ModalHeader
              accessory={headerAccessory}
              className={isCardAppearance && !compactHeader ? "border-b-0" : ""}
              closeAccessibilityLabel={`Close ${title}`}
              compact={compactHeader}
              disabled={busy}
              leading={
                onBack ? (
                  <BackButton
                    accessibilityLabel={backAccessibilityLabel}
                    disabled={busy}
                    onPress={() => {
                      if (!busy && !submitting.current) onBack();
                    }}
                    variant="primary"
                  />
                ) : undefined
              }
              onClose={handleClose}
              subtitle={subtitle}
              title={title}
            />

            <ScrollView
              className="flex-1"
              contentContainerClassName={
                isCardAppearance
                  ? "gap-4 px-5 pb-8 pt-4"
                  : "gap-6 px-5 pb-10 pt-5"
              }
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              ref={scrollRef}
            >
              {displayedError ? (
                <View
                  accessibilityRole="alert"
                  className="flex-row items-start gap-3 rounded-2xl border border-danger/20 bg-dangerSurface p-4"
                >
                  <Ionicons
                    name="alert-circle-outline"
                    color="#B42318"
                    size={20}
                  />
                  <View className="min-w-0 flex-1">
                    <Text className="font-ralewayBold text-sm text-danger">
                      Please review the form
                    </Text>
                    <Text className="mt-1 text-xs leading-5 text-danger">
                      {displayedError}
                    </Text>
                  </View>
                </View>
              ) : null}

              {children}
            </ScrollView>

            {footer || showCancelAction || showSubmitAction ? (
              <ModalActionFooter>
                {footer ?? (
                  <FormActionRow
                    appearance={appearance}
                    cancelText={cancelText}
                    disabled={busy}
                    isPending={busy}
                    onCancel={handleClose}
                    onSubmit={() => void handleSubmit()}
                    showCancelAction={showCancelAction}
                    showSubmitAction={showSubmitAction && canSubmit}
                    submitText={submitText}
                  />
                )}
              </ModalActionFooter>
            ) : null}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </AddEditModalHost>
    </Modal>
  );
};
