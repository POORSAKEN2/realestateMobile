import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useThemeColors } from "../../context/WorkspacePresentationContext";

type ModuleHeaderProps = {
  action?: ReactNode;
  eyebrow?: string;
  leading?: ReactNode;
  supportingText?: string;
  title: string;
  centerTitle?: boolean;
};

export function ModuleHeader({
  action,
  eyebrow,
  leading,
  supportingText,
  title,
  centerTitle,
}: ModuleHeaderProps) {
  const palette = useThemeColors();
  return (
    <View className="flex-row items-center gap-3">
      {leading}

      <View className="min-w-0 flex-1">
        {eyebrow ? (
          <Text
            className="font-ralewayExtraBold text-[11px] uppercase tracking-[2px]"
            style={{ color: palette.description }}
          >
            {eyebrow}
          </Text>
        ) : null}

        <Text
          accessibilityRole="header"
          className={
            `font-ralewayExtraBold text-[30px] leading-9 tracking-tight` +
            (centerTitle ? " text-center" : "")
          }
          numberOfLines={1}
          style={{ color: palette.text }}
        >
          {title}
        </Text>
        {supportingText ? (
          <Text
            className="mt-0.5 font-ralewayMedium text-sm"
            style={{ color: palette.description }}
          >
            {supportingText}
          </Text>
        ) : null}
      </View>

      {action ? <View className="shrink-0">{action}</View> : null}
    </View>
  );
}
