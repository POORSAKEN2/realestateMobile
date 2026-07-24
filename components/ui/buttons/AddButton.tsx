import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  GestureResponderEvent,
  ViewProps,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface AddButtonProps {
  onPress: (event: GestureResponderEvent) => void;
  title?: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconSize?: number;
  loading?: boolean;
  disabled?: boolean;
  className?: string; // Overrides full container styles
  textClassName?: string; // Overrides inner typography styles
  style?: ViewProps["style"];
}

export default function AddButton({
  onPress,
  title = "New",
  iconName = "plus",
  iconSize = 20,
  loading = false,
  disabled = false,
  className = "min-h-11 flex-row items-center gap-2 rounded-2xl bg-[#2563EB] px-4 py-3 shadow-md shadow-blue-200",
  textClassName = "font-ralewayBold text-sm text-white",
  style,
}: AddButtonProps) {
  const isButtonDisabled = disabled || loading;

  return (
    <TouchableOpacity
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isButtonDisabled }}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isButtonDisabled}
      className={`${className} ${isButtonDisabled ? "opacity-60" : ""}`}
      style={style}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          {iconName && (
            <MaterialCommunityIcons
              name={iconName}
              color="#FFFFFF"
              size={iconSize}
            />
          )}
          <Text className={textClassName}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
