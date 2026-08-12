import { TodayScreen } from "@/features/today";
import i18n from "@/i18n/i18next";
import en from "@/i18n/locales/en";
import {
  completeHabit,
  createHabit,
  deleteAllData,
  getAppState,
} from "@/lib/data/store";
import type { Habit, HabitInput } from "@/lib/domain/types";
import {
  clickCompose,
  longPressCompose,
  pressComposeButton,
} from "@/test-utils/native-events";
import {
  composeButton,
  nativeView,
  nativeViews,
} from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { freezeClock, restoreClock, stableIds } from "@/test-utils/time";
import { accent, success } from "@/theme";
import { fireEvent } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { ReactElement } from "react";
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

const today = en.translations.today;
const common = en.translations.common;

/* A Wednesday. Every fixture below is dated against it. */
const TODAY = "2026-07-29";
const HABIT_COLOR = "#FF9500";
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const MONDAY = [1];

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

function seedHabit(
  overrides: Partial<HabitInput> = {},
  { done = false } = {},
): Habit {
  const habit = createHabit(input(overrides));
  if (done) completeHabit(habit.id, TODAY);
  return habit;
}

/* A row is a card, which is the only thing in the tree taking a long press. */
function rows(container: TestInstance): TestInstance[] {
  return nativeViews(container).filter((node) =>
    ((node.props.modifiers ?? []) as { $type: string }[]).some(
      (entry) => entry.$type === "combinedClickable",
    ),
  );
}

function rowOf(container: TestInstance, habit: Habit): TestInstance {
  const row = rows(container).find(
    (node) => node.queryAll((child) => child.props.text === habit.name).length > 0,
  );
  if (!row) throw new Error(`No row is drawn for "${habit.name}".`);
  return row;
}

/** Every piece of Compose text the screen drew, in render order. */
function drawnText(container: TestInstance): string[] {
  return nativeViews(container)
    .filter((node) => typeof node.props.text === "string")
    .map((node) => node.props.text as string);
}

/** The progress bar, which is the only view carrying a progress value. */
function progressBar(container: TestInstance): TestInstance {
  const [found] = nativeViews(container).filter(
    (node) => typeof node.props.progress === "number",
  );
  if (!found) throw new Error("The screen draws no progress bar.");
  return found;
}

/**
 * The header action lives in the navigation bar's options rather than in the
 * screen's own tree, so it is rendered from what the screen handed the stack.
 */
function headerAction(): ReactElement {
  const [options] = routing.Stack.Screen.mock.calls.map(
    (call) => (call[0] as { options: { headerRight: () => ReactElement } }).options,
  );
  return options.headerRight();
}

async function renderToday() {
  return renderWithProviders(<TodayScreen />);
}

/** Lets the fire-and-forget reminder refresh settle before the case goes on. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
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

describe("a day with no habits at all", () => {
  it("should draw the empty state instead of a list", async () => {
    const { container, getByText } = await renderToday();

    expect(getByText(today.emptyDescription)).toBeTruthy();
    expect(rows(container)).toHaveLength(0);
    expect(() => progressBar(container)).toThrow("no progress bar");
  });

  it("should offer a way out of the empty state", async () => {
    const { getByText } = await renderToday();

    await fireEvent.press(getByText(common.newHabit));

    expect(routing.router.push).toHaveBeenCalledWith("/habit-form");
  });
});

describe("a day with nothing scheduled", () => {
  it("should tell a rest day apart from an empty app", async () => {
    seedHabit({ weekdays: MONDAY });

    const { container, queryByText } = await renderToday();

    expect(queryByText(common.noHabitsYet)).toBeNull();
    expect(drawnText(container)).toContain(today.nothingScheduled);
  });

  it("should draw no progress on a day with nothing to do", async () => {
    seedHabit({ weekdays: MONDAY });

    const { container } = await renderToday();

    expect(() => progressBar(container)).toThrow("no progress bar");
  });
});

describe("a day with habits", () => {
  it("should list every habit scheduled for today", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read", weekdays: MONDAY });

    const { container } = await renderToday();

    expect(rows(container)).toHaveLength(1);
    expect(nativeView(container, "text", "Walk outside")).toBeTruthy();
  });

  it("should carry the date and the check-in section above the rows", async () => {
    seedHabit();

    const { container } = await renderToday();

    expect(drawnText(container)).toContain(today.checkInSection);
    expect(drawnText(container)).toContain(today.checkInFooter);
  });

  it("should draw the progress of the day", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });

    const { container } = await renderToday();

    expect(progressBar(container).props.progress).toBe(0);
    expect(progressBar(container).props.color).toBe(accent);
  });

  it("should turn the progress green once every habit is checked in", async () => {
    seedHabit({}, { done: true });

    const { container } = await renderToday();

    expect(progressBar(container).props.progress).toBe(1);
    expect(progressBar(container).props.color).toBe(success);
    expect(drawnText(container)).toContain(today.allDone);
  });
});

describe("what the screen answers", () => {
  it("should check a habit in when its row is tapped", async () => {
    const habit = seedHabit();
    const { container } = await renderToday();

    await clickCompose(rowOf(container, habit));
    await settle();

    expect(getAppState().completions[habit.id]?.[TODAY]).toBe(true);
  });

  it("should open the habit form from the revealed action", async () => {
    const habit = seedHabit();
    const { container } = await renderToday();

    await longPressCompose(rowOf(container, habit));
    await pressComposeButton(composeButton(container, common.edit));

    expect(routing.router.push).toHaveBeenCalledWith(
      `/habit-form?id=${habit.id}`,
    );
  });

  it("should open the habit's history from the revealed action", async () => {
    const habit = seedHabit();
    const { container } = await renderToday();

    await longPressCompose(rowOf(container, habit));
    await pressComposeButton(composeButton(container, today.history));

    expect(routing.router.push).toHaveBeenCalledWith(`/habit/${habit.id}`);
  });

  it("should ask before deleting from the revealed action", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const habit = seedHabit({ name: "Walk outside" });
    const { container } = await renderToday();

    await longPressCompose(rowOf(container, habit));
    await pressComposeButton(composeButton(container, common.delete));

    expect(alert).toHaveBeenCalled();
    expect(getAppState().habits).toHaveLength(1);
  });

  it("should add a habit from the navigation bar, which is outside the Compose tree", async () => {
    seedHabit();
    await renderToday();

    const { getByLabelText } = await renderWithProviders(headerAction());
    await fireEvent.press(getByLabelText(common.addHabit));

    expect(routing.router.push).toHaveBeenCalledWith("/habit-form");
  });
});
