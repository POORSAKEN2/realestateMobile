import {
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
  Raleway_700Bold,
  Raleway_800ExtraBold,
  Raleway_900Black,
  useFonts,
} from "@expo-google-fonts/raleway";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import { Text, TextInput, LogBox } from "react-native";

LogBox.ignoreLogs([
  "Unable to activate keep awake",
]);

import "../global.css";
import { NotificationBootstrap } from "../components/notifications/NotificationBootstrap";
import { AuthProvider } from "../context/AuthContext";
import { DefaultLocationProvider } from "../context/DefaultLocationContext";

type TextWithDefaultProps = typeof Text & {
  defaultProps?: {
    style?: { fontFamily?: string };
  };
};

type TextInputWithDefaultProps = typeof TextInput & {
  defaultProps?: {
    style?: { fontFamily?: string };
  };
};

const defaultFontStyle = { fontFamily: "Raleway_500Medium" };

(Text as TextWithDefaultProps).defaultProps = {
  ...(Text as TextWithDefaultProps).defaultProps,
  style: defaultFontStyle,
};

(TextInput as TextInputWithDefaultProps).defaultProps = {
  ...(TextInput as TextInputWithDefaultProps).defaultProps,
  style: defaultFontStyle,
};

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 1000 * 60,
          },
        },
      }),
  );

  const [fontsLoaded] = useFonts({
    Raleway_400Regular,
    Raleway_500Medium,
    Raleway_600SemiBold,
    Raleway_700Bold,
    Raleway_800ExtraBold,
    Raleway_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DefaultLocationProvider>
          <NotificationBootstrap />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </DefaultLocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
