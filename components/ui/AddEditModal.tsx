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
        // className="flex-1 bg-[#2563EB]/5"
        className="flex-1 bg-white"
      >
        {/* Explicit header background replaces 'modal-header' */}
        <View className="p-6">
          <View className="flex-row items-center">
            <View className="flex-1 pr-4">
              <Text className=" font-soraSemiBold text-2xl " numberOfLines={1}>
                {title}
              </Text>
              {/* {subtitle ? (
                <Text
                  className="mt-1 font-sora text-sm text-white/70"
                  numberOfLines={1}
                ></Text>
              ) : null} */}
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
        <View className="border-t border-[#1d1d1f]/10 bg-white py-6">
          <View className="flex-row gap-3">
            {/* <TouchableOpacity
              activeOpacity={0.85}
              className="h-14 flex-1 items-center justify-center rounded-2xl border border-[#1d1d1f]/10 bg-white"
              onPress={onClose}
            >
              <Text className="text-base font-bold text-[#1d1d1f]">Cancel</Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              activeOpacity={0.85}
              className="mx-6 mb-8 h-16 flex-1 items-center justify-center rounded-2xl bg-[#2563EB]"
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
