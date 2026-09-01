import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import Svg, { Path } from "react-native-svg";

import { colors } from "../../constants/colors";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";

const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 96 : 80;

function CurvedTabBarBackground() {
  const { width } = useWindowDimensions();
  const center = width / 2;
  const notchHalfWidth = 56;
  const notchDepth = 42;
  const notchStart = center - notchHalfWidth;
  const notchEnd = center + notchHalfWidth;
  const leftCurveControl = center - 44;
  const rightCurveControl = center + 44;
  const backgroundPath = [
    `M 0 0`,
    `H ${notchStart}`,
    `C ${leftCurveControl} 0, ${leftCurveControl} ${notchDepth}, ${center} ${notchDepth}`,
    `C ${rightCurveControl} ${notchDepth}, ${rightCurveControl} 0, ${notchEnd} 0`,
    `H ${width}`,
    `V ${TAB_BAR_HEIGHT}`,
    `H 0`,
    "Z",
  ].join(" ");

  const notchFillPath = [
    `M ${notchStart} 0`,
    `C ${leftCurveControl} 0, ${leftCurveControl} ${notchDepth}, ${center} ${notchDepth}`,
    `C ${rightCurveControl} ${notchDepth}, ${rightCurveControl} 0, ${notchEnd} 0`,
    "Z",
  ].join(" ");

  return (
    <Svg height={TAB_BAR_HEIGHT} width={width} style={StyleSheet.absoluteFill}>
      <Path d={backgroundPath} fill={colors.whitePrimary} />
      <Path d={notchFillPath} fill={colors.surface} />
    </Svg>
  );
}

function AddTabBarButton() {
  return (
    <View
      accessibilityLabel="Add, unavailable"
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      className="flex-1 items-center"
      pointerEvents="none"
    >
      <View className="-mt-10 h-16 w-16 items-center justify-center rounded-full bg-primary">
        <Ionicons name="add" color={colors.whitePrimary} size={36} />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
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
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: "transparent",
          shadowOpacity: 0,
          shadowRadius: 0,
        },
        tabBarBackground: () => <CurvedTabBarBackground />,
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
          tabBarButton: () => <AddTabBarButton />,
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
