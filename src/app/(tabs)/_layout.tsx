import { Tabs } from 'expo-router';

import { UserIcon } from '@/components/icons';
import { TabBarButton, TabBarIcon } from '@/components/tab-bar-icon';
import { Fonts } from '@/constants/theme';
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
        tabBarLabelStyle: { fontFamily: Fonts.sans, fontSize: 11, fontWeight: '600' },
        tabBarButton: TabBarButton,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'To-dos',
          tabBarIcon: ({ focused }) => <TabBarIcon glyph="▤" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="daily"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabBarIcon glyph="☉" size={26} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="self-care"
        options={{
          title: 'Self-Care',
          tabBarIcon: ({ focused }) => <TabBarIcon glyph="✿" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Me',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} render={(color) => <UserIcon size={19} color={color} />} />
          ),
        }}
      />
    </Tabs>
  );
}
