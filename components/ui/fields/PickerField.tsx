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
  title: string;
}

export function PickerField({
  label,
  value,
  placeholder,
  onPress,
  required,
  iconName = "calendar-outline", // Default to calendar
  iconColor = "#2563EB", // Default to your vibrant blue
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
            ? "font-soraMedium text-sm text-slate-600"
            : "text-xs font-semibold text-slate-600"
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
            ? "border-slate-200 bg-slate-50"
            : "border-[#1d1d1f]/10 bg-[#FFFFFF] shadow-sm"
        }`}
        onPress={onPress}
      >
        <Text
          className={`text-base ${
            isFilledVariant ? "min-w-0 flex-1 font-sora" : ""
          } ${value ? "text-[#1d1d1f]" : "text-[#6F6D6D]"}`}
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
  title,
}: PickerModalShellProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View className="flex-1 justify-center bg-black/40 px-5">
        <View className="rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-5 shadow-xl">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-[#1d1d1f]">{title}</Text>
            <TouchableOpacity
              accessibilityLabel={`Close ${title}`}
              accessibilityRole="button"
              activeOpacity={0.8}
              className="rounded-full bg-[#2563EB]/5 px-3 py-1.5"
              onPress={onClose}
            >
              <Text className="text-xs font-bold text-[#2563EB]">Done</Text>
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}
