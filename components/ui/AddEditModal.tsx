import React, { useEffect, useRef } from "react";
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { BackButton } from "./buttons/BackButton";
import { BottomSheetHost } from "./BottomSheetModal";
import { FormActionRow } from "./forms/FormActionRow";
import { ModalActionFooter } from "./ModalActionFooter";

function AddEditModalHost({ children }: React.PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetHost>{children}</BottomSheetHost>
    </GestureHandlerRootView>
  );
}

interface AddEditModalProps {
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
          <View
            className={
              isCardAppearance
                ? compactHeader
                  ? "border-b border-textPrimary/10 bg-white px-5 py-3"
                  : "bg-white px-6 pb-5 pt-6"
                : "border-b border-textPrimary/10 bg-white px-5 py-4"
            }
          >
            <View className="flex-row items-center">
              {onBack ? (
                <View className="mr-3 items-center justify-center">
                  <BackButton
                    accessibilityLabel={backAccessibilityLabel}
                    disabled={isPending}
                    onPress={onBack}
                    variant="primary"
                  />
                </View>
              ) : null}
              <View className="flex-1 pr-4">
                <Text
                  className={
                    isCardAppearance
                      ? compactHeader
                        ? "font-ralewayBold text-xl leading-7 text-textPrimary"
                        : "font-ralewayBold text-[28px] leading-9 tracking-tight text-textPrimary"
                      : "font-ralewayBold text-2xl text-textPrimary"
                  }
                  numberOfLines={2}
                >
                  {title}
                </Text>
                {subtitle ? (
                  <Text
                    className={
                      isCardAppearance
                        ? compactHeader
                          ? "mt-0.5 font-ralewayMedium text-sm leading-5 text-description"
                          : "mt-2 font-ralewayMedium text-base leading-6 text-description"
                        : "mt-1 font-ralewayMedium text-sm text-description"
                    }
                    numberOfLines={2}
                  >
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              {headerAccessory ? (
                <View className="mr-2">{headerAccessory}</View>
              ) : null}
              <TouchableOpacity
                accessibilityLabel={`Close ${title}`}
                accessibilityRole="button"
                activeOpacity={0.8}
                className={`h-11 w-11 items-center justify-center rounded-full ${
                  isCardAppearance ? "bg-transparent" : "bg-surface"
                }`}
                disabled={isPending}
                onPress={handleClose}
              >
                <Ionicons name="close" color="#1E1F45" size={22} />
              </TouchableOpacity>
            </View>
          </View>

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
                  onSubmit={onSubmit}
                  showCancelAction={showCancelAction}
                  showSubmitAction={showSubmitAction}
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
