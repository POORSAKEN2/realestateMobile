import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import {
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import BrandLogomarkWhite from "../../assets/branding/svg/brand-logomark-white.svg";
import { colors } from "../../constants/colors";

const ADD_BUTTON_SIZE = 64;
const ADD_BUTTON_GAP = 24;
const NOTCH_DEPTH = ADD_BUTTON_SIZE / 2 + ADD_BUTTON_GAP;
const NOTCH_HALF_WIDTH = 64;
const NOTCH_OUTER_CONTROL = 28;
const NOTCH_INNER_CONTROL = 56;
const TAB_BAR_CONTENT_HEIGHT = 64;
const TAB_BAR_TOP = NOTCH_DEPTH;
const PRIMARY_TABS = [
  { label: "Home", name: "dashboard" },
  { label: "Properties", name: "properties" },
  { label: "Add", name: "index" },
  { label: "Tenants", name: "tenants" },
  { label: "Profile", name: "profile" },
] as const;

function AppTabBar({ descriptors, navigation, state }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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

  return (
    <View
      pointerEvents="box-none"
      style={{
        bottom: 0,
        height: totalHeight,
        left: 0,
        position: "absolute",
        width,
      }}
    >
      <Svg
        height={totalHeight}
        pointerEvents="none"
        style={{ left: 0, overflow: "visible", position: "absolute", top: 0 }}
        width={width}
      >
        <Path
          d={barPath}
          fill={colors.whitePrimary}
          stroke={colors.accent}
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
        }}
      >
        {PRIMARY_TABS.map((tab) => {
          if (tab.name === "index") {
            return <View className="flex-1" key={tab.name} />;
          }

          const routeIndex = state.routes.findIndex(
            (route) => route.name === tab.name,
          );
          const route = state.routes[routeIndex];

          if (!route) return <View className="flex-1" key={tab.name} />;

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
                const event = navigation.emit({
                  canPreventDefault: true,
                  target: route.key,
                  type: "tabPress",
                });

                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
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
        })}
      </View>

      <View
        accessibilityLabel="Add, unavailable"
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        className="absolute mt-4 items-center justify-center rounded-full bg-primary shadow-lg"
        pointerEvents="none"
        style={{
          height: ADD_BUTTON_SIZE,
          left: center - ADD_BUTTON_SIZE / 2,
          top: TAB_BAR_TOP - ADD_BUTTON_SIZE / 2,
          width: ADD_BUTTON_SIZE,
        }}
      >
        <BrandLogomarkWhite width={40} height={40} />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.whitePrimary },
        headerTintColor: colors.black,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: "Raleway_800ExtraBold",
          fontSize: 11,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: "Properties",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "office-building" : "office-building-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Add",
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          href: null,
          title: "Expenses",
        }}
      />
      <Tabs.Screen
        name="tenants"
        options={{
          title: "Tenants",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rent"
        options={{
          href: null,
          title: "Rent",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarAccessibilityLabel: "Open profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          href: null,
          title: "More",
        }}
      />
    </Tabs>
  );
}
