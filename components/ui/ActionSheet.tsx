import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomSheetModal } from "./BottomSheetModal";

export type ActionSheetItem = {
  description?: string;
  destructive?: boolean;
  disabled?: boolean;
  dismissOnPress?: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  selected?: boolean;
};

export function ActionSheet({
  actions,
  onClose,
  subtitle,
  title,
  visible,
}: {
  actions: ActionSheetItem[];
  onClose: () => void;
  subtitle?: string;
  title: string;
  visible: boolean;
}) {
  const pendingAction = useRef<(() => void) | null>(null);

  function handleAction(action: ActionSheetItem) {
    if (action.dismissOnPress === false) {
      action.onPress();
      return;
    }

    pendingAction.current = action.onPress;
    onClose();
  }

  function handleDismiss() {
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  }

  return (
    <BottomSheetModal
      backdropAccessibilityLabel={`Close ${title}`}
      onClose={onClose}
      onDismiss={handleDismiss}
      visible={visible}
    >
      <SafeAreaView
        accessibilityViewIsModal
        className="rounded-t-[28px] bg-white px-5 pb-4 pt-5"
        edges={["bottom"]}
      >
        <View className="mb-4 flex-row items-start gap-3">
          <View className="min-w-0 flex-1">
            <Text
              accessibilityRole="header"
              className="font-ralewayBold text-xl text-textPrimary"
            >
              {title}
            </Text>
            {subtitle ? (
              <Text className="mt-1 text-sm leading-5 text-slate-500">
                {subtitle}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            accessibilityLabel={`Close ${title}`}
            accessibilityRole="button"
            activeOpacity={0.8}
            className="h-11 w-11 items-center justify-center rounded-full bg-slate-100"
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" color="#334155" size={20} />
          </TouchableOpacity>
        </View>

        <View className="gap-2">
          {actions.map((action) => {
            const color = action.destructive ? "#DC2626" : "#634CE4";

            return (
              <TouchableOpacity
                accessibilityRole={
                  action.selected === undefined ? "button" : "radio"
                }
                accessibilityState={{
                  checked: action.selected,
                  disabled: action.disabled,
                }}
                activeOpacity={0.8}
                className={`min-h-16 flex-row items-center gap-3 rounded-2xl px-4 py-3 ${
                  action.destructive ? "bg-red-50" : "bg-secondary/10"
                } ${action.disabled ? "opacity-50" : ""}`}
                disabled={action.disabled}
                key={action.label}
                onPress={() => handleAction(action)}
              >
                <View
                  className={`h-10 w-10 items-center justify-center rounded-xl ${
                    action.destructive ? "bg-red-100" : "bg-secondary/10"
                  }`}
                >
                  <MaterialCommunityIcons
                    name={action.icon}
                    color={color}
                    size={19}
                  />
                </View>
                <View className="min-w-0 flex-1">
                  <Text
                    className={`font-ralewayBold text-sm ${
                      action.destructive ? "text-red-700" : "text-slate-700"
                    }`}
                  >
                    {action.label}
                  </Text>
                  {action.description ? (
                    <Text className="mt-0.5 text-xs leading-4 text-slate-500">
                      {action.description}
                    </Text>
                  ) : null}
                </View>
                {action.selected === undefined ? (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    color={action.destructive ? "#F87171" : "#94A3B8"}
                    size={20}
                  />
                ) : action.selected ? (
                  <MaterialCommunityIcons
                    name="check-circle"
                    color="#634CE4"
                    size={21}
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </BottomSheetModal>
  );
}
