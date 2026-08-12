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
 * Creates the Android channel, and does nothing anywhere else. Android 8
 * displays nothing without one, and Android 13 presents no permission prompt
 * until one exists, so this runs before the request and before every schedule.
 * The channel name stays English like the action button, because none of the
 * callers holds a `t`.
 */
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(HABIT_REMINDER_CHANNEL, {
    name: "Habit reminders",
    importance: Notifications.AndroidImportance.HIGH,
    /* `sound` is omitted rather than set: Expo reads `"default"` as the name of
    a bundled file, and leaving it out is what gets the system sound. */
  });
}

/** Registers the action buttons shown on reminder notifications. */
export async function registerNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(HABIT_REMINDER_CATEGORY, [
    {
      identifier: MARK_DONE_ACTION,
      buttonTitle: "Check in",
      options: { opensAppToForeground: false },
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
 * Cancels the habit's previous reminders and schedules new ones. Daily habits
 * get one repeating calendar trigger; weekday habits get one per scheduled
 * weekday (iOS weekday: 1 = Sunday).
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
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
    return [id];
  }

  const ids: string[] = [];
  for (const weekday of habit.weekdays) {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        weekday: weekday + 1,
        hour,
        minute,
        repeats: true,
      },
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
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "habitude",
      body: "Reminders are working.",
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
      repeats: false,
    },
  });
}
