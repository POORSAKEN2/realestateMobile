import React from "react";
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
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={isVisible}
    >
      {/* Explicit style layout string replaces 'modal-container' */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-[#2563EB]/5"
      >
        {/* Explicit header background replaces 'modal-header' */}
        <View className="bg-[#1d1d1f] px-6 pb-5 pt-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text
                className="font-soraBold text-2xl uppercase text-white"
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  className="mt-1 font-sora text-sm text-white/70"
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/15"
              onPress={onClose}
            >
              <Ionicons name="close" color="#FFFFFF" size={22} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Form Body */}
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 px-6 py-6"
          keyboardShouldPersistTaps="handled"
        >
          {children}

          {formError ? (
            <View className="rounded-2xl border border-[#1d1d1f]/10 bg-[#1d1d1f]/5 p-4">
              <Text className="text-sm font-medium text-[#1d1d1f]">
                {formError}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Explicit footer layout replaces 'modal-footer' */}
        <View className="border-t border-[#1d1d1f]/10 bg-white p-6">
          <View className="flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.85}
              className="h-14 flex-1 items-center justify-center rounded-2xl border border-[#1d1d1f]/10 bg-white"
              onPress={onClose}
            >
              <Text className="text-base font-bold text-[#1d1d1f]">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              className="h-14 flex-1 items-center justify-center rounded-2xl bg-[#2563EB]"
              disabled={isPending}
              onPress={onSubmit}
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  {submitText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
