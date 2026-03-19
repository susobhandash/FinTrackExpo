import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const QUIRKY_MESSAGES = [
  {
    title: "Hey! Money check 💰",
    body: "Don't forget to log that sneaky expense from earlier. Your wallet is judging you! 👀",
  },
  {
    title: "Beep Boop, Budget Bot here 🤖",
    body: "Your financial records are feeling lonely. Add today's transactions, please!",
  },
  {
    title: "Quick check! ⏰",
    body: "How much did you spend today? Don't worry, we won't judge... much 😏",
  },
  {
    title: "The numbers don't lie 📊",
    body: "But they can't speak if you don't log them. Open FinTrack and update!",
  },
  {
    title: "Breaking news! 📰",
    body: "Local person forgets to log expenses, financial chaos ensues. Don't be that person!",
  },
  {
    title: "Your piggy bank called 🐷",
    body: "It says you've been ignoring it. Log your expenses before it gets upset!",
  },
  {
    title: "Money alert! 💸",
    body: "Your expenses are multiplying in the shadows. Shine some light with FinTrack!",
  },
  {
    title: "Plot twist! 🎭",
    body: "You spent money today. Revolutionary. Log it so future-you can cringe appropriately.",
  },
];

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("fintrack-reminders", {
        name: "FinTrack Daily Reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function scheduleDaily(time: string): Promise<void> {
  try {
    await cancelScheduled();
    const [hour, minute] = time.split(":").map(Number);
    const msg = QUIRKY_MESSAGES[Math.floor(Math.random() * QUIRKY_MESSAGES.length)];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body: msg.body,
        data: { type: "daily-reminder" },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      } as any,
    });
  } catch (e) {
    console.warn("Notification scheduling failed:", e);
  }
}

export async function cancelScheduled(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}
