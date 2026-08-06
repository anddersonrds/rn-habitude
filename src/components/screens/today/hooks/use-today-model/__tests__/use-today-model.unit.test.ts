/* eslint-disable @typescript-eslint/no-require-imports --
the store loads its state at import, so every case reloads it against its own
database, and the hook, the router and the haptics have to come from that same
registry to be the ones the hook actually calls.
*/
import en from "@/i18n/locales/en";
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

const today = en.translations.today;
const common = en.translations.common;

/**
 * Fills a catalog template here rather than calling the same `t` the hook
 * calls, so a case still fails when the hook interpolates the wrong number.
 */
function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replace(`{{${name}}}`, `${value}`),
    template,
  );
}

/* A Wednesday, so a habit scheduled only on Mondays is not due on it. */
const TODAY = "2026-07-29";
const YESTERDAY = "2026-07-28";
const MONDAY = [1];
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

type StoreModule = typeof import("@/lib/store");
type ModelModule = typeof import("@/components/screens/today/hooks/use-today-model");
type HapticsModule = typeof import("@/lib/haptics");
type TestingLibrary = typeof import("@testing-library/react-native/pure");
type AlertButtons = { text: string; style?: string; onPress?: () => void }[];

type Loaded = {
  store: StoreModule;
  useTodayModel: ModelModule["useTodayModel"];
  haptic: { [K in keyof HapticsModule["haptic"]]: jest.Mock };
  push: jest.Mock;
  alert: jest.Mock;
  testingLibrary: TestingLibrary;
};

/** Loads the hook and every boundary it talks to into one fresh registry. */
function load(language = "en"): Loaded {
  jest.resetModules();
  const { Alert } = require("react-native") as typeof import("react-native");
  /* The hook translates, so the instance has to be the one in this registry,
  and its language pinned rather than inherited from how the device resolves. */
  const i18n = require("@/i18n/i18next") as typeof import("@/i18n/i18next");
  void i18n.default.changeLanguage(language);
  return {
    store: require("@/lib/store"),
    useTodayModel: require("@/components/screens/today/hooks/use-today-model")
      .useTodayModel,
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
async function renderModel(
  seed: (store: StoreModule) => void = () => {},
  language?: string,
) {
  resetDatabase();
  const loaded = load(language);
  seed(loaded.store);
  await settle();

  const { act, renderHook } = loaded.testingLibrary;
  const { result, unmount } = await renderHook(() => loaded.useTodayModel());
  return { ...loaded, act, result, unmount };
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

describe("the day being shown", () => {
  it("should name the weekday, the month and the date", async () => {
    const { result, unmount } = await renderModel();

    expect(result.current.dateLabel).toBe("Wednesday, July 29");
    await unmount();
  });

  it("should name them in the language the app is in, not the device's", async () => {
    const { result, unmount } = await renderModel(() => {}, "fr");

    expect(result.current.dateLabel).toBe("mercredi 29 juillet");
    await unmount();
  });

  it("should give the reminder time on the app's clock too", async () => {
    const { result, unmount } = await renderModel(
      (store) => store.createHabit(input({ reminderTime: "13:30" })),
      "fr",
    );

    expect(result.current.items[0].subtitle).toBe("13:30");
    await unmount();
  });
});

describe("the habits due today", () => {
  it("should list a habit scheduled for today", async () => {
    const { result, unmount } = await renderModel((store) => {
      store.createHabit(input({ name: "Walk outside" }));
    });

    expect(result.current.items.map((item) => item.habit.name)).toEqual([
      "Walk outside",
    ]);
    await unmount();
  });

  it("should leave out a habit that is not scheduled for today", async () => {
    const { result, unmount } = await renderModel((store) => {
      store.createHabit(input({ name: "Walk outside" }));
      store.createHabit(input({ name: "Call mum", weekdays: MONDAY }));
    });

    expect(result.current.items.map((item) => item.habit.name)).toEqual([
      "Walk outside",
    ]);
    await unmount();
  });

  it("should leave out a habit that did not exist yet on the day being shown", async () => {
    const { result, unmount } = await renderModel((store) => {
      store.createHabit(input({ name: "Walk outside" }));
      /* Created today, then the day being shown moves back before it. */
      jest.setSystemTime(new Date(`${YESTERDAY}T12:00:00-03:00`));
    });

    expect(result.current.items).toEqual([]);
    await unmount();
  });

  it("should keep the order the habits are stored in", async () => {
    const { result, unmount } = await renderModel((store) => {
      store.createHabit(input({ name: "Walk outside" }));
      store.createHabit(input({ name: "Read" }));
      store.createHabit(input({ name: "Stretch" }));
    });

    expect(result.current.items.map((item) => item.habit.name)).toEqual([
      "Walk outside",
      "Read",
      "Stretch",
    ]);
    await unmount();
  });

  it("should mark a habit already checked in today as done", async () => {
    const { result, unmount } = await renderModel((store) => {
      const habit = store.createHabit(input());
      store.completeHabit(habit.id, TODAY);
    });

    expect(result.current.items[0].done).toBe(true);
    await unmount();
  });
});

describe("what a habit says under its name", () => {
  it("should say nothing for a habit with no streak and no reminder", async () => {
    const { result, unmount } = await renderModel((store) => {
      store.createHabit(input());
    });

    expect(result.current.items[0].subtitle).toBeNull();
    await unmount();
  });

  it("should count the streak a habit is on", async () => {
    const { result, unmount } = await renderModel((store) => {
      /* The habit has to have existed yesterday to have been done then. */
      jest.setSystemTime(new Date(`${YESTERDAY}T12:00:00-03:00`));
      const habit = store.createHabit(input());
      store.completeHabit(habit.id, YESTERDAY);
      jest.setSystemTime(new Date(`${TODAY}T12:00:00-03:00`));
      store.completeHabit(habit.id, TODAY);
    });

    expect(result.current.items[0]).toMatchObject({
      streak: 2,
      subtitle: fill(today.streak_other, { count: 2 }),
    });
    await unmount();
  });

  it("should give the reminder time on its own when there is no streak", async () => {
    const { result, unmount } = await renderModel((store) => {
      store.createHabit(input({ reminderTime: "07:30" }));
    });

    expect(result.current.items[0].subtitle).toBe("7:30 AM");
    await unmount();
  });

  it("should give the streak and the reminder together", async () => {
    const { result, unmount } = await renderModel((store) => {
      const habit = store.createHabit(input({ reminderTime: "07:30" }));
      store.completeHabit(habit.id, TODAY);
    });

    expect(result.current.items[0].subtitle).toBe(
      `${fill(today.streak_one, { count: 1 })}  ·  7:30 AM`,
    );
    await unmount();
  });
});

describe("the three ways a day can look empty", () => {
  it("should tell a day with no habits at all from the rest", async () => {
    const { result, unmount } = await renderModel();

    expect(result.current).toMatchObject({
      items: [],
      hasHabits: false,
      allDone: false,
      progress: 1,
    });
    await unmount();
  });

  it("should tell a day where nothing is scheduled from a day with no habits", async () => {
    const { result, unmount } = await renderModel((store) => {
      store.createHabit(input({ weekdays: MONDAY }));
    });

    expect(result.current).toMatchObject({
      items: [],
      hasHabits: true,
      allDone: false,
      progress: 1,
    });
    await unmount();
  });

  it("should tell a finished day from an empty one", async () => {
    const { result, unmount } = await renderModel((store) => {
      const habit = store.createHabit(input());
      store.completeHabit(habit.id, TODAY);
    });

    expect(result.current).toMatchObject({
      hasHabits: true,
      allDone: true,
      doneCount: 1,
      progress: 1,
    });
    expect(result.current.items).toHaveLength(1);
    await unmount();
  });

  it("should report progress as the share of the day that is done", async () => {
    const { result, unmount } = await renderModel((store) => {
      const habit = store.createHabit(input({ name: "Walk outside" }));
      store.createHabit(input({ name: "Read" }));
      store.createHabit(input({ name: "Stretch" }));
      store.completeHabit(habit.id, TODAY);
    });

    expect(result.current).toMatchObject({
      doneCount: 1,
      progress: 1 / 3,
      allDone: false,
    });
    await unmount();
  });
});

describe("checking a habit off", () => {
  it("should record the check-in and show the habit done", async () => {
    const { act, result, store, unmount } = await renderModel((store) => {
      store.createHabit(input());
    });
    const [item] = result.current.items;

    await act(async () => result.current.toggle(item.habit));

    expect(result.current.items[0].done).toBe(true);
    expect(store.getAppState().completions[item.habit.id]).toEqual({
      [TODAY]: true,
    });
    await unmount();
  });

  it("should take the check-in back when it is pressed again", async () => {
    const { act, result, store, unmount } = await renderModel((store) => {
      const habit = store.createHabit(input());
      store.completeHabit(habit.id, TODAY);
    });
    const [item] = result.current.items;

    await act(async () => result.current.toggle(item.habit));

    expect(result.current.items[0].done).toBe(false);
    expect(store.getAppState().completions[item.habit.id]?.[TODAY]).toBeUndefined();
    await unmount();
  });

  it("should fire the check-in haptic while the day is still going", async () => {
    const { act, haptic, result, unmount } = await renderModel((store) => {
      store.createHabit(input({ name: "Walk outside" }));
      store.createHabit(input({ name: "Read" }));
    });

    await act(async () => result.current.toggle(result.current.items[0].habit));

    expect(haptic.checkIn).toHaveBeenCalledTimes(1);
    expect(haptic.celebrate).not.toHaveBeenCalled();
    await unmount();
  });

  it("should fire the tap haptic when a check-in is taken back", async () => {
    const { act, haptic, result, unmount } = await renderModel((store) => {
      const habit = store.createHabit(input());
      store.completeHabit(habit.id, TODAY);
    });

    await act(async () => result.current.toggle(result.current.items[0].habit));

    expect(haptic.tap).toHaveBeenCalledTimes(1);
    expect(haptic.checkIn).not.toHaveBeenCalled();
    await unmount();
  });

  it("should leave the last check-in of the day to the celebration", async () => {
    const { act, haptic, result, unmount } = await renderModel((store) => {
      const habit = store.createHabit(input({ name: "Walk outside" }));
      store.createHabit(input({ name: "Read" }));
      store.completeHabit(habit.id, TODAY);
    });

    await act(async () => result.current.toggle(result.current.items[1].habit));

    expect(haptic.checkIn).not.toHaveBeenCalled();
    expect(haptic.celebrate).toHaveBeenCalledTimes(1);
    await unmount();
  });
});

describe("celebrating a finished day", () => {
  it("should not celebrate while a habit is still outstanding", async () => {
    const { act, result, unmount } = await renderModel((store) => {
      store.createHabit(input({ name: "Walk outside" }));
      store.createHabit(input({ name: "Read" }));
    });

    await act(async () => result.current.toggle(result.current.items[0].habit));

    expect(result.current.celebrating).toBe(false);
    await unmount();
  });

  it("should celebrate when the last habit due is checked in", async () => {
    const { act, result, unmount } = await renderModel((store) => {
      const habit = store.createHabit(input({ name: "Walk outside" }));
      store.createHabit(input({ name: "Read" }));
      store.completeHabit(habit.id, TODAY);
    });

    await act(async () => result.current.toggle(result.current.items[1].habit));

    expect(result.current.celebrating).toBe(true);
    await unmount();
  });

  it("should not celebrate a day that was already finished when it opened", async () => {
    const { haptic, result, unmount } = await renderModel((store) => {
      const habit = store.createHabit(input());
      store.completeHabit(habit.id, TODAY);
    });

    expect(result.current).toMatchObject({ allDone: true, celebrating: false });
    expect(haptic.celebrate).not.toHaveBeenCalled();
    await unmount();
  });

  it("should stop celebrating when the moment is over", async () => {
    const { act, result, unmount } = await renderModel((store) => {
      store.createHabit(input());
    });
    await act(async () => result.current.toggle(result.current.items[0].habit));

    await act(async () => result.current.endCelebration());

    expect(result.current.celebrating).toBe(false);
    await unmount();
  });

  it("should celebrate again the next time the day is finished", async () => {
    const { act, haptic, result, unmount } = await renderModel((store) => {
      store.createHabit(input());
    });
    await act(async () => result.current.toggle(result.current.items[0].habit));
    await act(async () => result.current.endCelebration());

    await act(async () => result.current.toggle(result.current.items[0].habit));
    await act(async () => result.current.toggle(result.current.items[0].habit));

    expect(result.current.celebrating).toBe(true);
    expect(haptic.celebrate).toHaveBeenCalledTimes(2);
    await unmount();
  });

  it("should carry the colors of the habits due today", async () => {
    const { result, unmount } = await renderModel((store) => {
      store.createHabit(input({ color: "#FF3B30" }));
      store.createHabit(input({ color: "#34C759" }));
      store.createHabit(input({ color: "#FFCC00", weekdays: MONDAY }));
    });

    expect(result.current.celebrationColors).toEqual(["#FF3B30", "#34C759"]);
    await unmount();
  });
});

describe("going somewhere else", () => {
  it("should open an empty habit form", async () => {
    const { act, push, result, unmount } = await renderModel();

    await act(async () => result.current.addHabit());

    expect(push).toHaveBeenCalledWith("/habit-form");
    await unmount();
  });

  it("should open the habit form on the habit being edited", async () => {
    const { act, push, result, unmount } = await renderModel((store) => {
      store.createHabit(input());
    });
    const [item] = result.current.items;

    await act(async () => result.current.editHabit(item.habit));

    expect(push).toHaveBeenCalledWith(`/habit-form?id=${item.habit.id}`);
    await unmount();
  });

  it("should open the history of the habit that was asked for", async () => {
    const { act, push, result, unmount } = await renderModel((store) => {
      store.createHabit(input());
    });
    const [item] = result.current.items;

    await act(async () => result.current.showHistory(item.habit));

    expect(push).toHaveBeenCalledWith(`/habit/${item.habit.id}`);
    await unmount();
  });
});

describe("deleting a habit", () => {
  it("should ask before deleting anything", async () => {
    const { act, alert, result, unmount } = await renderModel((store) => {
      store.createHabit(input({ name: "Walk outside" }));
    });

    await act(async () => result.current.confirmDelete(result.current.items[0].habit));

    expect(alert).toHaveBeenCalledWith(
      fill(common.deleteHabitTitle, { name: "Walk outside" }),
      common.deleteHabitBody,
      expect.any(Array),
    );
    expect(buttonsOf(alert).map((button) => button.text)).toEqual([
      common.cancel,
      common.delete,
    ]);
    await unmount();
  });

  it("should warn through the haptics before deleting anything", async () => {
    const { act, haptic, result, unmount } = await renderModel((store) => {
      store.createHabit(input());
    });

    await act(async () => result.current.confirmDelete(result.current.items[0].habit));

    expect(haptic.warning).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("should keep the habit when the confirmation is cancelled", async () => {
    const { act, alert, result, store, unmount } = await renderModel((store) => {
      store.createHabit(input({ name: "Walk outside" }));
    });
    await act(async () => result.current.confirmDelete(result.current.items[0].habit));

    const cancel = buttonsOf(alert).find((button) => button.style === "cancel");
    await act(async () => cancel?.onPress?.());

    expect(store.getAppState().habits.map((habit) => habit.name)).toEqual([
      "Walk outside",
    ]);
    expect(result.current.items).toHaveLength(1);
    await unmount();
  });

  it("should delete the habit once the confirmation is taken", async () => {
    const { act, alert, result, store, unmount } = await renderModel((store) => {
      store.createHabit(input({ name: "Walk outside" }));
    });
    await act(async () => result.current.confirmDelete(result.current.items[0].habit));

    const remove = buttonsOf(alert).find(
      (button) => button.style === "destructive",
    );
    await act(async () => remove?.onPress?.());

    expect(store.getAppState().habits).toEqual([]);
    expect(result.current.items).toEqual([]);
    await unmount();
  });
});
