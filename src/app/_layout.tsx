import { DarkTheme, Stack, ThemeProvider } from 'expo-router';

import { DbBootstrap } from '@/db/bootstrap';
import { DbProvider } from '@/db/provider';

/** The app is dark-only, regardless of the system light/dark setting. */
export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <DbProvider>
        <DbBootstrap>
          <Stack screenOptions={{ headerShown: false }} />
        </DbBootstrap>
      </DbProvider>
    </ThemeProvider>
  );
}
