import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export interface Option<T = string | number> {
  label: string;
  value: T;
}

interface ChoiceFieldProps<T> {
  label: string;
  options: Option<T>[];
  value: T | T[]; // Supports single value or array of values for multi-select
  onChange: (value: T | T[]) => void;
  emptyText?: string;
  isMultiSelect?: boolean;
  activeColorClass?: string; // Optional: Override default active blue color (e.g., 'bg-emerald-600 border-emerald-600')
  variant?: "pill" | "filled" | "segmented";
}

export function ChoiceField<T extends string | number | boolean>({
  label,
  options,
  value,
  onChange,
  emptyText,
  isMultiSelect = false,
  activeColorClass = "border-[#2563EB] bg-[#2563EB]",
  variant = "pill",
}: ChoiceFieldProps<T>) {
  const isSegmented = variant === "segmented";
  const hasFilledSurface = variant !== "pill";

  // Helper to determine if an option chip is selected
  const isSelected = (optionValue: T) => {
    if (isMultiSelect && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  // Centralized selection logic handler
  const handlePress = (optionValue: T) => {
    if (isMultiSelect && Array.isArray(value)) {
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue) // Remove if already selected
        : [...value, optionValue]; // Add if not selected
      onChange(newValue);
    } else {
      onChange(optionValue); // Single select behavior
    }
  };

  return (
    <View className="gap-3">
      <Text
        className={
          hasFilledSurface
            ? "font-ralewaySemiBold text-sm text-slate-600"
            : "text-[11px] font-ralewayExtraBold uppercase tracking-wide text-[#6F6D6D]"
        }
      >
        {label}
      </Text>

      {options.length === 0 ? (
        <View
          className={`rounded-2xl border border-dashed p-4 ${
            hasFilledSurface
              ? "border-slate-300 bg-slate-50"
              : "border-[#1d1d1f]/20 bg-[#FFFFFF]/90"
          }`}
        >
          <Text className="text-sm font-ralewaySemiBold text-[#6F6D6D]">
            {emptyText ?? "No options available."}
          </Text>
        </View>
      ) : (
        <View
          className={
            isSegmented
              ? "flex-row overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-0.5"
              : "flex-row flex-wrap gap-2"
          }
        >
          {options.map((option) => {
            const selected = isSelected(option.value);

            return (
              <TouchableOpacity
                key={String(option.value)}
                activeOpacity={0.8}
                className={
                  isSegmented
                    ? `h-14 flex-1 items-center justify-center rounded-[14px] ${
                        selected ? "bg-[#2563EB]" : "bg-transparent"
                      }`
                    : `min-h-11 justify-center border px-3.5 py-2.5 ${
                        hasFilledSurface ? "rounded-2xl" : "rounded-full"
                      } ${
                        selected
                          ? activeColorClass
                          : hasFilledSurface
                            ? "border-slate-200 bg-slate-50"
                            : "border-[#1d1d1f]/10 bg-[#FFFFFF]"
                      }`
                }
                onPress={() => handlePress(option.value)}
              >
                <Text
                  className={`${isSegmented ? "font-ralewaySemiBold text-sm" : "text-xs font-ralewayBold"} ${
                    selected
                      ? "text-[#FFFFFF]"
                      : hasFilledSurface
                        ? "text-slate-600"
                        : "text-[#1d1d1f]"
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
