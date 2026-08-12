import {
  HABIT_REMINDER_CHANNEL,
  ensureNotificationChannel,
  ensureNotificationPermission,
  scheduleHabitReminders,
  sendTestNotification,
} from "@/lib/native/notifications";
import { makeHabit } from "@/test-utils/factories";
import * as Notifications from "expo-notifications";

jest.mock("expo-notifications", () => ({
  AndroidImportance: { HIGH: 6 },
  SchedulableTriggerInputTypes: { DAILY: "daily", WEEKLY: "weekly", TIME_INTERVAL: "timeInterval" },
  setNotificationHandler: jest.fn(),
  setNotificationCategoryAsync: jest.fn(async () => {}),
  setNotificationChannelAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => ({ granted: false, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  scheduleNotificationAsync: jest.fn(async () => "request-id"),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
}));

const notifications = jest.mocked(Notifications);

const MON_WED_FRI = [1, 3, 5];

/** The weekly trigger counts from 1 = Sunday, as the calendar one does. */
const SCHEDULED_MON_WED_FRI = [2, 4, 6];

function scheduledTriggers() {
  return notifications.scheduleNotificationAsync.mock.calls.map(
    ([request]) => request.trigger,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  notifications.getPermissionsAsync.mockResolvedValue({
    granted: false,
    canAskAgain: true,
  } as never);
});

describe("ensureNotificationChannel", () => {
  it("should create the reminder channel at high importance", async () => {
    await ensureNotificationChannel();

    expect(notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      HABIT_REMINDER_CHANNEL,
      { name: "Habit reminders", importance: 6 },
    );
  });

  it("should leave the sound unset, because a value there names a bundled file", async () => {
    await ensureNotificationChannel();

    const [, channel] = notifications.setNotificationChannelAsync.mock.calls[0];
    expect(channel).not.toHaveProperty("sound");
  });
});

describe("ensureNotificationPermission", () => {
  it("should create the channel before asking, because Android 13 shows no prompt without one", async () => {
    await ensureNotificationPermission();

    const [channelCall] =
      notifications.setNotificationChannelAsync.mock.invocationCallOrder;
    const [requestCall] =
      notifications.requestPermissionsAsync.mock.invocationCallOrder;
    expect(channelCall).toBeLessThan(requestCall);
  });
});

describe("scheduleHabitReminders", () => {
  it("should use the daily trigger for a habit on every day", async () => {
    await scheduleHabitReminders(makeHabit({ reminderTime: "07:30" }));

    expect(scheduledTriggers()).toEqual([
      {
        type: "daily",
        channelId: HABIT_REMINDER_CHANNEL,
        hour: 7,
        minute: 30,
      },
    ]);
  });

  it("should use one weekly trigger per day for a habit on a subset of days", async () => {
    const habit = makeHabit({ weekdays: MON_WED_FRI, reminderTime: "21:00" });

    await scheduleHabitReminders(habit);

    expect(scheduledTriggers()).toEqual(
      SCHEDULED_MON_WED_FRI.map((weekday) => ({
        type: "weekly",
        channelId: HABIT_REMINDER_CHANNEL,
        weekday,
        hour: 21,
        minute: 0,
      })),
    );
  });

  it("should create the channel before scheduling anything on it", async () => {
    await scheduleHabitReminders(makeHabit({ reminderTime: "07:30" }));

    const [channelCall] =
      notifications.setNotificationChannelAsync.mock.invocationCallOrder;
    const [scheduleCall] =
      notifications.scheduleNotificationAsync.mock.invocationCallOrder;
    expect(channelCall).toBeLessThan(scheduleCall);
  });
});

describe("sendTestNotification", () => {
  it("should schedule a one-off notification on the reminder channel", async () => {
    await sendTestNotification();

    expect(scheduledTriggers()).toEqual([
      {
        type: "timeInterval",
        channelId: HABIT_REMINDER_CHANNEL,
        seconds: 3,
        repeats: false,
      },
    ]);
  });
});
