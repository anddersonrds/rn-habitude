import {
  HABIT_REMINDER_CHANNEL,
  ensureNotificationChannel,
  ensureNotificationPermission,
} from "@/lib/native/notifications";
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
