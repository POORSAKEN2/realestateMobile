import React from "react";
import { View, TouchableOpacity, Text, ViewProps } from "react-native";

export interface ChipOption<T> {
  label: string;
  value: T;
  trailingIcon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
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
  showSelectionIndicator?: boolean;
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
  activeClassName = "border-primary bg-primary",
  inactiveClassName = "border-textPrimary/10 bg-panel",
  activeTextClassName = "text-whitePrimary",
  inactiveTextClassName = "text-textPrimary",
  className = "flex-row flex-wrap gap-2",
  style,
  showSelectionIndicator = false,
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
        const hasAdornments =
          showSelectionIndicator || Boolean(option.trailingIcon);
        const label = (
          <Text
            className={`font-ralewayExtraBold text-xs ${
              selected ? activeTextClassName : inactiveTextClassName
            }${hasAdornments ? " min-w-0 shrink" : ""}`}
          >
            {option.label}
          </Text>
        );

        return (
          <TouchableOpacity
            key={String(option.value)}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityHint={option.accessibilityHint}
            accessibilityRole={isMultiSelect ? "checkbox" : "radio"}
            accessibilityState={{ checked: selected }}
            activeOpacity={0.8}
            className={`min-h-11 justify-center rounded-full border px-3.5 py-2.5 ${
              selected ? activeClassName : inactiveClassName
            }${hasAdornments ? " max-w-full" : ""}`}
            onPress={() => handlePress(option.value)}
          >
            {hasAdornments ? (
              <View className="max-w-full flex-row items-center gap-2">
                {showSelectionIndicator && selected ? (
                  <Text
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    className={`shrink-0 text-sm ${activeTextClassName}`}
                  >
                    ✓
                  </Text>
                ) : null}
                {label}
                {option.trailingIcon ? (
                  <View
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    className="shrink-0"
                  >
                    {option.trailingIcon}
                  </View>
                ) : null}
              </View>
            ) : (
              label
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
