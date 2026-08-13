import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { isDaily, type Habit } from "../domain/types";

/** Category attached to habit reminders so they carry an action button. */
export const HABIT_REMINDER_CATEGORY = "habitReminder";
/** Action id for checking a habit in straight from the notification. */
export const MARK_DONE_ACTION = "markDone";
/** Android channel the reminders are posted on. `app.json` names the same id. */
export const HABIT_REMINDER_CHANNEL = "habit-reminders";

/**
 * Android 8 displays nothing without a channel, and Android 13 presents no
 * permission prompt until one exists, so this runs before the request and
 * before every schedule.
 */
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(HABIT_REMINDER_CHANNEL, {
    name: "Habit reminders",
    importance: Notifications.AndroidImportance.HIGH,
    /* No `sound`: Expo reads `"default"` there as a bundled filename. */
  });
}

/**
 * Registers the action buttons shown on reminder notifications. Android opens
 * the app to run them, because the completion guard is JavaScript and no
 * background task is registered.
 */
export async function registerNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(HABIT_REMINDER_CATEGORY, [
    {
      identifier: MARK_DONE_ACTION,
      buttonTitle: "Check in",
      options: { opensAppToForeground: Platform.OS === "android" },
    },
  ]);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function getNotificationPermission(): Promise<Notifications.NotificationPermissionsStatus> {
  return Notifications.getPermissionsAsync();
}

/** Requests permission if it can still be asked. Returns whether granted. */
export async function ensureNotificationPermission(): Promise<boolean> {
  await ensureNotificationChannel();
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;
  const result = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return result.granted;
}

/**
 * Android has repeating trigger types of its own, and takes the channel here
 * rather than on the content. Both platforms count weekdays from 1 = Sunday.
 */
function reminderTrigger(
  hour: number,
  minute: number,
  weekday: number | null,
): Notifications.NotificationTriggerInput {
  if (Platform.OS === "android") {
    return weekday === null
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          channelId: HABIT_REMINDER_CHANNEL,
          hour,
          minute,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          channelId: HABIT_REMINDER_CHANNEL,
          weekday,
          hour,
          minute,
        };
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    ...(weekday === null ? {} : { weekday }),
    hour,
    minute,
    repeats: true,
  };
}

/**
 * Cancels the habit's previous reminders and schedules new ones. Daily habits
 * get one repeating trigger; weekday habits get one per scheduled weekday.
 */
export async function scheduleHabitReminders(habit: Habit): Promise<string[]> {
  await cancelReminders(habit.notificationIds);
  if (!habit.reminderTime) return [];
  await ensureNotificationChannel();

  const [hour, minute] = habit.reminderTime.split(":").map(Number);
  const content: Notifications.NotificationContentInput = {
    title: habit.name,
    body: "Ready for a small step?",
    sound: "default",
    categoryIdentifier: HABIT_REMINDER_CATEGORY,
    data: { habitId: habit.id },
  };

  if (isDaily(habit)) {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: reminderTrigger(hour, minute, null),
    });
    return [id];
  }

  const ids: string[] = [];
  for (const weekday of habit.weekdays) {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: reminderTrigger(hour, minute, weekday + 1),
    });
    ids.push(id);
  }
  return ids;
}

export async function cancelReminders(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendTestNotification(): Promise<void> {
  await ensureNotificationChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "habitude",
      body: "Reminders are working.",
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      ...(Platform.OS === "android" && { channelId: HABIT_REMINDER_CHANNEL }),
      seconds: 3,
      repeats: false,
    },
  });
}
