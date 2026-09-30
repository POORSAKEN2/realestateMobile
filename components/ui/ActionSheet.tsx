import { useAccess } from "../../hooks/auth/useAccess";
import type { AppPermission } from "../../types/auth/access";
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

import { getStandardModalSheetHeight } from "../../constants/modal";
import {
  useThemeColors,
  useWorkspacePresentation,
} from "../../context/WorkspacePresentationContext";
import { BottomSheetModal } from "./BottomSheetModal";
import { MODAL_ACTION_FOOTER_CONTENT_HEIGHT } from "./ModalActionFooter";
import { ModalHeader } from "./ModalHeader";

export type ActionSheetItem = {
  permission?: AppPermission;
  propertyId?: string;
  description?: string;
  destructive?: boolean;
  disabled?: boolean;
  dismissOnPress?: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  selected?: boolean;
  section?: string;
};

function ActionRow({
  action,
  grouped,
  isLast,
  onPress,
}: {
  action: ActionSheetItem;
  grouped: boolean;
  isLast: boolean;
  onPress: () => void;
}) {
  const palette = useThemeColors();
  const { resolvedTheme } = useWorkspacePresentation();
  const iconColor = action.destructive
    ? palette.danger
    : grouped && resolvedTheme === "light"
      ? palette.primaryStrong
      : grouped
        ? palette.secondary
        : palette.primary;

  return (
    <TouchableOpacity
      accessibilityHint={action.description}
      accessibilityLabel={action.label}
      accessibilityRole={action.selected === undefined ? "button" : "radio"}
      accessibilityState={{
        checked: action.selected,
        disabled: action.disabled,
      }}
      activeOpacity={0.8}
      className={`min-h-16 flex-row items-center gap-3 px-4 py-3 ${
        grouped
          ? isLast
            ? ""
            : "border-b border-primary/10"
          : `rounded-2xl ${action.destructive ? "bg-dangerSurface" : "bg-primary/10"}`
      } ${action.disabled ? "opacity-50" : ""}`}
      disabled={action.disabled}
      onPress={onPress}
    >
      <View
        className={`h-11 w-11 items-center justify-center rounded-xl ${
          action.destructive ? "bg-dangerSurface" : "bg-primary/10"
        }`}
      >
        <MaterialCommunityIcons
          name={action.icon}
          color={iconColor}
          size={20}
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
          color={action.destructive ? palette.danger : palette.description}
          size={20}
        />
      ) : action.selected ? (
        <MaterialCommunityIcons
          name="check-circle"
          color={palette.primary}
          size={21}
        />
      ) : null}
    </TouchableOpacity>
  );
}

export function ActionSheet({
  actions,
  grouped = false,
  onClose,
  subtitle,
  title,
  visible,
}: {
  actions: ActionSheetItem[];
  grouped?: boolean;
  onClose: () => void;
  subtitle?: string;
  title: string;
  visible: boolean;
}) {
  const { can } = useAccess();
  const visibleActions = actions.filter(
    (action) => !action.permission || can(action.permission, action.propertyId),
  );
  const groups: { title: string; actions: ActionSheetItem[] }[] = [];
  if (grouped) {
    for (const action of visibleActions) {
      const title = action.section ?? "Actions";
      const lastGroup = groups.at(-1);
      if (lastGroup?.title === title) lastGroup.actions.push(action);
      else groups.push({ title, actions: [action] });
    }
  }
  const pendingAction = useRef<(() => void) | null>(null);
  const { height } = useWindowDimensions();
  const maxSheetHeight = getStandardModalSheetHeight(height);

  function handleAction(action: ActionSheetItem) {
    if (
      pendingAction.current ||
      action.disabled ||
      (action.permission && !can(action.permission, action.propertyId))
    )
      return;
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
        className="overflow-hidden rounded-t-[28px] bg-panel"
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
            gap: grouped ? 16 : 8,
            paddingBottom: MODAL_ACTION_FOOTER_CONTENT_HEIGHT,
            paddingHorizontal: 20,
            paddingTop: 16,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 1 }}
        >
          {grouped
            ? groups.map((group, index) => (
                <View key={`${group.title}:${index}`}>
                  <Text
                    accessibilityRole="header"
                    className="mb-2 ml-1 font-ralewayBold text-xs uppercase tracking-wider text-description"
                  >
                    {group.title}
                  </Text>
                  <View className="overflow-hidden rounded-2xl border border-primary/15 bg-surface">
                    {group.actions.map((action, index) => (
                      <ActionRow
                        action={action}
                        grouped
                        isLast={index === group.actions.length - 1}
                        key={action.label}
                        onPress={() => handleAction(action)}
                      />
                    ))}
                  </View>
                </View>
              ))
            : visibleActions.map((action) => (
                <ActionRow
                  action={action}
                  grouped={false}
                  isLast
                  key={action.label}
                  onPress={() => handleAction(action)}
                />
              ))}
        </ScrollView>
      </SafeAreaView>
    </BottomSheetModal>
  );
}
