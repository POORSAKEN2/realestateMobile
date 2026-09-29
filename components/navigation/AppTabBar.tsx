import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import {
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { useAccess } from "../../hooks/auth/useAccess";
import { useAuth } from "../../hooks/useAuth";
import { useReducedMotionPreference } from "../../hooks/ui/useReducedMotionPreference";
import { ROUTE_PERMISSIONS } from "../../utils/auth/routeAccess";
import {
  hasAppPermission,
  type AppPermission,
} from "../../utils/auth/accessPolicy";
import { colors } from "../../constants/colors";
import { tabBarLayout } from "../../constants/tabBar";
import { getQuickNavigationItems } from "../../constants/quickNavigation";
import { useThemeColors } from "../../context/WorkspacePresentationContext";
import { QuickNavigationButton } from "./QuickNavigationButton";
import { QuickNavigationSheet } from "./QuickNavigationSheet";

const ADD_BUTTON_SIZE = tabBarLayout.addButtonSize;
const ADD_BUTTON_GAP = 24;
const NOTCH_DEPTH = ADD_BUTTON_SIZE / 2 + ADD_BUTTON_GAP;
const NOTCH_HALF_WIDTH = 64;
const NOTCH_OUTER_CONTROL = 28;
const NOTCH_INNER_CONTROL = 56;
const TAB_BAR_CONTENT_HEIGHT = tabBarLayout.contentHeight;
const LEFT_TABS = [
  { label: "Home", name: "dashboard" },
  { label: "Properties", name: "properties" },
] as const;
const RIGHT_TABS = [
  { label: "Tenants", name: "tenants" },
  { label: "Profile", name: "profile" },
] as const;
type PrimaryTab = (typeof LEFT_TABS)[number] | (typeof RIGHT_TABS)[number];

function AppTabBarView({
  descriptors,
  navigation,
  state,
  open,
  disabled,
  reducedMotion,
  onToggle,
  onSelect,
  docked = false,
}: BottomTabBarProps & {
  open: boolean;
  disabled: boolean;
  reducedMotion: boolean;
  onToggle: () => void;
  onSelect?: (action: () => void, permission?: AppPermission) => void;
  docked?: boolean;
}) {
  const { can } = useAccess();
  const palette = useThemeColors();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const TAB_BAR_TOP = docked
    ? ADD_BUTTON_SIZE / 2 - tabBarLayout.addButtonOffset
    : NOTCH_DEPTH;
  const barHeight = TAB_BAR_CONTENT_HEIGHT + insets.bottom;
  const barBottom = TAB_BAR_TOP + barHeight;
  const totalHeight = barBottom;
  const center = width / 2;
  const barPath = [
    `M 0 ${TAB_BAR_TOP}`,
    `H ${center - NOTCH_HALF_WIDTH}`,
    `C ${center - NOTCH_OUTER_CONTROL} ${TAB_BAR_TOP}, ${center - NOTCH_INNER_CONTROL} ${TAB_BAR_TOP + NOTCH_DEPTH}, ${center} ${TAB_BAR_TOP + NOTCH_DEPTH}`,
    `C ${center + NOTCH_INNER_CONTROL} ${TAB_BAR_TOP + NOTCH_DEPTH}, ${center + NOTCH_OUTER_CONTROL} ${TAB_BAR_TOP}, ${center + NOTCH_HALF_WIDTH} ${TAB_BAR_TOP}`,
    `H ${width}`,
    `V ${barBottom}`,
    "H 0",
    "Z",
  ].join(" ");

  function renderTab(tab: PrimaryTab) {
    const permission = ROUTE_PERMISSIONS[tab.name];
    if (permission && !can(permission)) return null;

    const routeIndex = state.routes.findIndex(
      (route) => route.name === tab.name,
    );
    const route = state.routes[routeIndex];

    if (!route) return null;

    const options = descriptors[route.key].options;
    const focused = state.index === routeIndex;
    const color = focused ? colors.primary : colors.muted;

    return (
      <TouchableOpacity
        accessibilityLabel={options.tabBarAccessibilityLabel ?? tab.label}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        activeOpacity={0.72}
        className="flex-1 items-center justify-center pt-1"
        key={tab.name}
        onLongPress={() =>
          navigation.emit({
            target: route.key,
            type: "tabLongPress",
          })
        }
        onPress={() => {
          const select = () => {
            const event = navigation.emit({
              canPreventDefault: true,
              target: route.key,
              type: "tabPress",
            });
            if (!focused && !event.defaultPrevented)
              navigation.navigate(route.name, route.params);
          };
          if (onSelect) onSelect(select, permission);
          else select();
        }}
      >
        {options.tabBarIcon?.({ color, focused, size: 24 })}
        <Text
          className="mt-1 font-ralewayExtraBold text-[11px]"
          style={{ color }}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        bottom: 0,
        height: totalHeight,
        left: 0,
        position: docked ? "relative" : "absolute",
        width,
      }}
    >
      <QuickNavigationButton
        open={open}
        disabled={disabled}
        reducedMotion={reducedMotion}
        onPress={onToggle}
        left={center - ADD_BUTTON_SIZE / 2}
        top={TAB_BAR_TOP - ADD_BUTTON_SIZE / 2 + tabBarLayout.addButtonOffset}
      />

      <Svg
        height={totalHeight}
        pointerEvents="none"
        style={{
          left: 0,
          overflow: "visible",
          position: "absolute",
          top: 0,
          zIndex: 1,
        }}
        width={width}
      >
        <Path
          d={barPath}
          fill={palette.panel}
          stroke={palette.primary}
          strokeOpacity={0.32}
          strokeLinejoin="round"
          strokeWidth={2}
        />
      </Svg>

      <View
        className="flex-row"
        style={{
          height: barHeight,
          left: 0,
          paddingBottom: insets.bottom,
          position: "absolute",
          right: 0,
          top: TAB_BAR_TOP,
          zIndex: 2,
        }}
      >
        <View className="flex-row" style={{ flex: 2 }}>
          {LEFT_TABS.map(renderTab)}
        </View>
        <View style={{ flex: 1 }} />
        <View className="flex-row" style={{ flex: 2 }}>
          {RIGHT_TABS.map(renderTab)}
        </View>
      </View>
    </View>
  );
}

export function AppTabBar(props: BottomTabBarProps) {
  const { session } = useAuth();
  const router = useRouter();
  const reducedMotion = useReducedMotionPreference();
  const items = useMemo(
    () => getQuickNavigationItems(session?.user),
    [session?.user],
  );
  const [open, setOpen] = useState(false);
  const [presented, setPresented] = useState(false);
  const openRef = useRef(false);
  const pending = useRef<(() => void) | null>(null);
  const userRef = useRef(session?.user);
  userRef.current = session?.user;

  const close = useCallback(() => {
    openRef.current = false;
    setOpen(false);
  }, []);
  const toggle = () => {
    if (pending.current) return;
    if (openRef.current) close();
    else if (items.length) {
      openRef.current = true;
      setPresented(true);
      setOpen(true);
    }
  };
  const select = (action: () => void, permission?: AppPermission) => {
    if (!openRef.current || pending.current) return;
    pending.current = () => {
      if (!permission || hasAppPermission(userRef.current, permission))
        action();
    };
    close();
  };
  const dismissed = useCallback(() => {
    if (openRef.current) return;
    setPresented(false);
    const action = pending.current;
    pending.current = null;
    if (userRef.current) action?.();
  }, []);

  useEffect(() => {
    if (!session?.user || !items.length) {
      pending.current = null;
      close();
    }
  }, [session?.user, items.length, close]);
  useEffect(() => {
    pending.current = null;
    close();
  }, [session?.accessToken, close]);
  useEffect(
    () => () => {
      pending.current = null;
    },
    [],
  );

  const barProps = {
    ...props,
    open,
    disabled: !items.length,
    reducedMotion,
    onToggle: toggle,
  };
  return (
    <>
      <View
        pointerEvents={presented ? "none" : "box-none"}
        accessibilityElementsHidden={presented}
        importantForAccessibility={presented ? "no-hide-descendants" : "auto"}
      >
        <AppTabBarView {...barProps} />
      </View>
      <QuickNavigationSheet
        visible={open}
        reducedMotion={reducedMotion}
        items={items}
        onClose={close}
        onDismiss={dismissed}
        onNavigate={(item) =>
          select(() => {
            if (
              getQuickNavigationItems(userRef.current).some(
                ({ href }) => href === item.href,
              )
            ) {
              router.navigate(item.href);
            }
          })
        }
        footer={<AppTabBarView {...barProps} docked onSelect={select} />}
      />
    </>
  );
}
