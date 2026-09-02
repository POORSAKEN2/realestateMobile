import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../constants/colors";
import { getStandardModalSheetHeight } from "../../constants/modal";
import { BottomSheetModal } from "./BottomSheetModal";
import { MODAL_ACTION_FOOTER_CONTENT_HEIGHT } from "./ModalActionFooter";
import { ModalHeader } from "./ModalHeader";

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
  const { height } = useWindowDimensions();
  const maxSheetHeight = getStandardModalSheetHeight(height);

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
      bottomInsetMode="safe-area"
      onClose={onClose}
      onDismiss={handleDismiss}
      visible={visible}
    >
      <SafeAreaView
        accessibilityViewIsModal
        className="overflow-hidden rounded-t-[28px] bg-white"
        edges={["bottom"]}
        style={{ maxHeight: maxSheetHeight }}
      >
        <ModalHeader
          closeAccessibilityLabel={`Close ${title}`}
          onClose={onClose}
          subtitle={subtitle}
          title={title}
        />

        <ScrollView
          bounces={false}
          contentContainerStyle={{
            gap: 8,
            paddingBottom: MODAL_ACTION_FOOTER_CONTENT_HEIGHT,
            paddingHorizontal: 20,
            paddingTop: 16,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 1 }}
        >
          {actions.map((action) => {
            const color = action.destructive ? "#B42318" : colors.primary;

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
                  action.destructive ? "bg-dangerSurface" : "bg-primary/10"
                } ${action.disabled ? "opacity-50" : ""}`}
                disabled={action.disabled}
                key={action.label}
                onPress={() => handleAction(action)}
              >
                <View
                  className={`h-10 w-10 items-center justify-center rounded-xl ${
                    action.destructive ? "bg-dangerSurface" : "bg-primary/10"
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
                      action.destructive ? "text-danger" : "text-textPrimary"
                    }`}
                  >
                    {action.label}
                  </Text>
                  {action.description ? (
                    <Text className="mt-0.5 text-xs leading-4 text-description">
                      {action.description}
                    </Text>
                  ) : null}
                </View>
                {action.selected === undefined ? (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    color={action.destructive ? "#B42318" : "#6F6D6D"}
                    size={20}
                  />
                ) : action.selected ? (
                  <MaterialCommunityIcons
                    name="check-circle"
                    color={colors.primary}
                    size={21}
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </BottomSheetModal>
  );
}
