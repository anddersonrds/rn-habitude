import { HabitsScreen } from "@/features/habits";
import { ROW_PITCH } from "@/features/habits/components/habit-row/styles";
import i18n from "@/i18n/i18next";
import en from "@/i18n/locales/en";
import ptBR from "@/i18n/locales/pt-br";
import {
  completeHabit,
  createHabit,
  deleteAllData,
  getAppState,
} from "@/lib/data/store";
import type { Habit, HabitInput } from "@/lib/domain/types";
import { haptic } from "@/lib/native/haptics";
import { nativeView, symbolView, symbolViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { freezeClock, restoreClock, stableIds } from "@/test-utils/time";
import { act, fireEvent } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { StyleSheet } from "react-native";
import { State } from "react-native-gesture-handler";
import {
  fireGestureHandler,
  getByGestureTestId,
} from "react-native-gesture-handler/jest-utils";
import type { PanGesture } from "react-native-gesture-handler";
import type { TestInstance } from "test-renderer";

/* Reminders are the store's business, and their own tests cover them. */
jest.mock("@/lib/native/notifications", () => ({
  scheduleHabitReminders: jest.fn(async () => [] as string[]),
  cancelReminders: jest.fn(async () => {}),
  cancelAllReminders: jest.fn(async () => {}),
}));

jest.mock("expo-router", () =>
  /* eslint-disable-next-line @typescript-eslint/no-require-imports --
  a mock factory is hoisted above the imports and cannot close over one. */
  require("@/test-utils/expo-router").expoRouterMock(),
);

const routing = jest.requireMock<{
  router: { push: jest.Mock };
  Stack: { Screen: jest.Mock };
}>("expo-router");

const habits = en.translations.habits;
const tabs = en.translations.tabs;
const common = en.translations.common;
const inPortuguese = ptBR.translations.habits;
const schedule = en.translations.schedule;
const MON_WED_FRI = [
  schedule.mondayShort,
  schedule.wednesdayShort,
  schedule.fridayShort,
].join(", ");

/**
 * Fills a catalog template here rather than calling the same `t` the screen
 * calls, so a case still fails when the screen interpolates the wrong value.
 */
function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replace(`{{${name}}}`, `${value}`),
    template,
  );
}

/* A Wednesday. Every fixture below is dated against it. */
const TODAY = "2026-07-29";
const YESTERDAY = "2026-07-28";
const TWO_DAYS_AGO = "2026-07-27";

const HABIT_COLOR = "#FF9500";
const STRIP_DAYS = 21;
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const CELL_RADIUS = 1.5;

function input(overrides: Partial<HabitInput> = {}): HabitInput {
  return {
    name: "Walk outside",
    icon: "figure.walk",
    color: HABIT_COLOR,
    weekdays: EVERY_DAY,
    reminderTime: null,
    ...overrides,
  };
}

/** Seeds a habit that already existed on the days it was completed. */
function seedHabit(
  overrides: Partial<HabitInput> = {},
  { createdAt = TODAY, completions = [] as string[] } = {},
): Habit {
  jest.setSystemTime(new Date(`${createdAt}T12:00:00-03:00`));
  const habit = createHabit(input(overrides));
  jest.setSystemTime(new Date(`${TODAY}T12:00:00-03:00`));
  for (const date of completions) completeHabit(habit.id, date);
  return habit;
}

/**
 * The header is the navigator's, not the screen's, so this renders what the
 * screen last handed the stack. Last rather than first: the reorder button
 * changes to Done once the mode is on.
 */
function screenOptions(): { title: string; headerRight: () => ReactElement } {
  const calls = routing.Stack.Screen.mock.calls;
  const last = calls[calls.length - 1];
  if (!last) throw new Error("The screen sets no options on the stack.");
  return (last[0] as { options: { title: string; headerRight: () => ReactElement } })
    .options;
}

function header(): ReactElement {
  return screenOptions().headerRight();
}

/** Every row's accessible name, in the order the screen drew them. */
function rowNames(screen: {
  queryAllByHintText: (hint: string) => TestInstance[];
}): string[] {
  const drawn = [
    ...screen.queryAllByHintText(habits.idleHint),
    ...screen.queryAllByHintText(habits.reorderingHint),
  ];
  return drawn.map((row) => row.props.accessibilityLabel as string);
}

/** The cells of every heat strip on screen. */
function stripCells(container: TestInstance): TestInstance[] {
  return container.queryAll(
    (node) => StyleSheet.flatten(node.props.style)?.borderRadius === CELL_RADIUS,
  );
}

async function renderList() {
  return renderWithProviders(<HabitsScreen />);
}

/** Lets the fire-and-forget reminder refresh settle before the case goes on. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

/**
 * Drags a row's handle by whole rows, and releases it. Wrapped in `act` because
 * the drop writes to the store, which no gesture event does on its own.
 */
async function dragRow(habit: Habit, rows: number): Promise<void> {
  const travel = rows * ROW_PITCH;
  await act(async () => {
    fireGestureHandler<PanGesture>(getByGestureTestId(`reorder-${habit.id}`), [
      { state: State.BEGAN, translationY: 0 },
      { state: State.ACTIVE, translationY: travel / 2 },
      { state: State.ACTIVE, translationY: travel },
      { state: State.END, translationY: travel },
    ]);
  });
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
  freezeClock(`${TODAY}T12:00:00-03:00`);
  stableIds();
  await deleteAllData();
  jest.clearAllMocks();
});

afterEach(() => {
  restoreClock();
  jest.restoreAllMocks();
});

describe("a list with no habits", () => {
  it("should draw the empty state instead of a list", async () => {
    const screen = await renderList();

    expect(screen.getByText(habits.emptyDescription)).toBeTruthy();
    expect(rowNames(screen)).toEqual([]);
  });

  it("should say there is nothing here yet, and offer a way out", async () => {
    const { getByText } = await renderList();

    expect(getByText(common.noHabitsYet)).toBeTruthy();
    await fireEvent.press(getByText(common.newHabit));

    expect(routing.router.push).toHaveBeenCalledWith("/habit-form");
  });

  it("should offer no reordering", async () => {
    await renderList();

    const { queryByLabelText } = await renderWithProviders(header());

    expect(queryByLabelText(habits.reorder)).toBeNull();
  });
});

describe("a list with habits", () => {
  it("should draw a row per habit, in the order they were made", async () => {
    seedHabit({ name: "Walk outside" }, { createdAt: TWO_DAYS_AGO });
    seedHabit({ name: "Read", color: "#FF3B30" });

    const screen = await renderList();

    expect(rowNames(screen)).toEqual([
      fill(habits.rowLabel, { name: "Walk outside", schedule: schedule.everyDay }),
      fill(habits.rowLabel, { name: "Read", schedule: schedule.everyDay }),
    ]);
  });

  it("should draw each row in its own habit's colour", async () => {
    seedHabit({ name: "Walk outside" }, { createdAt: TWO_DAYS_AGO });
    seedHabit({ name: "Read", icon: "book.fill", color: "#FF3B30" });

    const { container } = await renderList();

    expect(symbolView(container, "figure.walk").props.tintColor).toBe(HABIT_COLOR);
    expect(symbolView(container, "book.fill").props.tintColor).toBe("#FF3B30");
  });

  it("should count the habits above them", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });

    const { getByText } = await renderList();

    expect(getByText(fill(habits.count_other, { count: 2 }))).toBeTruthy();
  });

  it("should report the longest streak and every check-in ever made", async () => {
    seedHabit(
      { name: "Walk outside" },
      { createdAt: TWO_DAYS_AGO, completions: [TWO_DAYS_AGO, YESTERDAY, TODAY] },
    );
    seedHabit({ name: "Read" }, { completions: [TODAY] });

    const { getByText } = await renderList();

    expect(getByText("3")).toBeTruthy();
    expect(getByText(habits.longestStreak)).toBeTruthy();
    expect(getByText("4")).toBeTruthy();
    expect(getByText(habits.checkIns)).toBeTruthy();
  });

  it("should count one habit in the singular, in the app's language", async () => {
    seedHabit({ name: "Walk outside" });
    await i18n.changeLanguage("pt-BR");

    const { getByText } = await renderList();

    /* Asserted in Portuguese because English spells both forms the same way,
    so an English case cannot tell `count_one` from `count_other`. */
    expect(getByText(fill(inPortuguese.count_one, { count: 1 }))).toBeTruthy();
    expect(getByText(inPortuguese.longestStreak)).toBeTruthy();
  });

  it("should say what it is for while nothing is being reordered", async () => {
    seedHabit({ name: "Walk outside" });

    const { getByText } = await renderList();

    expect(getByText(habits.idleFooter)).toBeTruthy();
  });
});

describe("what a row shows", () => {
  it("should name itself, its schedule and its streak to a screen reader", async () => {
    seedHabit(
      { name: "Walk outside", weekdays: [1, 3, 5] },
      { createdAt: TWO_DAYS_AGO, completions: [TODAY] },
    );

    const screen = await renderList();

    expect(rowNames(screen)).toEqual([
      fill(habits.rowLabelWithStreak_one, {
        name: "Walk outside",
        schedule: MON_WED_FRI,
        count: 1,
      }),
    ]);
  });

  it("should say what a tap and a long press do", async () => {
    seedHabit({ name: "Walk outside" });

    const { getAllByHintText } = await renderList();

    expect(getAllByHintText(habits.idleHint)).toHaveLength(1);
  });

  it("should draw the habit's icon on the habit's own tint", async () => {
    seedHabit({ name: "Walk outside", icon: "book.fill" });

    const { container } = await renderList();

    const icon = symbolView(container, "book.fill");
    expect(icon.props.tintColor).toBe(HABIT_COLOR);
    expect(StyleSheet.flatten(icon.parent!.props.style).backgroundColor).toBe(
      `${HABIT_COLOR}26`,
    );
  });

  it("should say only the schedule while the habit is on no streak", async () => {
    seedHabit({ name: "Walk outside" });

    const { container, getByText } = await renderList();

    expect(getByText(schedule.everyDay)).toBeTruthy();
    expect(symbolViews(container).map((symbol) => symbol.props.name)).not.toContain(
      "flame.fill",
    );
  });

  it("should flag a streak with the days it is on and a flame", async () => {
    seedHabit(
      { name: "Walk outside" },
      { createdAt: TWO_DAYS_AGO, completions: [YESTERDAY, TODAY] },
    );

    const { container, getByText } = await renderList();

    expect(
      getByText(
        fill(habits.streakAndSchedule_other, {
          count: 2,
          schedule: schedule.everyDay,
        }),
      ),
    ).toBeTruthy();
    expect(symbolView(container, "flame.fill").props.tintColor).toBe(HABIT_COLOR);
  });

  it("should carry three weeks of heat", async () => {
    seedHabit({ name: "Walk outside" });

    const { container } = await renderList();

    expect(stripCells(container)).toHaveLength(STRIP_DAYS);
  });
});

describe("what a row does", () => {
  it("should open the habit's history when the row is tapped", async () => {
    const habit = seedHabit({ name: "Walk outside" });
    const { getByLabelText } = await renderList();

    await fireEvent.press(
      getByLabelText(
        fill(habits.rowLabel, { name: "Walk outside", schedule: schedule.everyDay }),
      ),
    );

    expect(routing.router.push).toHaveBeenCalledWith(`/habit/${habit.id}`);
  });

  it("should keep its actions away until it is long pressed", async () => {
    seedHabit({ name: "Walk outside" });

    const { getAllByHintText, queryByLabelText } = await renderList();

    expect(queryByLabelText(habits.open)).toBeNull();

    await fireEvent(getAllByHintText(habits.idleHint)[0], "longPress");

    expect(queryByLabelText(habits.open)).toBeTruthy();
    expect(queryByLabelText(common.edit)).toBeTruthy();
    expect(queryByLabelText(common.delete)).toBeTruthy();
  });

  it("should put its actions away when it is long pressed again", async () => {
    seedHabit({ name: "Walk outside" });
    const { getAllByHintText, queryByLabelText } = await renderList();
    const row = getAllByHintText(habits.idleHint)[0];
    await fireEvent(row, "longPress");

    await fireEvent(row, "longPress");

    expect(queryByLabelText(habits.open)).toBeNull();
  });

  it("should open the habit's history from its actions", async () => {
    const habit = seedHabit({ name: "Walk outside" });
    const { getAllByHintText, getByLabelText } = await renderList();
    await fireEvent(getAllByHintText(habits.idleHint)[0], "longPress");

    await fireEvent.press(getByLabelText(habits.open));

    expect(routing.router.push).toHaveBeenCalledWith(`/habit/${habit.id}`);
  });

  it("should open the habit form from its actions", async () => {
    const habit = seedHabit({ name: "Walk outside" });
    const { getAllByHintText, getByLabelText } = await renderList();
    await fireEvent(getAllByHintText(habits.idleHint)[0], "longPress");

    await fireEvent.press(getByLabelText(common.edit));

    expect(routing.router.push).toHaveBeenCalledWith(`/habit-form?id=${habit.id}`);
  });

  it("should ask before deleting from its actions", async () => {
    seedHabit({ name: "Walk outside" });
    const { container, getAllByHintText, getByLabelText } = await renderList();
    await fireEvent(getAllByHintText(habits.idleHint)[0], "longPress");

    await fireEvent.press(getByLabelText(common.delete));

    expect(
      nativeView(
        container,
        "text",
        fill(common.deleteHabitTitle, { name: "Walk outside" }),
      ),
    ).toBeTruthy();
    expect(nativeView(container, "text", common.deleteHabitBody)).toBeTruthy();
    expect(getAppState().habits).toHaveLength(1);
  });
});

describe("putting the habits in a different order", () => {
  it("should offer no reordering for a single habit", async () => {
    seedHabit({ name: "Walk outside" });
    await renderList();

    const { queryByLabelText } = await renderWithProviders(header());

    expect(queryByLabelText(habits.reorder)).toBeNull();
  });

  it("should offer to finish once the list is being reordered", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });
    await renderList();

    const { getByLabelText } = await renderWithProviders(header());
    await fireEvent.press(getByLabelText(habits.reorder));

    const { getByLabelText: getSecondHeader, queryByLabelText } =
      await renderWithProviders(header());
    expect(getSecondHeader(habits.reorderDone)).toBeTruthy();
    expect(queryByLabelText(habits.reorder)).toBeNull();
  });

  it("should hand each row a handle in place of its heat, and stop answering taps", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });
    const { container, getAllByLabelText, getAllByHintText } = await renderList();
    const { getByLabelText } = await renderWithProviders(header());

    await fireEvent.press(getByLabelText(habits.reorder));

    expect(getAllByLabelText(habits.reorder)).toHaveLength(2);
    expect(stripCells(container)).toHaveLength(0);
    await fireEvent.press(getAllByHintText(habits.reorderingHint)[0]);
    expect(routing.router.push).not.toHaveBeenCalled();
  });

  it("should say what the drag is for while the list is being reordered", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });
    const { getByText } = await renderList();
    const { getByLabelText } = await renderWithProviders(header());

    await fireEvent.press(getByLabelText(habits.reorder));

    expect(getByText(habits.reorderingFooter)).toBeTruthy();
  });

  it("should write the order a row is dragged into", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });
    const stretch = seedHabit({ name: "Stretch" });
    await renderList();
    const { getByLabelText } = await renderWithProviders(header());
    await fireEvent.press(getByLabelText(habits.reorder));

    await dragRow(stretch, -2);
    await settle();

    expect(getAppState().habits.map((habit) => habit.name)).toEqual([
      "Stretch",
      "Walk outside",
      "Read",
    ]);
  });

  it("should write the order a row dragged downwards asks for", async () => {
    const walk = seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });
    seedHabit({ name: "Stretch" });
    await renderList();
    const { getByLabelText } = await renderWithProviders(header());
    await fireEvent.press(getByLabelText(habits.reorder));

    await dragRow(walk, 2);
    await settle();

    expect(getAppState().habits.map((habit) => habit.name)).toEqual([
      "Read",
      "Stretch",
      "Walk outside",
    ]);
  });

  it("should write nothing at all when a row is released where it started", async () => {
    const walk = seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });
    await renderList();
    const { getByLabelText } = await renderWithProviders(header());
    await fireEvent.press(getByLabelText(habits.reorder));
    const landed = jest.spyOn(haptic, "rigid");

    await dragRow(walk, 0);
    await settle();

    expect(landed).not.toHaveBeenCalled();
    expect(getAppState().habits.map((habit) => habit.name)).toEqual([
      "Walk outside",
      "Read",
    ]);
  });

  it("should draw the rows in the order it wrote", async () => {
    seedHabit({ name: "Walk outside" });
    const read = seedHabit({ name: "Read" });
    const screen = await renderList();
    const { getByLabelText } = await renderWithProviders(header());
    await fireEvent.press(getByLabelText(habits.reorder));

    await dragRow(read, -1);
    await settle();

    expect(rowNames(screen)).toEqual([
      fill(habits.rowLabel, { name: "Read", schedule: schedule.everyDay }),
      fill(habits.rowLabel, { name: "Walk outside", schedule: schedule.everyDay }),
    ]);
  });
});

describe("the screen's own title", () => {
  it("should leave the bar without a title of its own", async () => {
    seedHabit();

    await renderList();

    expect(screenOptions().title).toBe("");
  });

  it("should draw the title in the content", async () => {
    seedHabit();

    const { getByText } = await renderList();

    expect(getByText(tabs.habits)).toBeOnTheScreen();
  });

  it("should draw the title with no habits to list", async () => {
    const { getByText } = await renderList();

    expect(getByText(tabs.habits)).toBeOnTheScreen();
  });
});
