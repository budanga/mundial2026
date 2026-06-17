import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';


import { queryClient } from './src/api/queryClient';
import { TabNavigator } from './src/navigation/TabNavigator';
import { registerBackgroundFetchTask } from './src/notifications/backgroundTask';
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
  useEffect(() => {
    // Request permissions and register background task
    requestNotificationPermissions().then((granted) => {
      if (granted) {
        registerBackgroundFetchTask().catch(console.warn);
      }
    });
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
