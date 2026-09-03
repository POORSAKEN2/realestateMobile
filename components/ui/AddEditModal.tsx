import { useAccess } from "../../hooks/auth/useAccess";
import type { AppPermission } from "../../types/auth/access";
import React, { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  ScrollView,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { BackButton } from "./buttons/BackButton";
import { BottomSheetHost } from "./BottomSheetModal";
import { FormActionRow } from "./forms/FormActionRow";
import { ModalActionFooter } from "./ModalActionFooter";
import { ModalHeader } from "./ModalHeader";

function AddEditModalHost({ children }: React.PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetHost>{children}</BottomSheetHost>
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
  onSubmit: () => void;
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
  const scrollRef = useRef<ScrollView | null>(null);
  const isCardAppearance = appearance === "card";

  useEffect(() => {
    if (formError) scrollRef.current?.scrollTo({ animated: true, y: 0 });
  }, [formError]);

  // Dismissing mid-save would abandon an in-flight upload and desync the form.
  const handleClose = () => {
    if (isPending) return;
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
      <AddEditModalHost>
        {/* Explicit style layout string replaces 'modal-container' */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 bg-surface"
        >
          <ModalHeader
            accessory={headerAccessory}
            className={isCardAppearance && !compactHeader ? "border-b-0" : ""}
            closeAccessibilityLabel={`Close ${title}`}
            compact={compactHeader}
            disabled={isPending}
            leading={
              onBack ? (
                <BackButton
                  accessibilityLabel={backAccessibilityLabel}
                  disabled={isPending}
                  onPress={onBack}
                  variant="primary"
                />
              ) : undefined
            }
            onClose={handleClose}
            subtitle={subtitle}
            title={title}
          />

          <ScrollView
            automaticallyAdjustKeyboardInsets
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
            {formError ? (
              <View className="flex-row items-start gap-3 rounded-2xl border border-danger/20 bg-dangerSurface p-4">
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
                    {formError}
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
                  disabled={isPending}
                  isPending={isPending}
                  onCancel={onClose}
                  onSubmit={() => { if (canSubmit) onSubmit(); }}
                  showCancelAction={showCancelAction}
                  showSubmitAction={showSubmitAction && canSubmit}
                  submitText={submitText}
                />
              )}
            </ModalActionFooter>
          ) : null}
        </KeyboardAvoidingView>
      </AddEditModalHost>
    </Modal>
  );
};
