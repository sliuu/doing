import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';

export default function ToolsScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.four, gap: Spacing.four }}>
          <ThemedText type="title" style={{ fontFamily: Fonts.serif }}>
            Tools
          </ThemedText>
          <ThemedText themeColor="textSecondary">More tools are coming soon.</ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
