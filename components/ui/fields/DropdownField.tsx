import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Or your specific icon import

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string> {
  label: string;
  placeholder?: string;
  subtitle?: string;
  value: T;
  options: readonly DropdownOption<T>[];
  required?: boolean;
  onSelect: (value: T) => void;
  variant?: "default" | "filled";
  wrapperClassName?: string;
}

export function DropdownField<T extends string>({
  label,
  placeholder = "Select an option",
  subtitle,
  value,
  required,
  options,
  onSelect,
  variant = "default",
  wrapperClassName = "",
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const isFilledVariant = variant === "filled";

  const selectedLabel =
    options.find((option) => option.value === value)?.label || value;

  function handleSelect(selectedValue: T) {
    onSelect(selectedValue);
    setIsOpen(false);
  }

  return (
    <View className={`gap-2 ${wrapperClassName}`}>
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
        className={
          isFilledVariant
            ? "bg-surface h-14 flex-row items-center justify-between rounded-2xl border border-slate-200 px-4"
            : "border-textPrimary/10 h-14 flex-row items-center justify-between rounded-xl border bg-[#FFFFFF] px-4 shadow-sm"
        }
        onPress={() => setIsOpen(true)}
      >
        <Text
          className={`text-textPrimary min-w-0 flex-1 text-base ${
            isFilledVariant ? "font-ralewaySemiBold" : "font-ralewayBold"
          }`}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </Text>
        <MaterialCommunityIcons
          name={isFilledVariant ? "chevron-right" : "chevron-down"}
          color="#6F6D6D"
          size={22}
        />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        transparent
        visible={isOpen}
      >
        <View className="flex-1 justify-end bg-[#000000]/35">
          <TouchableOpacity
            activeOpacity={1}
            className="flex-1"
            onPress={() => setIsOpen(false)}
          />
          <View className="max-h-[72%] rounded-t-[28px] bg-[#FFFFFF] px-5 pb-8 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="font-ralewayExtraBold text-textPrimary text-lg">
                  Select {label}
                </Text>
                {subtitle ? (
                  <Text className="mt-1 font-ralewayBold text-xs text-[#6F6D6D]">
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                accessibilityLabel={`Close ${label} options`}
                accessibilityRole="button"
                activeOpacity={0.85}
                className="h-11 w-11 items-center justify-center rounded-full bg-slate-100"
                onPress={() => setIsOpen(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  color="#1E1F45"
                  size={20}
                />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-2">
                {options.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <TouchableOpacity
                      key={option.value}
                      activeOpacity={0.85}
                      className={`min-h-14 flex-row items-center justify-between rounded-lg border px-4 ${
                        isSelected
                          ? "bg-secondary/20 border-primary"
                          : "border-textPrimary/10 bg-[#FFFFFF]"
                      }`}
                      onPress={() => handleSelect(option.value)}
                    >
                      <Text
                        className={`font-ralewayBold text-base ${
                          isSelected ? "text-primary" : "text-textPrimary"
                        }`}
                      >
                        {option.label}
                      </Text>
                      {isSelected ? (
                        <MaterialCommunityIcons
                          name="check"
                          color="#634CE4"
                          size={21}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
