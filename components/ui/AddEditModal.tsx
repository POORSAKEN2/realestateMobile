import React, { useEffect, useRef } from "react";
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

interface AddEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  isPending: boolean;
  submitText: string;
  onSubmit: () => void;
  formError?: string | null;
  children: React.ReactNode;
}

export const AddEditModal: React.FC<AddEditModalProps> = ({
  isVisible,
  onClose,
  title,
  subtitle,
  isPending,
  submitText,
  onSubmit,
  formError,
  children,
}) => {
  const scrollRef = useRef<ScrollView | null>(null);

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
      {/* Explicit style layout string replaces 'modal-container' */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-[#F7F8FA]"
      >
        <View className="border-b border-[#1d1d1f]/10 bg-white px-5 py-5">
          <View className="flex-row items-center">
            <View className="flex-1 pr-4">
              <Text className="font-soraSemiBold text-2xl text-[#1d1d1f]" numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text
                  className="mt-1 font-sora text-sm text-[#6F6D6D]"
                  numberOfLines={2}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              className="h-10 w-10 items-center justify-center rounded-full bg-black/10"
              disabled={isPending}
              onPress={handleClose}
            >
              <Ionicons name="close" color="#3d3d3d" size={22} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          automaticallyAdjustKeyboardInsets
          className="flex-1"
          contentContainerClassName="gap-6 px-5 pb-10 pt-5"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ref={scrollRef}
        >
          {formError ? (
            <View className="flex-row items-start gap-3 rounded-2xl border border-[#B42318]/20 bg-[#FEF3F2] p-4">
              <Ionicons name="alert-circle-outline" color="#B42318" size={20} />
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-semibold text-[#B42318]">
                  Please review the form
                </Text>
                <Text className="mt-1 text-xs leading-5 text-[#7A271A]">
                  {formError}
                </Text>
              </View>
            </View>
          ) : null}

          {children}
        </ScrollView>

        <SafeAreaView
          className="border-t border-[#1d1d1f]/10 bg-white px-5 pb-4 pt-4"
          edges={["bottom"]}
        >
          <View className="flex-row">
            <TouchableOpacity
              activeOpacity={0.85}
              accessibilityRole="button"
              className={`h-14 flex-1 items-center justify-center rounded-2xl bg-[#2563EB] ${
                isPending ? "opacity-60" : ""
              }`}
              disabled={isPending}
              onPress={onSubmit}
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-lg font-semibold text-white">
                  {submitText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};
