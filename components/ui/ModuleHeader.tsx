import type { ReactNode } from "react";
import { Text, View } from "react-native";

type ModuleHeaderProps = {
  action?: ReactNode;
  eyebrow: string;
  leading?: ReactNode;
  supportingText?: string;
  title: string;
};

export function ModuleHeader({
  action,
  eyebrow,
  leading,
  supportingText,
  title,
}: ModuleHeaderProps) {
  return (
    <View className="flex-row items-center gap-3">
      {leading}

      <View className="min-w-0 flex-1">
        <Text className="text-[11px] font-ralewayExtraBold uppercase tracking-[2px] text-description">
          {eyebrow}
        </Text>
        <Text
          accessibilityRole="header"
          className="font-ralewayExtraBold text-[30px] leading-9 tracking-tight text-textPrimary"
          numberOfLines={1}
        >
          {title}
        </Text>
        {supportingText ? (
          <Text className="mt-0.5 text-sm font-ralewayMedium text-description">
            {supportingText}
          </Text>
        ) : null}
      </View>

      {action ? <View className="shrink-0">{action}</View> : null}
    </View>
  );
}
