import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Or your specific icon import

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  label: string;
  placeholder?: string;
  subtitle?: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
}

export function DropdownField({
  label,
  placeholder = "Select an option",
  subtitle,
  value,
  options,
  onSelect,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel =
    options.find((option) => option.value === value)?.label || value;

  function handleSelect(selectedValue: string) {
    onSelect(selectedValue);
    setIsOpen(false);
  }

  return (
    <View className="gap-2">
      <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
        {label}
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        className="h-14 flex-row items-center justify-between rounded-xl border border-[#1d1d1f]/10 bg-[#FFFFFF] px-4 shadow-sm"
        onPress={() => setIsOpen(true)}
      >
        <Text className="text-base font-semibold text-[#1d1d1f]">
          {selectedLabel || placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" color="#6F6D6D" size={22} />
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
                <Text className="text-lg font-bold text-[#1d1d1f]">
                  Select {label}
                </Text>
                {subtitle ? (
                  <Text className="mt-1 text-xs font-semibold text-[#6F6D6D]">
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#1d1d1f]/10"
                onPress={() => setIsOpen(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  color="#1d1d1f"
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
                          ? "border-[#2563EB] bg-[#2563EB]/10"
                          : "border-[#1d1d1f]/10 bg-[#FFFFFF]"
                      }`}
                      onPress={() => handleSelect(option.value)}
                    >
                      <Text
                        className={`text-base font-semibold ${
                          isSelected ? "text-[#2563EB]" : "text-[#1d1d1f]"
                        }`}
                      >
                        {option.label}
                      </Text>
                      {isSelected ? (
                        <MaterialCommunityIcons
                          name="check"
                          color="#2563EB"
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
