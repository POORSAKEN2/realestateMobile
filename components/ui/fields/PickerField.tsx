import React from "react";
import { Modal, View, Text, TouchableOpacity, ViewProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PickerFieldProps {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
  required?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap; // Change icons depending on use case
  iconColor?: string;
  iconSize?: number;
  rightElement?: React.ReactNode; // For passing custom components on the right side
  className?: string; // Overrides for container
  style?: ViewProps["style"];
  variant?: "default" | "filled";
}

interface PickerModalShellProps {
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

export function PickerField({
  label,
  value,
  placeholder,
  onPress,
  required,
  iconName = "calendar-outline", // Default to calendar
  iconColor = "#8A77F4", // Default to the brand primary color
  iconSize = 20,
  rightElement,
  className = "gap-2",
  style,
  variant = "default",
}: PickerFieldProps) {
  const isFilledVariant = variant === "filled";

  return (
    <View className={className} style={style}>
      <Text
        className={
          isFilledVariant
            ? "font-ralewaySemiBold text-sm text-slate-600"
            : "font-ralewayBold text-xs text-slate-600"
        }
      >
        {label}
        <Text className="text-red-600">{required ? " *" : ""}</Text>
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        accessibilityLabel={`${label}${required ? ", required" : ""}`}
        accessibilityRole="button"
        className={`h-14 flex-row items-center justify-between rounded-2xl border px-4 ${
          isFilledVariant
            ? "border-slate-200 bg-surface"
            : "border-textPrimary/10 bg-[#FFFFFF] shadow-sm"
        }`}
        onPress={onPress}
      >
        <Text
          className={`text-base ${
            isFilledVariant ? "min-w-0 flex-1 font-ralewayMedium" : ""
          } ${value ? "text-textPrimary" : "text-[#6F6D6D]"}`}
          numberOfLines={isFilledVariant ? 1 : undefined}
        >
          {value || placeholder}
        </Text>

        {/* Render custom element if provided, otherwise fallback to the icon */}
        {rightElement
          ? rightElement
          : iconName && (
              <Ionicons name={iconName} color={iconColor} size={iconSize} />
            )}
      </TouchableOpacity>
    </View>
  );
}

export function PickerModalShell({
  children,
  onClose,
  onConfirm,
  title,
}: PickerModalShellProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View className="flex-1 justify-center bg-black/40 px-5">
        <View className="rounded-3xl border border-primary/20 bg-[#FFFFFF] p-5 shadow-xl shadow-primary/10">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-ralewayExtraBold text-sm text-textPrimary">
              {title}
            </Text>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                accessibilityLabel={`Cancel ${title}`}
                accessibilityRole="button"
                activeOpacity={0.8}
                className="rounded-full bg-primary/10 px-3 py-1.5"
                onPress={onClose}
              >
                <Text className="font-ralewayExtraBold text-xs text-description">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel={`Confirm ${title}`}
                accessibilityRole="button"
                activeOpacity={0.8}
                className="rounded-full bg-primary/10 px-3 py-1.5"
                onPress={onConfirm}
              >
                <Text className="font-ralewayExtraBold text-xs text-secondary">
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}
