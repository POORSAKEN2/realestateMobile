import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Or your specific icon import
import { SafeAreaView } from "react-native-safe-area-context";

import { getStandardModalSheetHeight } from "../../../constants/modal";
import { BottomSheetModal } from "../BottomSheetModal";
import { MODAL_ACTION_FOOTER_CONTENT_HEIGHT } from "../ModalActionFooter";

const DROPDOWN_OPTION_GAP = 8;

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string> {
  disabled?: boolean;
  label: string;
  placeholder?: string;
  subtitle?: string;
  value: T;
  options: readonly DropdownOption<T>[];
  required?: boolean;
  onSelect: (value: T) => void;
  sheetBottomInsetMode?: "edge" | "safe-area";
  variant?: "compact" | "default" | "filled";
  wrapperClassName?: string;
}

export function DropdownField<T extends string>({
  disabled = false,
  label,
  placeholder = "Select an option",
  subtitle,
  value,
  required,
  options,
  onSelect,
  sheetBottomInsetMode = "edge",
  variant = "default",
  wrapperClassName = "",
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const { height } = useWindowDimensions();
  const isFilledVariant = variant === "filled";
  const isCompactVariant = variant === "compact";
  const sheetHeight = getStandardModalSheetHeight(height);

  const selectedLabel =
    options.find((option) => option.value === value)?.label || value;

  function handleSelect(selectedValue: T) {
    onSelect(selectedValue);
    setIsOpen(false);
  }

  return (
    <View className={`${isCompactVariant ? "" : "gap-2"} ${wrapperClassName}`}>
      {!isCompactVariant ? (
        <Text
          className={
            isFilledVariant
              ? "font-ralewaySemiBold text-sm text-description"
              : "font-ralewayBold text-xs text-description"
          }
        >
          {label}
          <Text className="text-danger">{required ? " *" : ""}</Text>
        </Text>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.85}
        accessibilityLabel={`${label}${required ? ", required" : ""}`}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        className={
          isCompactVariant
            ? `h-11 flex-row items-center justify-between rounded-xl border border-textPrimary/10 bg-white px-3 ${disabled ? "opacity-50" : ""}`
            : isFilledVariant
              ? `h-14 flex-row items-center justify-between rounded-2xl border border-textPrimary/10 bg-surface px-4 ${disabled ? "opacity-50" : ""}`
              : `h-14 flex-row items-center justify-between rounded-xl border border-textPrimary/10 bg-whitePrimary px-4 shadow-sm ${disabled ? "opacity-50" : ""}`
        }
        disabled={disabled}
        onPress={() => setIsOpen(true)}
      >
        <Text
          className={`min-w-0 flex-1 text-textPrimary ${
            isCompactVariant ? "text-sm" : "text-base"
          } ${isFilledVariant ? "font-ralewaySemiBold" : "font-ralewayBold"}`}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </Text>
        <MaterialCommunityIcons
          name={isFilledVariant ? "chevron-right" : "chevron-down"}
          color="#6F6D6D"
          size={isCompactVariant ? 19 : 22}
        />
      </TouchableOpacity>

      <BottomSheetModal
        backdropAccessibilityLabel={`Close ${label} options`}
        bottomInsetMode={sheetBottomInsetMode}
        onClose={() => setIsOpen(false)}
        visible={isOpen}
      >
        <SafeAreaView
          className="w-full overflow-hidden rounded-t-[28px] bg-whitePrimary px-5"
          edges={["bottom", "left", "right"]}
          style={{ height: sheetHeight }}
        >
          <View className="mb-4 flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="font-ralewayExtraBold text-lg text-textPrimary">
                Select {label}
              </Text>
              {subtitle ? (
                <Text
                  className="mt-1 font-ralewayBold text-xs text-description"
                  numberOfLines={2}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              accessibilityLabel={`Close ${label} options`}
              accessibilityRole="button"
              activeOpacity={0.85}
              className="h-11 w-11 items-center justify-center rounded-full bg-primary/10"
              onPress={() => setIsOpen(false)}
            >
              <MaterialCommunityIcons name="close" color="#8A77F4" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView
            bounces={false}
            className="flex-1"
            contentContainerStyle={{
              gap: DROPDOWN_OPTION_GAP,
              paddingBottom: MODAL_ACTION_FOOTER_CONTENT_HEIGHT,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.85}
                  className={`h-14 flex-row items-center justify-between rounded-lg border px-4 ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-textPrimary/10 bg-whitePrimary"
                  }`}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text
                    className={`min-w-0 flex-1 font-ralewayBold text-base ${
                      isSelected ? "text-primary" : "text-textPrimary"
                    }`}
                    numberOfLines={1}
                  >
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <MaterialCommunityIcons
                      name="check"
                      color="#8A77F4"
                      size={21}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </BottomSheetModal>
    </View>
  );
}
