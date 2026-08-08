/* eslint-disable @typescript-eslint/no-require-imports --
the store loads its state at import, so each case has to reload it rather than
close over one instance.
*/
import i18n from "@/i18n/i18next";
import type { HabitInput } from "@/lib/types";
import { resetDatabase } from "@/test-utils/sqlite";
import { freezeClock, restoreClock, stableIds } from "@/test-utils/time";

/*
The store and the reminder layer are both real here. Only the operating system
is replaced, which is what makes this the test that the ids the system hands
back reach the habit row.

The object is held outside the factory because reloading the store rebuilds the
module registry, and a factory that closed over nothing would hand each reload
a fresh set of spies the assertions could no longer see.
*/
const mockNotifications = {
  SchedulableTriggerInputTypes: { CALENDAR: "calendar", TIME_INTERVAL: "timeInterval" },
  setNotificationHandler: jest.fn(),
  setNotificationCategoryAsync: jest.fn(async () => {}),
  getPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  scheduleNotificationAsync: jest.fn(async () => "request-id"),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
};

jest.mock("expo-notifications", () => mockNotifications);

const sampleNames = i18n.getFixedT("en", "sampleData");

const TODAY = "2026-07-29";

type StoreModule = typeof import("@/lib/store");

/** Loads the store, and the reminder layer under it, against an empty database. */
function freshStore(): StoreModule {
  resetDatabase();
  jest.resetModules();
  return require("@/lib/store");
}

/** Lets the fire-and-forget reminder refresh settle before the case ends. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

/** A scheduling request the test resolves by hand, to hold it in flight. */
function deferSchedule(): { resolve: (id: string) => void } {
  let release = (_id: string) => {};
  mockNotifications.scheduleNotificationAsync.mockReturnValue(
    new Promise<string>((resolve) => {
      release = resolve;
    }),
  );
  return { resolve: (id) => release(id) };
}

function input(overrides: Partial<HabitInput> = {}): HabitInput {
  return {
    name: "Walk outside",
    icon: "figure.walk",
    color: "#32ADE6",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: "07:30",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNotifications.scheduleNotificationAsync.mockResolvedValue("request-id");
  freezeClock(`${TODAY}T12:00:00-03:00`);
  stableIds();
});

afterEach(() => {
  restoreClock();
  jest.restoreAllMocks();
});

describe("refreshReminders", () => {
  it("should persist the ids the system hands back onto the habit", async () => {
    const store = freshStore();
    mockNotifications.scheduleNotificationAsync.mockResolvedValue("request-7");

    store.createHabit(input());
    await settle();

    expect(store.getAppState().habits[0].notificationIds).toEqual(["request-7"]);
  });

  it("should persist one id per scheduled weekday", async () => {
    const store = freshStore();
    mockNotifications.scheduleNotificationAsync
      .mockResolvedValueOnce("mon")
      .mockResolvedValueOnce("wed")
      .mockResolvedValueOnce("fri");

    store.createHabit(input({ weekdays: [1, 3, 5] }));
    await settle();

    expect(store.getAppState().habits[0].notificationIds).toEqual([
      "mon",
      "wed",
      "fri",
    ]);
  });

  it("should leave a habit with no reminder time carrying no ids", async () => {
    const store = freshStore();

    store.createHabit(input({ reminderTime: null }));
    await settle();

    expect(store.getAppState().habits[0].notificationIds).toEqual([]);
    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("should replace the previous ids when the reminder time is edited", async () => {
    const store = freshStore();
    mockNotifications.scheduleNotificationAsync.mockResolvedValue("first");
    const habit = store.createHabit(input());
    await settle();
    mockNotifications.scheduleNotificationAsync.mockResolvedValue("second");

    store.updateHabit(habit.id, input({ reminderTime: "21:00" }));
    await settle();

    expect(store.getAppState().habits[0].notificationIds).toEqual(["second"]);
    expect(
      mockNotifications.cancelScheduledNotificationAsync,
    ).toHaveBeenCalledWith("first");
  });

  it("should cancel the orphaned reminders when the habit is deleted mid-flight", async () => {
    const store = freshStore();
    const scheduling = deferSchedule();
    const habit = store.createHabit(input());

    store.deleteHabit(habit.id);
    scheduling.resolve("orphan");
    await settle();

    expect(
      mockNotifications.cancelScheduledNotificationAsync,
    ).toHaveBeenCalledWith("orphan");
    expect(store.getAppState().habits).toEqual([]);
  });

  it("should not resurrect a habit that was deleted mid-flight", async () => {
    const store = freshStore();
    const scheduling = deferSchedule();
    const habit = store.createHabit(input());

    store.deleteHabit(habit.id);
    scheduling.resolve("orphan");
    await settle();

    expect(store.getAppState()).toMatchObject({ habits: [], completions: {} });
  });

  it("should keep the habit when the system refuses to schedule anything", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const store = freshStore();
    mockNotifications.scheduleNotificationAsync.mockRejectedValue(
      new Error("notifications are off"),
    );

    store.createHabit(input({ name: "Walk outside" }));
    await settle();

    expect(store.getAppState().habits).toMatchObject([
      { name: "Walk outside", notificationIds: [] },
    ]);
    expect(warn).toHaveBeenCalled();
  });
});

describe("deleteHabit", () => {
  it("should cancel the reminders the habit had scheduled", async () => {
    const store = freshStore();
    mockNotifications.scheduleNotificationAsync.mockResolvedValue("request-7");
    const habit = store.createHabit(input());
    await settle();

    store.deleteHabit(habit.id);
    await settle();

    expect(
      mockNotifications.cancelScheduledNotificationAsync,
    ).toHaveBeenCalledWith("request-7");
  });
});

describe("deleteAllData", () => {
  it("should cancel every scheduled request rather than one habit at a time", async () => {
    const store = freshStore();
    store.createHabit(input({ name: "One" }));
    store.createHabit(input({ name: "Two" }));
    await settle();

    await store.deleteAllData();

    expect(
      mockNotifications.cancelAllScheduledNotificationsAsync,
    ).toHaveBeenCalledTimes(1);
  });
});

describe("loadSampleData", () => {
  it("should schedule reminders only for the sample habits that carry one", async () => {
    const store = freshStore();

    store.loadSampleData(sampleNames);
    await settle();

    const withReminders = store
      .getAppState()
      .habits.filter((habit) => habit.reminderTime !== null);
    expect(withReminders.length).toBeGreaterThan(0);
    expect(
      withReminders.every((habit) => habit.notificationIds.length > 0),
    ).toBe(true);
    expect(
      store
        .getAppState()
        .habits.filter((habit) => habit.reminderTime === null)
        .every((habit) => habit.notificationIds.length === 0),
    ).toBe(true);
  });
});
