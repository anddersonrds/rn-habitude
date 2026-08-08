/* eslint-disable @typescript-eslint/no-require-imports --
the module warns at most once per load, so the cases that assert that have to
reload it rather than close over one instance.
*/
import { WIDGET_DAYS, type HabitudeWidgetProps } from "@/../widgets/HabitudeWidget";
import { makeAppState, makeCompletions, makeHabit } from "@/test-utils/factories";
import { freezeClock, restoreClock } from "@/test-utils/time";

/*
The widget is a project module, and the only thing this one does with it is
push a snapshot. `WIDGET_DAYS` stays real because it decides the shape of what
is pushed.
*/
const mockUpdateSnapshot = jest.fn();

jest.mock("@/../widgets/HabitudeWidget", () => ({
  ...jest.requireActual("@/../widgets/HabitudeWidget"),
  /* Without this the interop hands the importer the module object itself. */
  __esModule: true,
  default: { updateSnapshot: mockUpdateSnapshot },
}));

/* A Wednesday. */
const TODAY = "2026-07-29";
const SUNDAY_ONLY = [0];

type WidgetSyncModule = typeof import("@/lib/native/widget-sync");

/** Reloads the module, which is what resets its warn-once latch. */
function freshWidgetSync(): WidgetSyncModule {
  jest.resetModules();
  return require("@/lib/native/widget-sync");
}

function lastSnapshot(): HabitudeWidgetProps {
  return mockUpdateSnapshot.mock.calls[mockUpdateSnapshot.mock.calls.length - 1][0];
}

beforeEach(() => {
  jest.clearAllMocks();
  freezeClock(`${TODAY}T12:00:00-03:00`);
});

afterEach(() => {
  restoreClock();
  jest.restoreAllMocks();
});

describe("syncWidgetFromState", () => {
  it("should send at most four rows, however many habits there are", () => {
    const habits = [1, 2, 3, 4, 5].map((n) => makeHabit({ name: `Habit ${n}` }));

    freshWidgetSync().syncWidgetFromState(makeAppState({ habits }));

    expect(lastSnapshot().rows.map((row) => row.name)).toEqual([
      "Habit 1",
      "Habit 2",
      "Habit 3",
      "Habit 4",
    ]);
    expect(lastSnapshot().totalHabits).toBe(5);
  });

  it("should describe each row by what the widget draws", () => {
    const habit = makeHabit({
      name: "Walk outside",
      icon: "figure.walk",
      color: "#34C759",
      createdAt: "2026-07-01",
    });
    const state = makeAppState({
      habits: [habit],
      completions: makeCompletions({ [habit.id]: ["2026-07-28", TODAY] }),
    });

    freshWidgetSync().syncWidgetFromState(state);

    expect(lastSnapshot().rows[0]).toMatchObject({
      name: "Walk outside",
      icon: "figure.walk",
      color: "#34C759",
      streak: 2,
    });
    expect(lastSnapshot().rows[0].days).toHaveLength(WIDGET_DAYS);
  });

  it("should count only the habits actually due today", () => {
    const due = makeHabit({ createdAt: "2026-07-01" });
    const notToday = makeHabit({
      createdAt: "2026-07-01",
      weekdays: SUNDAY_ONLY,
    });
    const notYet = makeHabit({ createdAt: "2026-08-01" });
    const state = makeAppState({
      habits: [due, notToday, notYet],
      completions: makeCompletions({ [notToday.id]: [TODAY] }),
    });

    freshWidgetSync().syncWidgetFromState(state);

    expect(lastSnapshot()).toMatchObject({
      totalHabits: 3,
      dueToday: 1,
      doneToday: 0,
      date: TODAY,
    });
  });

  it("should count a habit done today only when it was due today", () => {
    const done = makeHabit({ createdAt: "2026-07-01" });
    const state = makeAppState({
      habits: [done],
      completions: makeCompletions({ [done.id]: [TODAY] }),
    });

    freshWidgetSync().syncWidgetFromState(state);

    expect(lastSnapshot()).toMatchObject({ dueToday: 1, doneToday: 1 });
  });

  it("should send an empty snapshot when there are no habits", () => {
    freshWidgetSync().syncWidgetFromState(makeAppState());

    expect(lastSnapshot()).toMatchObject({
      rows: [],
      totalHabits: 0,
      dueToday: 0,
      doneToday: 0,
    });
  });
});

describe("when the widget extension is not there", () => {
  it("should leave the caller unaffected", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockUpdateSnapshot.mockImplementation(() => {
      throw new Error("no widget extension in this build");
    });

    expect(() =>
      freshWidgetSync().syncWidgetFromState(makeAppState()),
    ).not.toThrow();
    expect(warn).toHaveBeenCalled();
  });

  it("should report the problem once rather than on every mutation", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockUpdateSnapshot.mockImplementation(() => {
      throw new Error("no widget extension in this build");
    });
    const { syncWidgetFromState } = freshWidgetSync();

    syncWidgetFromState(makeAppState());
    syncWidgetFromState(makeAppState());
    syncWidgetFromState(makeAppState());

    expect(warn).toHaveBeenCalledTimes(1);
  });
});
