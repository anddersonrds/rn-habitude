import {
  ensureNotificationChannel,
  ensureNotificationPermission,
  scheduleHabitReminders,
  sendTestNotification,
} from "@/lib/native/notifications";
import { makeHabit } from "@/test-utils/factories";
import * as Notifications from "expo-notifications";

jest.mock("expo-notifications", () => ({
  AndroidImportance: { HIGH: 6 },
  SchedulableTriggerInputTypes: { CALENDAR: "calendar", TIME_INTERVAL: "timeInterval" },
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

/** iOS counts weekdays from 1 = Sunday; the app counts from 0 = Sunday. */
const IOS_MON_WED_FRI = [2, 4, 6];

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
  it("should create no channel, because channels are an Android concept", async () => {
    await ensureNotificationChannel();

    expect(notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});

describe("ensureNotificationPermission", () => {
  it("should ask for permission without touching a channel first", async () => {
    await ensureNotificationPermission();

    expect(notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});

describe("scheduleHabitReminders", () => {
  it("should keep the repeating calendar trigger for a habit on every day", async () => {
    await scheduleHabitReminders(makeHabit({ reminderTime: "07:30" }));

    expect(scheduledTriggers()).toEqual([
      { type: "calendar", hour: 7, minute: 30, repeats: true },
    ]);
  });

  it("should keep one calendar trigger per day for a habit on a subset of days", async () => {
    const habit = makeHabit({ weekdays: MON_WED_FRI, reminderTime: "21:00" });

    await scheduleHabitReminders(habit);

    expect(scheduledTriggers()).toEqual(
      IOS_MON_WED_FRI.map((weekday) => ({
        type: "calendar",
        weekday,
        hour: 21,
        minute: 0,
        repeats: true,
      })),
    );
  });
});

describe("sendTestNotification", () => {
  it("should schedule a one-off notification a few seconds out", async () => {
    await sendTestNotification();

    expect(scheduledTriggers()).toEqual([
      { type: "timeInterval", seconds: 3, repeats: false },
    ]);
  });
});
