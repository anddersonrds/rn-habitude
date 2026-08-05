/* eslint-disable @typescript-eslint/no-require-imports --
the store loads its state at import, so every case reloads it against its own
database, and the hook, the router and the haptics have to come from that same
registry to be the ones the hook actually calls.
*/
import type { HabitInput } from "@/lib/types";
import { resetDatabase } from "@/test-utils/sqlite";
import { freezeClock, restoreClock, stableIds } from "@/test-utils/time";
/*
The main entry point switches React into its act environment at import, which a
test body may not do. The renderer itself is taken from `pure`, reloaded with
the store; see `load`.
*/
import "@testing-library/react-native";

/* Reminders are the store's business, and their own tests cover them. */
jest.mock("@/lib/notifications", () => ({
  scheduleHabitReminders: jest.fn(async () => [] as string[]),
  cancelReminders: jest.fn(async () => {}),
  cancelAllReminders: jest.fn(async () => {}),
}));

jest.mock("@/lib/haptics", () => ({
  haptic: {
    selection: jest.fn(),
    tap: jest.fn(),
    impact: jest.fn(),
    rigid: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    checkIn: jest.fn(async () => {}),
    celebrate: jest.fn(async () => {}),
  },
}));

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

/* A Wednesday. Every fixture below is dated against it. */
const TODAY = "2026-07-29";
const YESTERDAY = "2026-07-28";
const TWO_DAYS_AGO = "2026-07-27";
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const MONDAY = [1];

/* The strip is 21 days, so its last entry is today and its first is 20 back. */
const STRIP_LENGTH = 21;
const TODAY_IN_STRIP = STRIP_LENGTH - 1;

/* What a day in the strip can be, as the heat strip draws it. */
const OFF = 0;
const MISSED = 1;
const DONE = 2;
const PENDING = 3;

type StoreModule = typeof import("@/lib/store");
type ModelModule = typeof import("@/components/screens/habits/useHabitsModel");
type HapticsModule = typeof import("@/lib/haptics");
type TestingLibrary = typeof import("@testing-library/react-native/pure");
type AlertButtons = { text: string; style?: string; onPress?: () => void }[];

type Loaded = {
  store: StoreModule;
  useHabitsModel: ModelModule["useHabitsModel"];
  haptic: { [K in keyof HapticsModule["haptic"]]: jest.Mock };
  push: jest.Mock;
  alert: jest.Mock;
  testingLibrary: TestingLibrary;
};

/** Loads the hook and every boundary it talks to into one fresh registry. */
function load(): Loaded {
  jest.resetModules();
  const { Alert } = require("react-native") as typeof import("react-native");
  return {
    store: require("@/lib/store"),
    useHabitsModel: require("@/components/screens/habits/useHabitsModel")
      .useHabitsModel,
    haptic: require("@/lib/haptics").haptic,
    push: require("expo-router").router.push,
    alert: jest.spyOn(Alert, "alert").mockImplementation(() => {}) as jest.Mock,
    testingLibrary: require("@testing-library/react-native/pure"),
  };
}

/** Lets the fire-and-forget reminder refresh settle before the case goes on. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

function input(overrides: Partial<HabitInput> = {}): HabitInput {
  return {
    name: "Walk outside",
    icon: "figure.walk",
    color: "#32ADE6",
    weekdays: EVERY_DAY,
    reminderTime: null,
    ...overrides,
  };
}

/** Renders the hook over a database seeded before its first render. */
async function renderModel(seed: (store: StoreModule) => void = () => {}) {
  resetDatabase();
  const loaded = load();
  seed(loaded.store);
  await settle();

  const { act, renderHook } = loaded.testingLibrary;
  const { result, unmount } = await renderHook(() => loaded.useHabitsModel());
  return { ...loaded, act, result, unmount };
}

/** Seeds three habits in a known order, so a move is visible as a reorder. */
function seedThree(store: StoreModule) {
  store.createHabit(input({ name: "Walk outside" }));
  store.createHabit(input({ name: "Read" }));
  store.createHabit(input({ name: "Stretch" }));
}

function names(store: StoreModule): string[] {
  return store.getAppState().habits.map((habit) => habit.name);
}

function buttonsOf(alert: jest.Mock): AlertButtons {
  return alert.mock.calls[alert.mock.calls.length - 1][2];
}

beforeEach(() => {
  freezeClock(`${TODAY}T12:00:00-03:00`);
  stableIds();
});

afterEach(() => {
  restoreClock();
  jest.restoreAllMocks();
});

describe("the list as it stands", () => {
  it("should say a list with no habits has none", async () => {
    const { result, unmount } = await renderModel();

    expect(result.current).toMatchObject({
      rows: [],
      hasHabits: false,
      canReorder: false,
      countLabel: "0 habits",
    });
    await unmount();
  });

  it("should count one habit in the singular", async () => {
    const { result, unmount } = await renderModel((store) => {
      store.createHabit(input());
    });

    expect(result.current.countLabel).toBe("1 habit");
    await unmount();
  });

  it("should count more than one habit in the plural", async () => {
    const { result, unmount } = await renderModel(seedThree);

    expect(result.current.countLabel).toBe("3 habits");
    await unmount();
  });

  it("should keep the order the habits are stored in", async () => {
    const { result, unmount } = await renderModel(seedThree);

    expect(result.current.rows.map((row) => row.habit.name)).toEqual([
      "Walk outside",
      "Read",
      "Stretch",
    ]);
    await unmount();
  });

  it("should offer no reordering for a single habit", async () => {
    const { result, unmount } = await renderModel((store) => {
      store.createHabit(input());
    });

    expect(result.current.canReorder).toBe(false);
    await unmount();
  });

  it("should offer reordering once there is more than one habit", async () => {
    const { result, unmount } = await renderModel(seedThree);

    expect(result.current.canReorder).toBe(true);
    await unmount();
  });
});

describe("what a row says about its habit", () => {
  it("should say a daily habit runs every day", async () => {
    const { result, unmount } = await renderModel((store) => {
      store.createHabit(input({ weekdays: EVERY_DAY }));
    });

    expect(result.current.rows[0].schedule).toBe("Every day");
    await unmount();
  });

  it("should name the days a habit runs on", async () => {
    const { result, unmount } = await renderModel((store) => {
      store.createHabit(input({ weekdays: [1, 3, 5] }));
    });

    expect(result.current.rows[0].schedule).toBe("Mon, Wed, Fri");
    await unmount();
  });

  it("should count the streak the habit is on", async () => {
    const { result, unmount } = await renderModel((store) => {
      jest.setSystemTime(new Date(`${YESTERDAY}T12:00:00-03:00`));
      const habit = store.createHabit(input());
      store.completeHabit(habit.id, YESTERDAY);
      jest.setSystemTime(new Date(`${TODAY}T12:00:00-03:00`));
      store.completeHabit(habit.id, TODAY);
    });

    expect(result.current.rows[0].streak).toBe(2);
    await unmount();
  });

  it("should carry three weeks of history, ending today", async () => {
    const { result, unmount } = await renderModel((store) => {
      jest.setSystemTime(new Date(`${TWO_DAYS_AGO}T12:00:00-03:00`));
      const habit = store.createHabit(input());
      jest.setSystemTime(new Date(`${TODAY}T12:00:00-03:00`));
      store.completeHabit(habit.id, TODAY);
    });

    const [{ states }] = result.current.rows;
    expect(states).toHaveLength(STRIP_LENGTH);
    expect(states[TODAY_IN_STRIP]).toBe(DONE);
    expect(states[TODAY_IN_STRIP - 1]).toBe(MISSED);
    expect(states[TODAY_IN_STRIP - 3]).toBe(OFF);
    await unmount();
  });

  it("should show today as still open while it has not been checked in", async () => {
    const { result, unmount } = await renderModel((store) => {
      jest.setSystemTime(new Date(`${TWO_DAYS_AGO}T12:00:00-03:00`));
      store.createHabit(input());
      jest.setSystemTime(new Date(`${TODAY}T12:00:00-03:00`));
    });

    expect(result.current.rows[0].states[TODAY_IN_STRIP]).toBe(PENDING);
    await unmount();
  });

  it("should leave a day the habit does not run on out of the strip", async () => {
    const { result, unmount } = await renderModel((store) => {
      jest.setSystemTime(new Date(`${TWO_DAYS_AGO}T12:00:00-03:00`));
      /* Mondays only, and today is a Wednesday. */
      store.createHabit(input({ weekdays: MONDAY }));
      jest.setSystemTime(new Date(`${TODAY}T12:00:00-03:00`));
    });

    expect(result.current.rows[0].states[TODAY_IN_STRIP]).toBe(OFF);
    await unmount();
  });
});

describe("the totals above the list", () => {
  it("should report nothing on an empty list", async () => {
    const { result, unmount } = await renderModel();

    expect(result.current).toMatchObject({ bestStreak: 0, totalCheckIns: 0 });
    await unmount();
  });

  it("should report the longest streak any habit is on", async () => {
    const { result, unmount } = await renderModel((store) => {
      jest.setSystemTime(new Date(`${TWO_DAYS_AGO}T12:00:00-03:00`));
      /* The longest streak is the second habit's, so the first cannot pass
      for it and the reduce is what is being read. */
      const short = store.createHabit(input({ name: "Walk outside" }));
      const long = store.createHabit(input({ name: "Read" }));
      jest.setSystemTime(new Date(`${TODAY}T12:00:00-03:00`));
      store.completeHabit(short.id, TODAY);
      for (const day of [TWO_DAYS_AGO, YESTERDAY, TODAY]) {
        store.completeHabit(long.id, day);
      }
    });

    expect(result.current.rows.map((row) => row.streak)).toEqual([1, 3]);
    expect(result.current.bestStreak).toBe(3);
    await unmount();
  });

  it("should count every check-in ever made, across every habit", async () => {
    const { result, unmount } = await renderModel((store) => {
      jest.setSystemTime(new Date(`${TWO_DAYS_AGO}T12:00:00-03:00`));
      const walk = store.createHabit(input({ name: "Walk outside" }));
      const read = store.createHabit(input({ name: "Read" }));
      jest.setSystemTime(new Date(`${TODAY}T12:00:00-03:00`));
      store.completeHabit(walk.id, TWO_DAYS_AGO);
      store.completeHabit(walk.id, TODAY);
      store.completeHabit(read.id, YESTERDAY);
    });

    expect(result.current.totalCheckIns).toBe(3);
    await unmount();
  });

  it("should count a check-in on a habit that is not due today", async () => {
    const { result, unmount } = await renderModel((store) => {
      /* Mondays only, so the last check-in it could have is not today's. */
      jest.setSystemTime(new Date(`${TWO_DAYS_AGO}T12:00:00-03:00`));
      const habit = store.createHabit(input({ weekdays: MONDAY }));
      store.completeHabit(habit.id, TWO_DAYS_AGO);
      jest.setSystemTime(new Date(`${TODAY}T12:00:00-03:00`));
    });

    expect(result.current.rows[0].streak).toBe(1);
    expect(result.current.totalCheckIns).toBe(1);
    await unmount();
  });
});

describe("reorder mode", () => {
  it("should start with the list in its normal shape", async () => {
    const { result, unmount } = await renderModel(seedThree);

    expect(result.current.reordering).toBe(false);
    await unmount();
  });

  it("should go into reorder mode and back out again", async () => {
    const { act, result, unmount } = await renderModel(seedThree);

    await act(async () => result.current.toggleReordering());
    expect(result.current.reordering).toBe(true);

    await act(async () => result.current.toggleReordering());
    expect(result.current.reordering).toBe(false);
    await unmount();
  });

  it("should answer the switch with a haptic", async () => {
    const { act, haptic, result, unmount } = await renderModel(seedThree);

    await act(async () => result.current.toggleReordering());

    expect(haptic.tap).toHaveBeenCalledTimes(1);
    await unmount();
  });
});

describe("moving a row", () => {
  it("should write the new order to the store", async () => {
    const { act, result, store, unmount } = await renderModel(seedThree);

    await act(async () => result.current.move([2], 0));
    await settle();

    expect(names(store)).toEqual(["Stretch", "Walk outside", "Read"]);
    await unmount();
  });

  it("should read the destination as the index before the row was taken out", async () => {
    const { act, result, store, unmount } = await renderModel(seedThree);

    /* Dragging the first row past the second: SwiftUI reports 2, not 1. */
    await act(async () => result.current.move([0], 2));
    await settle();

    expect(names(store)).toEqual(["Read", "Walk outside", "Stretch"]);
    await unmount();
  });

  it("should move a row to the end of the list", async () => {
    const { act, result, store, unmount } = await renderModel(seedThree);

    await act(async () => result.current.move([0], 3));
    await settle();

    expect(names(store)).toEqual(["Read", "Stretch", "Walk outside"]);
    await unmount();
  });

  it("should keep the order it wrote when the app loads its state again", async () => {
    const { act, result, unmount } = await renderModel(seedThree);
    await act(async () => result.current.move([2], 0));
    await settle();
    expect(result.current.rows.map((row) => row.habit.name)).toEqual([
      "Stretch",
      "Walk outside",
      "Read",
    ]);
    await unmount();

    /* A second load reads the same database from scratch, as a launch does. */
    expect(names(load().store)).toEqual(["Stretch", "Walk outside", "Read"]);
  });

  it("should answer the drop with a haptic", async () => {
    const { act, haptic, result, unmount } = await renderModel(seedThree);

    await act(async () => result.current.move([2], 0));

    expect(haptic.rigid).toHaveBeenCalledTimes(1);
    await unmount();
  });
});

describe("going somewhere else", () => {
  it("should open an empty habit form", async () => {
    const { act, haptic, push, result, unmount } = await renderModel();

    await act(async () => result.current.addHabit());

    expect(push).toHaveBeenCalledWith("/habit-form");
    expect(haptic.tap).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("should open the history of the habit that was asked for", async () => {
    const { act, push, result, unmount } = await renderModel((store) => {
      store.createHabit(input());
    });
    const [row] = result.current.rows;

    await act(async () => result.current.openHabit(row.habit));

    expect(push).toHaveBeenCalledWith(`/habit/${row.habit.id}`);
    await unmount();
  });

  it("should open the habit form on the habit being edited", async () => {
    const { act, push, result, unmount } = await renderModel((store) => {
      store.createHabit(input());
    });
    const [row] = result.current.rows;

    await act(async () => result.current.editHabit(row.habit));

    expect(push).toHaveBeenCalledWith(`/habit-form?id=${row.habit.id}`);
    await unmount();
  });
});

describe("deleting a habit", () => {
  it("should ask before deleting anything", async () => {
    const { act, alert, haptic, result, unmount } = await renderModel((store) => {
      store.createHabit(input({ name: "Walk outside" }));
    });

    await act(async () => result.current.confirmDelete(result.current.rows[0].habit));

    expect(alert).toHaveBeenCalledWith(
      'Delete "Walk outside"?',
      "This permanently deletes the habit and its history.",
      expect.any(Array),
    );
    expect(haptic.warning).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("should keep the habit when the confirmation is cancelled", async () => {
    const { act, alert, result, store, unmount } = await renderModel((store) => {
      store.createHabit(input({ name: "Walk outside" }));
    });
    await act(async () => result.current.confirmDelete(result.current.rows[0].habit));

    const cancel = buttonsOf(alert).find((button) => button.style === "cancel");
    await act(async () => cancel?.onPress?.());

    expect(names(store)).toEqual(["Walk outside"]);
    expect(result.current.rows).toHaveLength(1);
    await unmount();
  });

  it("should delete the habit once the confirmation is taken", async () => {
    const { act, alert, result, store, unmount } = await renderModel((store) => {
      store.createHabit(input({ name: "Walk outside" }));
      store.createHabit(input({ name: "Read" }));
    });
    await act(async () => result.current.confirmDelete(result.current.rows[0].habit));

    const remove = buttonsOf(alert).find(
      (button) => button.style === "destructive",
    );
    await act(async () => remove?.onPress?.());
    await settle();

    expect(names(store)).toEqual(["Read"]);
    expect(result.current.rows).toHaveLength(1);
    await unmount();
  });
});
