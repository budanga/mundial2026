import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MatchesScreen } from '../screens/MatchesScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { BracketScreen } from '../screens/BracketScreen';
import { Colors, Typography } from '../constants/theme';
import { useScoreboard } from '../hooks/useScoreboard';
import { isLiveStatus, ESPNEvent } from '../api/espn';

const Tab = createBottomTabNavigator();

function LiveDot() {
  return <View style={dotStyles.dot} />;
}

const dotStyles = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.live,
  },
});

function MatchesTabIcon({ focused, hasLive }: { focused: boolean; hasLive: boolean }) {
  return (
    <View style={{ position: 'relative' }}>
      <Text style={{ fontSize: 22 }}>⚽</Text>
      {hasLive && <LiveDot />}
    </View>
  );
}

export function TabNavigator() {
  const { data } = useScoreboard();
  const insets = useSafeAreaInsets();
  const hasLive = (data?.events ?? []).some((e: ESPNEvent) => isLiveStatus(e.status.type.name));

  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const tabBarHeight = 50 + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            paddingBottom: bottomInset,
            height: tabBarHeight,
          },
        ],
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          tabBarLabel: 'Partidos',
          tabBarIcon: ({ focused }) => (
            <MatchesTabIcon focused={focused} hasLive={hasLive} />
          ),
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          tabBarLabel: 'Grupos',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="Bracket"
        component={BracketScreen}
        options={{
          tabBarLabel: 'Llaves',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏆</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBar,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
  },
  tabLabel: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightSemiBold,
    letterSpacing: 0.2,
  },
});
