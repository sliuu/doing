import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { DbBootstrap } from '@/db/bootstrap';
import { DbProvider } from '@/db/provider';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DbProvider>
        <DbBootstrap>
          <Stack screenOptions={{ headerShown: false }} />
        </DbBootstrap>
      </DbProvider>
    </ThemeProvider>
  );
}
