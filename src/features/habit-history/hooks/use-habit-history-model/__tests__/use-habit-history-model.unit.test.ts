/* eslint-disable @typescript-eslint/no-require-imports --
the store loads its state at import, so every case reloads it against its own
database, and the hook and the router have to come from that same registry to be
the ones the hook actually calls.
*/
import type { HabitInput } from "@/lib/domain/types";
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

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: jest.fn(() => ({}) as Record<string, string>),
}));

/* A Wednesday, so a habit scheduled only on Mondays is not due on it. */
const TODAY = "2026-07-29";
const YESTERDAY = "2026-07-28";
const TWO_DAYS_AGO = "2026-07-27";
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

type StoreModule = typeof import("@/lib/data/store");
type ModelModule = typeof import("@/features/habit-history/hooks/use-habit-history-model");
type TestingLibrary = typeof import("@testing-library/react-native/pure");

type Loaded = {
  store: StoreModule;
  useHabitHistoryModel: ModelModule["useHabitHistoryModel"];
  router: { back: jest.Mock; canGoBack: jest.Mock };
  params: jest.Mock;
  testingLibrary: TestingLibrary;
};

/** Loads the hook and every boundary it talks to into one fresh registry. */
function load(): Loaded {
  jest.resetModules();
  const routing = require("expo-router");
  return {
    store: require("@/lib/data/store"),
    useHabitHistoryModel: require("@/features/habit-history/hooks/use-habit-history-model")
      .useHabitHistoryModel,
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
 * at whatever the seed returns.
 */
async function renderModel(
  seed: (store: StoreModule) => { id: string } | void = () => {},
  { canGoBack = true }: { canGoBack?: boolean } = {},
) {
  resetDatabase();
  const loaded = load();
  loaded.router.canGoBack.mockReturnValue(canGoBack);
  const seeded = seed(loaded.store);
  await settle();
  loaded.params.mockReturnValue({ id: seeded?.id ?? "gone" });

  const { act, renderHook } = loaded.testingLibrary;
  const { result, unmount } = await renderHook(() =>
    loaded.useHabitHistoryModel(),
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

  it("should hand over the days that habit was completed on", async () => {
    const { result, unmount } = await renderModel((store) =>
      seedHabit(
        store,
        {},
        { createdAt: TWO_DAYS_AGO, completions: [TWO_DAYS_AGO, YESTERDAY] },
      ),
    );

    expect(Object.keys(result.current?.completed ?? {}).sort()).toEqual([
      TWO_DAYS_AGO,
      YESTERDAY,
    ]);
    await unmount();
  });
});

describe("the statistics", () => {
  it("should count every check-in the habit has, not only this year's run", async () => {
    const { result, unmount } = await renderModel((store) =>
      seedHabit(
        store,
        {},
        {
          createdAt: "2026-05-01",
          completions: ["2026-05-01", "2026-05-02", YESTERDAY],
        },
      ),
    );

    expect(result.current?.totalDone).toBe(3);
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

  it("should rate the year rather than the last thirty days", async () => {
    const { result, unmount } = await renderModel((store) =>
      seedHabit(
        store,
        {},
        {
          createdAt: TWO_DAYS_AGO,
          completions: [TWO_DAYS_AGO, YESTERDAY],
        },
      ),
    );

    /* Two of the three days the habit has existed for, not two in 365. */
    expect(result.current?.yearRate).toBeCloseTo(2 / 3);
    await unmount();
  });

  it("should start a habit with no history at zero rather than blank", async () => {
    const { result, unmount } = await renderModel((store) => seedHabit(store));

    expect(result.current?.totalDone).toBe(0);
    expect(result.current?.streaks.best).toBe(0);
    expect(result.current?.yearRate).toBe(0);
    await unmount();
  });
});
