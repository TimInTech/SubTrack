import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface ScheduledNotification {
  id: string;
  subscription_id: string;
  subscription_name: string;
  scheduled_date: string;
  days_until: number;
  message: string;
  type: string;
  amount_cents: number;
}

interface NotificationSettings {
  enabled: boolean;
  time: string;
  days_before: number[];
}

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Register for push notifications
  const registerForPushNotifications = useCallback(async () => {
    if (Platform.OS === 'web') {
      // Web notifications
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setPermissionGranted(permission === 'granted');
        return permission === 'granted';
      }
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setPermissionGranted(false);
        return false;
      }

      setPermissionGranted(true);

      // Get Expo push token for real device
      if (Constants.isDevice) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        setExpoPushToken(token.data);
      }

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Abo-Erinnerungen',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7C3AED',
        });
      }

      return true;
    } catch (error) {
      console.error('Error registering for notifications:', error);
      return false;
    }
  }, []);

  // Fetch upcoming notifications from API
  const fetchScheduledNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/notifications/scheduled`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        return data.notifications;
      }
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Schedule a local notification
  const scheduleNotification = useCallback(
    async (
      title: string,
      body: string,
      triggerDate: Date,
      data?: Record<string, any>
    ): Promise<string | null> => {
      if (Platform.OS === 'web') {
        // Web: Schedule using setTimeout (simplified)
        const delay = triggerDate.getTime() - Date.now();
        if (delay > 0 && 'Notification' in window && Notification.permission === 'granted') {
          setTimeout(() => {
            new Notification(title, { body, icon: '/icon.png' });
          }, delay);
        }
        return null;
      }

      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data,
            sound: true,
          },
          trigger: {
            date: triggerDate,
          },
        });
        return id;
      } catch (error) {
        console.error('Error scheduling notification:', error);
        return null;
      }
    },
    []
  );

  // Schedule all upcoming renewal notifications
  const scheduleRenewalNotifications = useCallback(async () => {
    if (!permissionGranted) return;

    try {
      // Cancel all existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();

      const upcomingNotifications = await fetchScheduledNotifications();

      for (const notification of upcomingNotifications) {
        const triggerDate = new Date();
        triggerDate.setHours(9, 0, 0, 0); // 9:00 AM

        await scheduleNotification(
          `${notification.subscription_name} wird verlängert`,
          notification.message,
          triggerDate,
          { subscription_id: notification.subscription_id }
        );
      }
    } catch (error) {
      console.error('Error scheduling renewal notifications:', error);
    }
  }, [permissionGranted, fetchScheduledNotifications, scheduleNotification]);

  // Send immediate test notification
  const sendTestNotification = useCallback(async () => {
    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Test-Benachrichtigung', {
          body: 'Benachrichtigungen funktionieren!',
        });
      }
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test-Benachrichtigung',
        body: 'Benachrichtigungen funktionieren!',
        sound: true,
      },
      trigger: null, // Send immediately
    });
  }, []);

  // Initialize notification listeners
  useEffect(() => {
    registerForPushNotifications();

    if (Platform.OS !== 'web') {
      // Listener for receiving notifications while app is foregrounded
      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log('Notification received:', notification);
        }
      );

      // Listener for when user taps on notification
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          console.log('Notification response:', response);
          // Handle navigation based on notification data
          const data = response.notification.request.content.data;
          if (data?.subscription_id) {
            // Navigate to subscription detail
          }
        }
      );

      return () => {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      };
    }
  }, [registerForPushNotifications]);

  return {
    expoPushToken,
    permissionGranted,
    notifications,
    loading,
    registerForPushNotifications,
    fetchScheduledNotifications,
    scheduleNotification,
    scheduleRenewalNotifications,
    sendTestNotification,
  };
};
