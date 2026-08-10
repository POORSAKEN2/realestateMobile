import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useState } from "react";

import { MoreBottomSheet } from "../../components/navigation/MoreBottomSheet";
import { colors } from "../../constants/colors";

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
            position: "absolute",
            backgroundColor: colors.whitePrimary,
            borderColor: "#E2E8F0",
            borderRadius: 24,
            borderTopWidth: 2,
            borderWidth: 2,
            bottom: 32,
            height: 80,
            marginHorizontal: 12,
            paddingBottom: 8,
            paddingTop: 6,
            shadowColor: "#0F172A",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.14,
            shadowRadius: 22,
            elevation: 16,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "view-dashboard" : "view-dashboard-outline"}
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
            title: "Bookings",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "calendar" : "calendar-outline"}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: "Expenses",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "receipt" : "receipt-outline"}
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
