import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MotivationScore } from './motivation';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests permission to send local notifications.
 */
export async function requestNotificationPermissionsAsync(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get notification token for local notifications!');
    return false;
  }
  return true;
}

/**
 * Cancels all scheduled notifications and sets a new daily reminder based on motivation score.
 */
export async function scheduleMotivationReminder(score: MotivationScore | null) {
  if (Platform.OS === 'web') return;

  // First, cancel all existing scheduled notifications so we don't spam the user
  await Notifications.cancelAllScheduledNotificationsAsync();

  const level = score?.level || 'medium';
  
  let title = "Sprout here! 🌱";
  let body = "It's time to log your daily habits!";

  if (level === 'high') {
    title = "🔥 Keep the streak alive!";
    body = "You're on a roll! Don't forget to log your habits today to maintain your momentum.";
  } else if (level === 'medium') {
    title = "🌱 Ready to grow today?";
    body = "Sprout is waiting to hear about your habits! Let's get them logged.";
  } else if (level === 'low') {
    title = "💚 Every small step counts";
    body = "Just one habit today? Sprout is cheering for you no matter what.";
  }

  // Schedule for 24 hours from now
  const trigger: Notifications.NotificationTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: 60 * 60 * 24, // 24 hours
    repeats: false,
  };

  // For testing purposes during development, you can uncomment this to test the notification after 5 seconds
  // const trigger = { seconds: 5, repeats: false };

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger,
    });
    console.log(`[Notifications] Scheduled '${level}' motivation reminder for 24h from now.`);
  } catch (error) {
    console.log('[Notifications] Failed to schedule notification:', error);
  }
}
