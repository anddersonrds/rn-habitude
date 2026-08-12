import {
  ensureNotificationChannel,
  ensureNotificationPermission,
} from "@/lib/native/notifications";
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
