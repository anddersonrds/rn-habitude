import {
  HABIT_REMINDER_CATEGORY,
  MARK_DONE_ACTION,
  cancelAllReminders,
  cancelReminders,
  ensureNotificationPermission,
  getNotificationPermission,
  registerNotificationCategories,
  scheduleHabitReminders,
  sendTestNotification,
} from "@/lib/notifications";
import { makeHabit } from "@/test-utils/factories";
import * as Notifications from "expo-notifications";

/*
Mocked at the package boundary, so the schedule shape this module builds is the
one asserted. Anything below it belongs to the operating system.
*/
jest.mock("expo-notifications", () => ({
  SchedulableTriggerInputTypes: { CALENDAR: "calendar", TIME_INTERVAL: "timeInterval" },
  setNotificationHandler: jest.fn(),
  setNotificationCategoryAsync: jest.fn(async () => {}),
  getPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
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
  notifications.scheduleNotificationAsync.mockResolvedValue("request-id");
  notifications.getPermissionsAsync.mockResolvedValue({
    granted: true,
    canAskAgain: true,
  } as never);
});

describe("registerNotificationCategories", () => {
  it("should register the check in action on the reminder category", async () => {
    await registerNotificationCategories();

    expect(notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
      HABIT_REMINDER_CATEGORY,
      [
        {
          identifier: MARK_DONE_ACTION,
          buttonTitle: "Check in",
          options: { opensAppToForeground: false },
        },
      ],
    );
  });
});

describe("getNotificationPermission", () => {
  it("should report the status the system currently holds", async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as never);

    await expect(getNotificationPermission()).resolves.toMatchObject({
      granted: false,
      canAskAgain: false,
    });
  });
});

describe("ensureNotificationPermission", () => {
  it("should report granted without asking again when permission is already held", async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as never);

    await expect(ensureNotificationPermission()).resolves.toBe(true);
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("should ask and report the answer when permission has not been decided", async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    } as never);
    notifications.requestPermissionsAsync.mockResolvedValue({
      granted: true,
    } as never);

    await expect(ensureNotificationPermission()).resolves.toBe(true);
    expect(notifications.requestPermissionsAsync).toHaveBeenCalledWith({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
  });

  it("should report denied when the answer to the request is no", async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    } as never);
    notifications.requestPermissionsAsync.mockResolvedValue({
      granted: false,
    } as never);

    await expect(ensureNotificationPermission()).resolves.toBe(false);
  });

  it("should report denied without asking when the system will not ask again", async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as never);

    await expect(ensureNotificationPermission()).resolves.toBe(false);
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe("scheduleHabitReminders", () => {
  it("should schedule one repeating reminder for a daily habit", async () => {
    const habit = makeHabit({ reminderTime: "07:30" });

    const ids = await scheduleHabitReminders(habit);

    expect(ids).toEqual(["request-id"]);
    expect(scheduledTriggers()).toEqual([
      { type: "calendar", hour: 7, minute: 30, repeats: true },
    ]);
  });

  it("should schedule one reminder per weekday for a habit on a subset of days", async () => {
    notifications.scheduleNotificationAsync
      .mockResolvedValueOnce("mon")
      .mockResolvedValueOnce("wed")
      .mockResolvedValueOnce("fri");
    const habit = makeHabit({ weekdays: MON_WED_FRI, reminderTime: "21:00" });

    const ids = await scheduleHabitReminders(habit);

    expect(ids).toEqual(["mon", "wed", "fri"]);
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

  it("should schedule nothing for a habit with no reminder time", async () => {
    const ids = await scheduleHabitReminders(makeHabit({ reminderTime: null }));

    expect(ids).toEqual([]);
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("should cancel the habit's previous reminders before scheduling new ones", async () => {
    const habit = makeHabit({
      reminderTime: "07:30",
      notificationIds: ["stale-1", "stale-2"],
    });

    await scheduleHabitReminders(habit);

    expect(
      notifications.cancelScheduledNotificationAsync.mock.calls.flat(),
    ).toEqual(["stale-1", "stale-2"]);
  });

  it("should cancel the previous reminders even when there is nothing to replace them with", async () => {
    const habit = makeHabit({
      reminderTime: null,
      notificationIds: ["stale-1"],
    });

    await scheduleHabitReminders(habit);

    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      "stale-1",
    );
  });

  it("should carry the habit's name and id so the check in action knows what it is for", async () => {
    const habit = makeHabit({ name: "Walk outside", reminderTime: "07:30" });

    await scheduleHabitReminders(habit);

    const [request] = notifications.scheduleNotificationAsync.mock.calls[0];
    expect(request.content).toMatchObject({
      title: "Walk outside",
      categoryIdentifier: HABIT_REMINDER_CATEGORY,
      data: { habitId: habit.id },
    });
  });
});

describe("cancelReminders", () => {
  it("should cancel every id it is given", async () => {
    await cancelReminders(["a", "b", "c"]);

    expect(
      notifications.cancelScheduledNotificationAsync.mock.calls.flat(),
    ).toEqual(["a", "b", "c"]);
  });

  it("should do nothing for an empty list", async () => {
    await cancelReminders([]);

    expect(notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  it("should resolve even when the system refuses one of the ids", async () => {
    notifications.cancelScheduledNotificationAsync.mockRejectedValueOnce(
      new Error("no such request"),
    );

    await expect(cancelReminders(["gone", "here"])).resolves.toBeUndefined();
  });
});

describe("cancelAllReminders", () => {
  it("should cancel every scheduled request at once", async () => {
    await cancelAllReminders();

    expect(
      notifications.cancelAllScheduledNotificationsAsync,
    ).toHaveBeenCalledTimes(1);
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
