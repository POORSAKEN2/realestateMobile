import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useState } from "react";

import { MoreBottomSheet } from "../../components/navigation/MoreBottomSheet";
import { colors } from "../../constants/colors";
import { Platform } from "react-native";

export default function TabsLayout() {
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.whitePrimary },
          headerTintColor: colors.black,
          tabBarActiveTintColor: colors.secondary,
          tabBarInactiveTintColor: "#94A3B8",
          tabBarLabelStyle: {
            fontFamily: "Raleway_800ExtraBold",
            fontSize: 11,
          },
          tabBarItemStyle: {
            paddingVertical: 6,
          },
          tabBarStyle: {
            backgroundColor: colors.whitePrimary,
            borderTopColor: "#E2E8F0",
            borderTopWidth: 1,
            height: Platform.OS === "ios" ? 96 : 80,
            paddingBottom: 8,
            paddingTop: 6,
            shadowColor: "#0F172A",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 24,
            elevation: 12,
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
        <Tabs.Screen name="index" options={{ href: null, title: "Home" }} />
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
          name="bookings"
          options={{
            href: null,
            title: "Bookings",
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
          listeners={{
            tabPress: (event) => {
              event.preventDefault();
            },
          }}
          options={{
            title: "Rent",
            tabBarAccessibilityLabel: "Rent collection, coming soon",
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "cash-multiple" : "cash"}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          listeners={{
            tabPress: (event) => {
              event.preventDefault();
              setIsMoreMenuVisible(true);
            },
          }}
          options={{
            title: "More",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>

      <MoreBottomSheet
        visible={isMoreMenuVisible}
        onClose={() => setIsMoreMenuVisible(false)}
      />
    </>
  );
}
