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

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: jest.fn(() => ({}) as Record<string, string>),
}));

const schedule = en.translations.schedule;

/* A Wednesday, so a habit scheduled only on Mondays is not due on it. */
const TODAY = "2026-07-29";
const YESTERDAY = "2026-07-28";
const TWO_DAYS_AGO = "2026-07-27";
const MONDAY = [1];
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

type StoreModule = typeof import("@/lib/store");
type ModelModule = typeof import("@/features/habit-detail/hooks/use-habit-detail-model");
type HapticsModule = typeof import("@/lib/haptics");
type TestingLibrary = typeof import("@testing-library/react-native/pure");

type Loaded = {
  store: StoreModule;
  useHabitDetailModel: ModelModule["useHabitDetailModel"];
  haptic: { [K in keyof HapticsModule["haptic"]]: jest.Mock };
  router: { push: jest.Mock; back: jest.Mock; canGoBack: jest.Mock };
  params: jest.Mock;
  testingLibrary: TestingLibrary;
};

/** Loads the hook and every boundary it talks to into one fresh registry. */
function load(language = "en"): Loaded {
  jest.resetModules();
  /* The hook translates the schedule, so the instance has to be the one in this
  registry, and its language pinned rather than resolved from the device. */
  const i18n = require("@/i18n/i18next") as typeof import("@/i18n/i18next");
  void i18n.default.changeLanguage(language);
  const routing = require("expo-router");
  return {
    store: require("@/lib/store"),
    useHabitDetailModel: require("@/features/habit-detail/hooks/use-habit-detail-model")
      .useHabitDetailModel,
    haptic: require("@/lib/haptics").haptic,
    router: routing.router,
    params: routing.useLocalSearchParams,
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

/**
 * Renders the hook over a database seeded before its first render, pointing it
 * at whatever the seed returns unless the case names another id.
 */
async function renderModel(
  seed: (store: StoreModule) => { id: string } | void = () => {},
  {
    id,
    language,
    canGoBack = true,
  }: { id?: string; language?: string; canGoBack?: boolean } = {},
) {
  resetDatabase();
  const loaded = load(language);
  loaded.router.canGoBack.mockReturnValue(canGoBack);
  const seeded = seed(loaded.store);
  await settle();
  loaded.params.mockReturnValue({ id: id ?? seeded?.id ?? "gone" });

  const { act, renderHook } = loaded.testingLibrary;
  const { result, unmount } = await renderHook(() =>
    loaded.useHabitDetailModel(),
  );
  return { ...loaded, act, result, unmount };
}

/** Seeds a habit that already existed on the days it was completed. */
function seedHabit(
  store: StoreModule,
  overrides: Partial<HabitInput> = {},
  { createdAt = TODAY, completions = [] as string[] } = {},
) {
  jest.setSystemTime(new Date(`${createdAt}T12:00:00-03:00`));
  const habit = store.createHabit(input(overrides));
  jest.setSystemTime(new Date(`${TODAY}T12:00:00-03:00`));
  for (const date of completions) store.completeHabit(habit.id, date);
  return habit;
}

beforeEach(() => {
  freezeClock(`${TODAY}T12:00:00-03:00`);
  stableIds();
});

afterEach(() => {
  restoreClock();
  jest.restoreAllMocks();
});

describe("a habit that is not there", () => {
  it("should give nothing back and leave when there is somewhere to go", async () => {
    const { result, router, unmount } = await renderModel();

    expect(result.current).toBeNull();
    expect(router.back).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("should stay put when there is nowhere to go back to", async () => {
    const { result, router, unmount } = await renderModel(() => {}, {
      canGoBack: false,
    });

    expect(result.current).toBeNull();
    expect(router.back).not.toHaveBeenCalled();
    await unmount();
  });

  it("should let go of the habit it was showing once it is deleted", async () => {
    const { act, result, router, store, unmount } = await renderModel((s) =>
      seedHabit(s),
    );
    expect(result.current).not.toBeNull();

    await act(async () => {
      await store.deleteAllData();
    });

    expect(result.current).toBeNull();
    expect(router.back).toHaveBeenCalledTimes(1);
    await unmount();
  });
});

describe("the habit being shown", () => {
  it("should hand over the habit the id points at", async () => {
    const { result, unmount } = await renderModel((store) => {
      seedHabit(store, { name: "Read" });
      return seedHabit(store, { name: "Stretch" });
    });

    expect(result.current?.habit.name).toBe("Stretch");
    await unmount();
  });

  it("should say how the habit is scheduled", async () => {
    const { result, unmount } = await renderModel((store) =>
      seedHabit(store, { weekdays: MONDAY }),
    );

    expect(result.current?.subtitle).toBe(schedule.mondayShort);
    await unmount();
  });

  it("should put the reminder time beside the schedule", async () => {
    const { result, unmount } = await renderModel((store) =>
      seedHabit(store, { reminderTime: "07:30" }),
    );

    expect(result.current?.subtitle).toBe(`${schedule.everyDay}  ·  7:30 AM`);
    await unmount();
  });

  it("should give the reminder time on the app's clock, not the device's", async () => {
    const { result, unmount } = await renderModel(
      (store) => seedHabit(store, { reminderTime: "13:30" }),
      { language: "fr" },
    );

    expect(result.current?.subtitle).toContain("13:30");
    await unmount();
  });

  it("should point the history card at the habit's own history", async () => {
    const { result, unmount } = await renderModel((store) => seedHabit(store));

    expect(result.current?.historyHref).toBe(
      `/habit-history?id=${result.current?.habit.id}`,
    );
    await unmount();
  });
});

describe("the statistics", () => {
  it("should count the streak the completions add up to", async () => {
    const { result, unmount } = await renderModel((store) =>
      seedHabit(
        store,
        {},
        { createdAt: TWO_DAYS_AGO, completions: [TWO_DAYS_AGO, YESTERDAY] },
      ),
    );

    expect(result.current?.streaks.current).toBe(2);
    await unmount();
  });

  it("should remember a better streak than the one it is on", async () => {
    const { result, unmount } = await renderModel((store) =>
      seedHabit(
        store,
        {},
        {
          createdAt: "2026-07-01",
          completions: ["2026-07-01", "2026-07-02", "2026-07-03", YESTERDAY],
        },
      ),
    );

    expect(result.current?.streaks.current).toBe(1);
    expect(result.current?.streaks.best).toBe(3);
    await unmount();
  });

  it("should rate the last thirty days rather than the habit's whole life", async () => {
    const { result, unmount } = await renderModel((store) =>
      seedHabit(
        store,
        {},
        {
          createdAt: "2026-05-01",
          /* Four check-ins from three months back, outside the window. */
          completions: [
            "2026-05-01",
            "2026-05-02",
            "2026-05-03",
            "2026-05-04",
            YESTERDAY,
          ],
        },
      ),
    );

    /* One day in thirty. Over the habit's ninety days it would read 6%. */
    expect(result.current?.rate).toBeCloseTo(1 / 30);
    await unmount();
  });
});

describe("checking in from the detail screen", () => {
  it("should say the habit is due on a day it is scheduled", async () => {
    const { result, unmount } = await renderModel((store) => seedHabit(store));

    expect(result.current?.scheduledToday).toBe(true);
    expect(result.current?.doneToday).toBe(false);
    await unmount();
  });

  it("should say the day is a rest day when the habit is not scheduled", async () => {
    const { result, unmount } = await renderModel((store) =>
      seedHabit(store, { weekdays: MONDAY }),
    );

    expect(result.current?.scheduledToday).toBe(false);
    await unmount();
  });

  it("should record the check-in and feel it", async () => {
    const { act, result, store, haptic, unmount } = await renderModel((s) =>
      seedHabit(s),
    );
    const habitId = result.current?.habit.id ?? "";

    await act(async () => result.current?.toggleToday());

    expect(store.getAppState().completions[habitId]?.[TODAY]).toBe(true);
    expect(result.current?.doneToday).toBe(true);
    expect(haptic.checkIn).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("should take the check-in back on a second toggle", async () => {
    const { act, result, store, haptic, unmount } = await renderModel((s) =>
      seedHabit(s, {}, { completions: [TODAY] }),
    );
    const habitId = result.current?.habit.id ?? "";

    await act(async () => result.current?.toggleToday());

    expect(store.getAppState().completions[habitId]?.[TODAY]).toBeUndefined();
    expect(result.current?.doneToday).toBe(false);
    expect(haptic.tap).toHaveBeenCalledTimes(1);
    await unmount();
  });
});

describe("going somewhere else", () => {
  it("should open the habit form on the habit being shown", async () => {
    const { result, router, unmount } = await renderModel((store) =>
      seedHabit(store),
    );
    const habitId = result.current?.habit.id ?? "";

    result.current?.editHabit();

    expect(router.push).toHaveBeenCalledWith(`/habit-form?id=${habitId}`);
    await unmount();
  });
});
