import { View, TouchableOpacity, Text, ScrollView } from "react-native";

type Choice<T extends string> = {
  label: string;
  value: T;
};

export function ChoiceGroup<T extends string>({
  label,
  choices,
  value,
  onSelect,
  horizontal = false,
  variant = "pill",
}: {
  label?: string;
  choices: Choice<T>[];
  value: T;
  onSelect: (value: T) => void;
  horizontal?: boolean;
  variant?: "pill" | "segmented";
}) {
  const isSegmented = variant === "segmented";
  const content = (
    <View
      className={
        isSegmented
          ? "flex-row overflow-hidden rounded-2xl border border-primary/20 bg-surface p-0.5"
          : "flex-row flex-wrap gap-2"
      }
    >
      {choices.map((choice) => {
        const selected = choice.value === value;

        return (
          <TouchableOpacity
            key={choice.value}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={
              isSegmented
                ? `h-14 flex-1 items-center justify-center rounded-[14px] ${
                    selected ? "bg-primary" : "bg-transparent"
                  }`
                : `min-h-11 items-center justify-center rounded-full border px-3.5 py-2.5 ${
                    selected
                      ? "border-primary bg-primary"
                      : "border-primary/20 bg-primary/10"
                  }`
            }
            onPress={() => onSelect(choice.value)}
          >
            <Text
              className={`${isSegmented ? "font-ralewaySemiBold text-base" : "font-ralewayBold text-xs"} ${
                selected
                  ? "text-whitePrimary"
                  : isSegmented
                    ? "text-description"
                    : "text-textPrimary"
              }`}
            >
              {choice.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View className={label ? "gap-3" : ""}>
      {label ? (
        <Text
          className={
            isSegmented
              ? "font-ralewaySemiBold text-sm text-description"
              : "font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description"
          }
        >
          {label}
        </Text>
      ) : null}
      {horizontal ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="pr-6">{content}</View>
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}
