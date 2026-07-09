import React from "react";
import { View, TouchableOpacity, Text, ViewProps } from "react-native";

export interface ChipOption<T> {
  label: string;
  value: T;
}

// Using a discriminating union type to perfectly type check single vs multi-select properties
type ChoiceChipsProps<T> = {
  options: Array<ChipOption<T>>;
  activeClassName?: string;
  inactiveClassName?: string;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
  className?: string; // For the outer container NativeWind style
  style?: ViewProps["style"];
} & (
  | {
      isMultiSelect?: false;
      value: T;
      onSelect: (value: T) => void;
    }
  | {
      isMultiSelect: true;
      value: T[];
      onSelect: (value: T[]) => void;
    }
);

export default function ChoiceChips<T extends string | number | boolean>({
  options,
  value,
  onSelect,
  isMultiSelect = false,
  activeClassName = "border-[#2563EB] bg-[#2563EB]",
  inactiveClassName = "border-[#1d1d1f]/10 bg-[#FFFFFF]",
  activeTextClassName = "text-[#FFFFFF]",
  inactiveTextClassName = "text-[#1d1d1f]",
  className = "flex-row flex-wrap gap-2",
  style,
}: ChoiceChipsProps<T>) {
  
  // Clean checks for checking selection state safely
  const isSelected = (optionValue: T): boolean => {
    if (isMultiSelect && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  const handlePress = (optionValue: T) => {
    if (isMultiSelect && Array.isArray(value)) {
      const updatedArray = value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue];
      (onSelect as (value: T[]) => void)(updatedArray);
    } else {
      (onSelect as (value: T) => void)(optionValue);
    }
  };

  return (
    <View className={className} style={style}>
      {options.map((option) => {
        const selected = isSelected(option.value);

        return (
          <TouchableOpacity
            key={String(option.value)}
            activeOpacity={0.8}
            className={`rounded-full border px-3.5 py-2.5 ${
              selected ? activeClassName : inactiveClassName
            }`}
            onPress={() => handlePress(option.value)}
          >
            <Text
              className={`text-xs font-bold ${
                selected ? activeTextClassName : inactiveTextClassName
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}