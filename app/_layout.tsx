import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  useFonts,
} from '@expo-google-fonts/sora';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput } from 'react-native';

import '../global.css';
import { AuthProvider } from '../context/AuthContext';

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

const defaultFontStyle = { fontFamily: 'Sora_400Regular' };

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
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
