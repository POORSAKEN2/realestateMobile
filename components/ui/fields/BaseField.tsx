import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Or your specific Ionicons path

interface FieldProps extends Omit<TextInputProps, 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function BaseField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  icon,
  autoCapitalize,
  ...rest
}: FieldProps) {
  
  // 1. Determine layout variant styles (Profile Icon style vs Standard style)
  const isIconVariant = !!icon;
  
  // 2. Resolve conflicting style classes between modules
  const labelClassName = isIconVariant
    ? "text-[11px] font-bold uppercase tracking-wide text-slate-500"
    : "text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]";

  const containerClassName = isIconVariant
    ? "h-14 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm shadow-slate-900/5"
    : `rounded-2xl border border-[#1d1d1f]/10 bg-[#FFFFFF] px-4 shadow-sm ${
        multiline ? "min-h-28 py-4" : "h-14"
      }`;

  const inputClassName = isIconVariant
    ? "ml-3 flex-1 text-base font-semibold text-slate-950"
    : "flex-1 text-base text-[#1d1d1f]";

  const resolvedPlaceholderColor = isIconVariant ? "#94A3B8" : "#6F6D6D";

  // 3. Smart fallbacks for specific business logic (e.g., Tenants auto-capitalize)
  const resolvedAutoCapitalize = autoCapitalize 
    ? autoCapitalize 
    : keyboardType === "email-address" 
      ? "none" 
      : "words";

  return (
    <View className="gap-2">
      <Text className={labelClassName}>{label}</Text>
      
      <View className={containerClassName}>
        {icon && <Ionicons name={icon} color="#64748B" size={19} />}
        
        <TextInput
          className={inputClassName}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={resolvedPlaceholderColor}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize={resolvedAutoCapitalize}
          textAlignVertical={multiline ? "top" : "center"}
          {...rest} // Easily handles native props like secureTextEntry, autoCorrect, etc.
        />
      </View>
    </View>
  );
}