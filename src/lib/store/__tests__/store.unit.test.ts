/* eslint-disable @typescript-eslint/no-require-imports --
the store loads its state and pushes a widget snapshot at import, so each case
has to reload it rather than close over one instance.
*/
import type { HabitudeWidgetProps } from "@/../widgets/HabitudeWidget";
import i18n from "@/i18n/i18next";
import type { HabitInput } from "@/lib/types";
import { resetDatabase } from "@/test-utils/sqlite";
import { freezeClock, restoreClock, stableIds } from "@/test-utils/time";
/*
The main entry point registers its cleanup hooks and switches React into its
act environment at import, which a test body is not allowed to do. The renderer
itself is taken from `pure`, reloaded alongside the store; see `reloadStore`.
*/
import "@testing-library/react-native";

/*
The store's contract with the reminder layer is "schedule this, cancel that".
What the scheduling itself does to `expo-notifications` belongs to that module's
own tests, and the round trip through it is covered by the integration test.
*/
jest.mock("@/lib/notifications", () => ({
  scheduleHabitReminders: jest.fn(async () => [] as string[]),
  cancelReminders: jest.fn(async () => {}),
  cancelAllReminders: jest.fn(async () => {}),
}));

/* A Wednesday, so a habit scheduled only on Mondays is not due on it. */
const sampleNames = i18n.getFixedT("en", "sampleData");

const TODAY = "2026-07-29";
const MONDAY = 1;

type StoreModule = typeof import("@/lib/store");
type WidgetModule = typeof import("@/../widgets/HabitudeWidget");
type TestingLibrary = typeof import("@testing-library/react-native/pure");

type Loaded = {
  store: StoreModule;
  /** The snapshot pushed to the home screen widget after every mutation. */
  snapshots: jest.Mock;
  /*
  Taken from the same registry as the store. Resetting the registry gives the
  store a second copy of React, and a renderer holding the first one finds a
  null dispatcher the moment a hook runs.
  */
  testingLibrary: TestingLibrary;
};

/** Loads the store into whatever module registry is current. */
function requireStore(): Loaded {
  const store: StoreModule = require("@/lib/store");
  const widget: WidgetModule = require("@/../widgets/HabitudeWidget");
  return {
    store,
    snapshots: widget.default.updateSnapshot as unknown as jest.Mock,
    testingLibrary: require("@testing-library/react-native/pure"),
  };
}

/** Reloads the store against the database as it currently stands. */
function reloadStore(): Loaded {
  jest.resetModules();
  return requireStore();
}

/** Reloads the store against an empty database. */
function freshStore(): Loaded {
  resetDatabase();
  return reloadStore();
}

function lastSnapshot(snapshots: jest.Mock): HabitudeWidgetProps {
  return snapshots.mock.calls[snapshots.mock.calls.length - 1][0];
}

/** Lets the fire-and-forget reminder refresh settle before the case ends. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

function input(overrides: Partial<HabitInput> = {}): HabitInput {
  return {
    name: "Walk outside",
    icon: "figure.walk",
    color: "#32ADE6",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: null,
    ...overrides,
  };
}

beforeEach(() => {
  freezeClock(`${TODAY}T12:00:00-03:00`);
  stableIds();
});

afterEach(() => {
  restoreClock();
  jest.restoreAllMocks();
});

describe("getAppState", () => {
  it("should start empty and not onboarded", async () => {
    const { store } = freshStore();
    expect(store.getAppState()).toEqual({
      habits: [],
      completions: {},
      onboarded: false,
    });
    await settle();
  });

  it("should read the habits already in the database at import", async () => {
    const first = freshStore();
    first.store.createHabit(input({ name: "Walk outside" }));
    await settle();

    const { store } = reloadStore();

    expect(store.getAppState().habits.map((habit) => habit.name)).toEqual([
      "Walk outside",
    ]);
  });
});

describe("createHabit", () => {
  it("should return a habit created today with no reminders yet", async () => {
    const { store } = freshStore();

    const habit = store.createHabit(input({ name: "Walk outside" }));

    expect(habit).toMatchObject({
      name: "Walk outside",
      createdAt: TODAY,
      notificationIds: [],
    });
    expect(habit.id).not.toHaveLength(0);
    await settle();
  });

  it("should append each new habit after the last one rather than sorting by name", async () => {
    const { store } = freshStore();

    store.createHabit(input({ name: "Zebra" }));
    store.createHabit(input({ name: "Apple" }));
    await settle();

    expect(store.getAppState().habits.map((habit) => habit.name)).toEqual([
      "Zebra",
      "Apple",
    ]);
  });

  it("should give each habit its own id", async () => {
    const { store } = freshStore();

    const first = store.createHabit(input());
    const second = store.createHabit(input());
    await settle();

    expect(first.id).not.toBe(second.id);
  });
});

describe("updateHabit", () => {
  it("should replace the editable fields of an existing habit", async () => {
    const { store } = freshStore();
    const habit = store.createHabit(input());
    await settle();

    store.updateHabit(
      habit.id,
      input({ name: "Walk further", weekdays: [MONDAY], reminderTime: "07:30" }),
    );
    await settle();

    expect(store.getAppState().habits[0]).toMatchObject({
      name: "Walk further",
      weekdays: [MONDAY],
      reminderTime: "07:30",
      createdAt: TODAY,
    });
  });

  it("should leave the state untouched for an unknown id", async () => {
    const { store } = freshStore();
    store.createHabit(input({ name: "Walk outside" }));
    await settle();
    const before = store.getAppState();

    store.updateHabit("no-such-habit", input({ name: "Renamed" }));

    expect(store.getAppState()).toBe(before);
  });
});

describe("deleteHabit", () => {
  it("should remove the habit and its completions together", async () => {
    const { store } = freshStore();
    const habit = store.createHabit(input());
    store.toggleCompletion(habit.id, TODAY);
    await settle();

    store.deleteHabit(habit.id);

    expect(store.getAppState()).toMatchObject({ habits: [], completions: {} });
  });

  it("should leave the completions of the other habits alone", async () => {
    const { store } = freshStore();
    const doomed = store.createHabit(input({ name: "Doomed" }));
    const kept = store.createHabit(input({ name: "Kept" }));
    store.toggleCompletion(doomed.id, TODAY);
    store.toggleCompletion(kept.id, TODAY);
    await settle();

    store.deleteHabit(doomed.id);

    expect(store.getAppState().completions).toEqual({ [kept.id]: { [TODAY]: true } });
  });

  it("should leave the state untouched for an unknown id", async () => {
    const { store } = freshStore();
    store.createHabit(input());
    await settle();
    const before = store.getAppState();

    store.deleteHabit("no-such-habit");

    expect(store.getAppState()).toBe(before);
  });
});

describe("toggleCompletion", () => {
  it("should report true and record the completion the first time", async () => {
    const { store } = freshStore();
    const habit = store.createHabit(input());
    await settle();

    expect(store.toggleCompletion(habit.id, TODAY)).toBe(true);
    expect(store.getAppState().completions[habit.id]).toEqual({ [TODAY]: true });
  });

  it("should report false and remove the completion the second time", async () => {
    const { store } = freshStore();
    const habit = store.createHabit(input());
    await settle();
    store.toggleCompletion(habit.id, TODAY);

    expect(store.toggleCompletion(habit.id, TODAY)).toBe(false);
    expect(store.getAppState().completions[habit.id]).toBeUndefined();
  });

  it("should toggle one date without touching the others", async () => {
    const { store } = freshStore();
    const habit = store.createHabit(input());
    await settle();
    store.toggleCompletion(habit.id, "2026-07-28");
    store.toggleCompletion(habit.id, TODAY);

    store.toggleCompletion(habit.id, TODAY);

    expect(store.getAppState().completions[habit.id]).toEqual({
      "2026-07-28": true,
    });
  });
});

describe("completeHabit", () => {
  it("should record a completion on a scheduled day", async () => {
    const { store } = freshStore();
    const habit = store.createHabit(input());
    await settle();

    store.completeHabit(habit.id, TODAY);

    expect(store.getAppState().completions[habit.id]).toEqual({ [TODAY]: true });
  });

  it("should stay completed when it is called twice for the same day", async () => {
    const { store } = freshStore();
    const habit = store.createHabit(input());
    await settle();

    store.completeHabit(habit.id, TODAY);
    store.completeHabit(habit.id, TODAY);

    expect(store.getAppState().completions[habit.id]).toEqual({ [TODAY]: true });
  });

  it("should refuse a date before the habit existed", async () => {
    const { store } = freshStore();
    const habit = store.createHabit(input());
    await settle();

    store.completeHabit(habit.id, "2026-07-28");

    expect(store.getAppState().completions[habit.id]).toBeUndefined();
  });

  it("should refuse a day the habit is not scheduled on", async () => {
    const { store } = freshStore();
    const habit = store.createHabit(input({ weekdays: [MONDAY] }));
    await settle();

    /* A stale reminder can fire after the schedule was narrowed. */
    store.completeHabit(habit.id, TODAY);

    expect(store.getAppState().completions[habit.id]).toBeUndefined();
  });

  it("should do nothing for an unknown habit", async () => {
    const { store } = freshStore();
    await settle();
    const before = store.getAppState();

    store.completeHabit("no-such-habit", TODAY);

    expect(store.getAppState()).toBe(before);
  });
});

describe("reorderHabits", () => {
  it("should apply the given order", async () => {
    const { store } = freshStore();
    const first = store.createHabit(input({ name: "First" }));
    const second = store.createHabit(input({ name: "Second" }));
    const third = store.createHabit(input({ name: "Third" }));
    await settle();

    store.reorderHabits([third.id, first.id, second.id]);

    expect(store.getAppState().habits.map((habit) => habit.name)).toEqual([
      "Third",
      "First",
      "Second",
    ]);
  });

  it("should write an order that survives a reload", async () => {
    const first = freshStore();
    const a = first.store.createHabit(input({ name: "First" }));
    const b = first.store.createHabit(input({ name: "Second" }));
    const c = first.store.createHabit(input({ name: "Third" }));
    await settle();
    first.store.reorderHabits([c.id, b.id, a.id]);

    const { store } = reloadStore();

    expect(store.getAppState().habits.map((habit) => habit.name)).toEqual([
      "Third",
      "Second",
      "First",
    ]);
  });

  it("should leave a contiguous order that a new habit appends to", async () => {
    const { store } = freshStore();
    const a = store.createHabit(input({ name: "First" }));
    const b = store.createHabit(input({ name: "Second" }));
    await settle();
    store.reorderHabits([b.id, a.id]);

    store.createHabit(input({ name: "Third" }));
    await settle();

    expect(store.getAppState().habits.map((habit) => habit.name)).toEqual([
      "Second",
      "First",
      "Third",
    ]);
  });
});

describe("onboarding flag", () => {
  it("should round trip through setOnboarded and resetOnboarding", async () => {
    const { store } = freshStore();
    expect(store.getAppState().onboarded).toBe(false);

    store.setOnboarded();
    expect(store.getAppState().onboarded).toBe(true);

    store.resetOnboarding();
    expect(store.getAppState().onboarded).toBe(false);
    await settle();
  });

  it("should survive a reload once it is set", async () => {
    const first = freshStore();
    first.store.setOnboarded();
    await settle();

    expect(reloadStore().store.getAppState().onboarded).toBe(true);
  });
});

describe("deleteAllData", () => {
  it("should clear the habits and the completions", async () => {
    const { store } = freshStore();
    const habit = store.createHabit(input());
    store.toggleCompletion(habit.id, TODAY);
    await settle();

    await store.deleteAllData();

    expect(store.getAppState()).toMatchObject({ habits: [], completions: {} });
  });

  it("should leave the onboarded flag alone, so the flow does not reappear", async () => {
    const { store } = freshStore();
    store.setOnboarded();
    store.createHabit(input());
    await settle();

    await store.deleteAllData();

    expect(store.getAppState().onboarded).toBe(true);
  });

  it("should cancel every scheduled reminder", async () => {
    const { store } = freshStore();
    const { cancelAllReminders } = require("@/lib/notifications");
    await settle();

    await store.deleteAllData();

    expect(cancelAllReminders).toHaveBeenCalled();
  });
});

describe("loadSampleData", () => {
  it("should seed habits with history the widget can already show", async () => {
    const { store } = freshStore();

    store.loadSampleData(sampleNames);
    await settle();

    const { habits, completions } = store.getAppState();
    expect(habits.length).toBeGreaterThan(0);
    expect(habits.every((habit) => habit.id.startsWith("sample-"))).toBe(true);
    expect(Object.keys(completions).length).toBeGreaterThan(0);
  });

  it("should replace a previous sample run rather than duplicating it", async () => {
    const { store } = freshStore();
    store.loadSampleData(sampleNames);
    await settle();
    const first = store.getAppState().habits.map((habit) => habit.id);

    store.loadSampleData(sampleNames);
    await settle();

    expect(store.getAppState().habits.map((habit) => habit.id)).toEqual(first);
  });

  it("should cancel the reminders the previous sample run had scheduled", async () => {
    const { store } = freshStore();
    const notifications = require("@/lib/notifications");
    notifications.scheduleHabitReminders.mockResolvedValue(["reminder-1"]);
    store.loadSampleData(sampleNames);
    await settle();
    notifications.cancelReminders.mockClear();

    store.loadSampleData(sampleNames);
    await settle();

    expect(notifications.cancelReminders).toHaveBeenCalledWith(
      expect.arrayContaining(["reminder-1"]),
    );
  });

  it("should leave a habit the user created alone", async () => {
    const { store } = freshStore();
    store.createHabit(input({ name: "Mine" }));
    await settle();

    store.loadSampleData(sampleNames);
    await settle();

    expect(
      store.getAppState().habits.map((habit) => habit.name),
    ).toContain("Mine");
  });
});

describe("returning to the foreground", () => {
  type AppStatus = "active" | "background" | "inactive";

  /** Loads the store with the app status change it subscribes to intercepted. */
  function storeWithAppStatus(): Loaded & { send: (status: AppStatus) => void } {
    resetDatabase();
    jest.resetModules();
    const { AppState } = require("react-native");
    const listen = jest
      .spyOn(AppState, "addEventListener")
      .mockReturnValue({ remove: () => {} } as never);
    const loaded = requireStore();
    const handler = listen.mock.calls[0][1] as (status: AppStatus) => void;
    return { ...loaded, send: handler };
  }

  it("should move the widget on to the new day after midnight", async () => {
    const { store, snapshots, send } = storeWithAppStatus();
    store.createHabit(input());
    await settle();
    expect(lastSnapshot(snapshots).date).toBe(TODAY);

    jest.setSystemTime(new Date("2026-07-30T09:00:00-03:00"));
    send("active");

    expect(lastSnapshot(snapshots).date).toBe("2026-07-30");
  });

  it("should ignore a status other than active", async () => {
    const { snapshots, send } = storeWithAppStatus();
    await settle();
    const pushes = snapshots.mock.calls.length;

    jest.setSystemTime(new Date("2026-07-30T09:00:00-03:00"));
    send("background");

    expect(snapshots.mock.calls).toHaveLength(pushes);
  });
});

describe("notifying the app", () => {
  it("should re-render a subscriber on every mutation", async () => {
    const { store, testingLibrary } = freshStore();
    const { act, renderHook } = testingLibrary;
    const { result, unmount } = await renderHook(() => store.useAppState());
    expect(result.current.habits).toHaveLength(0);

    await act(async () => {
      store.createHabit(input({ name: "Walk outside" }));
    });

    expect(result.current.habits.map((habit) => habit.name)).toEqual([
      "Walk outside",
    ]);
    await unmount();
  });

  it("should re-render only the subscriber whose slice changed", async () => {
    const { store, testingLibrary } = freshStore();
    const { act, renderHook } = testingLibrary;
    const habit = store.createHabit(input());
    await settle();
    const renders = { onboarded: 0, completions: 0 };
    const onboarded = await renderHook(() => {
      renders.onboarded += 1;
      return store.useAppState((state) => state.onboarded);
    });
    const completions = await renderHook(() => {
      renders.completions += 1;
      return store.useAppState((state) => state.completions);
    });
    const before = { ...renders };

    await act(async () => {
      store.toggleCompletion(habit.id, TODAY);
    });

    expect(renders.onboarded).toBe(before.onboarded);
    expect(renders.completions).toBeGreaterThan(before.completions);
    expect(completions.result.current[habit.id]).toEqual({ [TODAY]: true });
    await onboarded.unmount();
    await completions.unmount();
  });

  it("should hand a selector the state the mutation produced", async () => {
    const { store, testingLibrary } = freshStore();
    const { act, renderHook } = testingLibrary;
    const { result, unmount } = await renderHook(() =>
      store.useAppState((state) => state.habits.length),
    );
    expect(result.current).toBe(0);

    await act(async () => {
      store.createHabit(input());
    });

    expect(result.current).toBe(1);
    await unmount();
  });

  it("should stop notifying a subscriber that unmounted", async () => {
    const { store, testingLibrary } = freshStore();
    const { act, renderHook } = testingLibrary;
    const { result, unmount } = await renderHook(() => store.useAppState());
    const seen = result.current;

    await unmount();
    await act(async () => {
      store.createHabit(input());
    });

    expect(result.current).toBe(seen);
  });
});

describe("the references a reload hands back", () => {
  /*
  One edit per field the comparison reads. A field left out of it is a field
  whose change would leave a stale row on screen with nothing to report it.
  */
  const edits: [string, Partial<HabitInput>][] = [
    ["name", { name: "Walk further" }],
    ["icon", { icon: "figure.run" }],
    ["colour", { color: "#FF9500" }],
    ["weekdays", { weekdays: [MONDAY] }],
    ["reminder time", { reminderTime: "21:00" }],
  ];

  it.each(edits)(
    "should give the habit a new object when the %s changed",
    async (_field, edit) => {
      const { store } = freshStore();
      const habit = store.createHabit(input());
      await settle();
      const before = store.getAppState().habits[0];

      store.updateHabit(habit.id, input(edit));
      await settle();

      expect(store.getAppState().habits[0]).not.toBe(before);
    },
  );

  it("should give the habit a new object when the reminder ids changed", async () => {
    const { store } = freshStore();
    const notifications = require("@/lib/notifications");
    const habit = store.createHabit(input({ reminderTime: "07:30" }));
    await settle();
    const before = store.getAppState().habits[0];
    notifications.scheduleHabitReminders.mockResolvedValueOnce(["reminder-1"]);

    store.updateHabit(habit.id, input({ reminderTime: "07:30" }));
    await settle();

    const after = store.getAppState().habits[0];
    expect(after.notificationIds).toEqual(["reminder-1"]);
    expect(after).not.toBe(before);
  });

  it("should keep the habit when an edit rewrote every field with what it held", async () => {
    const { store } = freshStore();
    const habit = store.createHabit(input());
    await settle();
    const before = store.getAppState().habits[0];

    store.updateHabit(habit.id, input());
    await settle();

    expect(store.getAppState().habits[0]).toBe(before);
  });

  it("should leave the habits an edit did not touch at their own object", async () => {
    const { store } = freshStore();
    const edited = store.createHabit(input({ name: "Edited" }));
    store.createHabit(input({ name: "Untouched" }));
    await settle();
    const [beforeEdited, beforeUntouched] = store.getAppState().habits;

    store.updateHabit(edited.id, input({ name: "Renamed" }));
    await settle();

    const [afterEdited, afterUntouched] = store.getAppState().habits;
    expect(afterEdited).not.toBe(beforeEdited);
    expect(afterEdited.name).toBe("Renamed");
    expect(afterUntouched).toBe(beforeUntouched);
  });

  it("should keep the habits array when the mutation touched no habit", async () => {
    const { store } = freshStore();
    const habit = store.createHabit(input());
    await settle();
    const before = store.getAppState().habits;

    store.toggleCompletion(habit.id, TODAY);

    expect(store.getAppState().habits).toBe(before);
  });

  it("should give a new habits array when a habit was created or deleted", async () => {
    const { store } = freshStore();
    store.createHabit(input({ name: "Kept" }));
    await settle();
    const before = store.getAppState().habits;

    const added = store.createHabit(input({ name: "Added" }));
    await settle();
    const grown = store.getAppState().habits;
    store.deleteHabit(added.id);
    await settle();

    expect(grown).not.toBe(before);
    expect(grown[0]).toBe(before[0]);
    expect(store.getAppState().habits).not.toBe(grown);
    expect(store.getAppState().habits.map((habit) => habit.name)).toEqual([
      "Kept",
    ]);
  });

  it("should give a new habits array when the same habits were reordered", async () => {
    const { store } = freshStore();
    const first = store.createHabit(input({ name: "First" }));
    const second = store.createHabit(input({ name: "Second" }));
    await settle();
    const before = store.getAppState().habits;

    store.reorderHabits([second.id, first.id]);

    const after = store.getAppState().habits;
    expect(after).not.toBe(before);
    expect(after.map((habit) => habit.name)).toEqual(["Second", "First"]);
    expect(after[0]).toBe(before[1]);
  });

  it("should give a new completion map for a check-in added and removed", async () => {
    const { store } = freshStore();
    const habit = store.createHabit(input());
    await settle();
    const empty = store.getAppState().completions;

    store.toggleCompletion(habit.id, TODAY);
    const added = store.getAppState().completions;
    store.toggleCompletion(habit.id, TODAY);
    const removed = store.getAppState().completions;

    expect(added).not.toBe(empty);
    expect(added[habit.id]).toEqual({ [TODAY]: true });
    expect(removed).not.toBe(added);
    expect(removed[habit.id]).toBeUndefined();
  });

  it("should keep the completions of a habit the check-in did not touch", async () => {
    const { store } = freshStore();
    const checked = store.createHabit(input({ name: "Checked" }));
    const other = store.createHabit(input({ name: "Other" }));
    store.toggleCompletion(other.id, TODAY);
    await settle();
    const before = store.getAppState().completions[other.id];

    store.toggleCompletion(checked.id, TODAY);

    const after = store.getAppState().completions;
    expect(after[other.id]).toBe(before);
    expect(after[checked.id]).toEqual({ [TODAY]: true });
  });

  it("should not re-render a subscriber selecting the habits on a check-in", async () => {
    const { store, testingLibrary } = freshStore();
    const { act, renderHook } = testingLibrary;
    const habit = store.createHabit(input());
    await settle();
    let renders = 0;
    const { unmount } = await renderHook(() => {
      renders += 1;
      return store.useAppState((state) => state.habits);
    });
    const before = renders;

    await act(async () => {
      store.toggleCompletion(habit.id, TODAY);
    });

    expect(renders).toBe(before);
    await unmount();
  });
});

describe("the widget snapshot", () => {
  it("should be pushed once at import, before any screen renders", async () => {
    const { snapshots } = freshStore();
    expect(snapshots).toHaveBeenCalled();
    await settle();
  });

  it("should describe the state the mutation produced", async () => {
    const { store, snapshots } = freshStore();
    const habit = store.createHabit(input({ name: "Walk outside" }));
    await settle();

    store.toggleCompletion(habit.id, TODAY);

    expect(lastSnapshot(snapshots)).toMatchObject({
      totalHabits: 1,
      dueToday: 1,
      doneToday: 1,
      date: TODAY,
      rows: [expect.objectContaining({ name: "Walk outside", streak: 1 })],
    });
  });

  it("should follow a deletion back down to nothing", async () => {
    const { store, snapshots } = freshStore();
    const habit = store.createHabit(input());
    await settle();

    store.deleteHabit(habit.id);

    expect(lastSnapshot(snapshots)).toMatchObject({
      totalHabits: 0,
      dueToday: 0,
      doneToday: 0,
      rows: [],
    });
  });
});
