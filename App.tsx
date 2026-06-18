import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { queryClient } from './src/api/queryClient';
import { TabNavigator } from './src/navigation/TabNavigator';
import {
  registerBackgroundFetchTask,
  activateGracePeriod,
} from './src/notifications/backgroundTask';
import { Colors } from './src/constants/theme';

// Configure how notifications are shown when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export default function App() {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Configure channel for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('matches-channel', {
        name: 'Alertas de Partidos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF8849',
      }).catch(console.warn);
    }

    // Request permissions and register background task
    requestNotificationPermissions().then((granted) => {
      if (granted) {
        registerBackgroundFetchTask().catch(console.warn);
      }
    });

    // Listen for app state transitions.
    // When the app moves from background/inactive → active, we activate the
    // grace period so the next React Query refetch silently syncs state
    // instead of firing all stale notifications that accumulated while closed.
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        const prev = appStateRef.current;
        appStateRef.current = nextState;

        if (
          (prev === 'background' || prev === 'inactive') &&
          nextState === 'active'
        ) {
          activateGracePeriod();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary: Colors.gold,
              background: Colors.background,
              card: Colors.cardBg,
              text: Colors.textPrimary,
              border: Colors.border,
              notification: Colors.live,
            },
          }}
        >
          <TabNavigator />
        </NavigationContainer>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
