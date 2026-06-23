import { Tabs } from 'expo-router';

import { TabBarIcon } from '@/components/tab-bar-icon';
import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.backgroundElement },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'To-Do',
          tabBarIcon: ({ focused }) => <TabBarIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="daily"
        options={{
          title: 'Daily',
          tabBarIcon: ({ focused }) => <TabBarIcon emoji="☀️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="easy-wins"
        options={{
          title: 'Easy Wins',
          tabBarIcon: ({ focused }) => <TabBarIcon emoji="🌱" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused }) => <TabBarIcon emoji="📊" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
