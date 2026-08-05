import HabitDetailScreen from "@/app/habit/[id]";
import i18n from "@/i18n/i18next";
import {
  completeHabit,
  createHabit,
  deleteAllData,
  getAppState,
} from "@/lib/store";
import type { HabitInput } from "@/lib/types";
import { symbolView } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { freezeClock, restoreClock, stableIds } from "@/test-utils/time";
import { act, fireEvent } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import type { TestInstance } from "test-renderer";

/* Reminders are the store's business, and their own tests cover them. */
jest.mock("@/lib/notifications", () => ({
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
  router: { push: jest.Mock; back: jest.Mock; canGoBack: jest.Mock };
  useLocalSearchParams: jest.Mock;
  Link: jest.Mock;
}>("expo-router");

/* A Wednesday. Every fixture below is dated against it. */
const TODAY = "2026-07-29";
const YESTERDAY = "2026-07-28";
const TWO_DAYS_AGO = "2026-07-27";

const HABIT_COLOR = "#FF9500";
const CELL_SIZE = 11;
const DONE = HABIT_COLOR;
const PENDING = `${HABIT_COLOR}55`;

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

/* Cells carry no text and no name; their square shape is what marks them. */
function cellColors(container: TestInstance): string[] {
  return container
    .queryAll((node) => {
      const style = StyleSheet.flatten(node.props.style);
      return style?.width === CELL_SIZE && style?.height === CELL_SIZE;
    })
    .map((cell) => StyleSheet.flatten(cell.props.style).backgroundColor);
}

/** Every line the screen drew, so "nothing" is assertable as nothing. */
function drawnText(container: TestInstance): string[] {
  return container
    .queryAll((node) => node.type === "Text")
    .map((text) => text.children.join(""));
}

/** Every line of text in the block a label belongs to, in render order. */
function blockText(label: TestInstance): string[] {
  const block = label.parent;
  if (!block) throw new Error("The label is not inside a block.");
  return block
    .queryAll((node) => node.type === "Text")
    .map((text) => text.children.join(""));
}

async function renderDetail(id: string) {
  routing.useLocalSearchParams.mockReturnValue({ id });
  return renderWithProviders(<HabitDetailScreen />);
}

/** Seeds a habit that already existed on the days it was completed. */
function seedHabit(
  overrides: Partial<HabitInput> = {},
  { createdAt = TODAY, completions = [] as string[] } = {},
) {
  jest.setSystemTime(new Date(`${createdAt}T12:00:00-03:00`));
  const habit = createHabit(input(overrides));
  jest.setSystemTime(new Date(`${TODAY}T12:00:00-03:00`));
  for (const date of completions) completeHabit(habit.id, date);
  return habit;
}

beforeEach(async () => {
  /* Pinned rather than inherited, so a change to how the device is resolved
  cannot rewrite what these cases assert. */
  await i18n.changeLanguage("en");
  freezeClock(`${TODAY}T12:00:00-03:00`);
  stableIds();
  await deleteAllData();
  jest.clearAllMocks();
  routing.router.canGoBack.mockReturnValue(true);
});

afterEach(() => {
  restoreClock();
  jest.restoreAllMocks();
});

describe("a habit that is not there", () => {
  it("should leave the screen when there is somewhere to go back to", async () => {
    routing.router.canGoBack.mockReturnValue(true);

    const { container } = await renderDetail("gone");

    expect(routing.router.back).toHaveBeenCalledTimes(1);
    expect(drawnText(container)).toEqual([]);
  });

  it("should stay put when there is nowhere to go back to", async () => {
    routing.router.canGoBack.mockReturnValue(false);

    const { container } = await renderDetail("gone");

    expect(routing.router.back).not.toHaveBeenCalled();
    expect(drawnText(container)).toEqual([]);
  });

  it("should leave the screen when the habit it was showing is deleted", async () => {
    const habit = seedHabit();
    const { getByText } = await renderDetail(habit.id);
    expect(getByText("Walk outside")).toBeOnTheScreen();

    await act(async () => deleteAllData());

    expect(routing.router.back).toHaveBeenCalledTimes(1);
  });
});

describe("the habit being shown", () => {
  it("should name the habit and how it is scheduled", async () => {
    const habit = seedHabit({ name: "Read", weekdays: MONDAY });

    const { getByText } = await renderDetail(habit.id);

    expect(getByText("Read")).toBeOnTheScreen();
    expect(getByText("Mon")).toBeOnTheScreen();
  });

  it("should give the reminder time beside the schedule", async () => {
    const habit = seedHabit({ reminderTime: "07:30" });

    const { getByText } = await renderDetail(habit.id);

    expect(getByText("Every day  ·  7:30 AM")).toBeOnTheScreen();
  });

  it("should draw the habit in its own icon and color", async () => {
    const habit = seedHabit({ icon: "book.fill", color: "#34C759" });

    const { container } = await renderDetail(habit.id);

    expect(symbolView(container, "book.fill").props.tintColor).toBe("#34C759");
  });
});

describe("the statistics", () => {
  it("should count the streak the completions add up to", async () => {
    const habit = seedHabit(
      {},
      { createdAt: TWO_DAYS_AGO, completions: [TWO_DAYS_AGO, YESTERDAY] },
    );

    const { getByText } = await renderDetail(habit.id);

    expect(blockText(getByText("CURRENT STREAK"))).toEqual([
      "CURRENT STREAK",
      "2",
      "days",
    ]);
  });

  it("should remember a better streak than the one it is on", async () => {
    const habit = seedHabit(
      {},
      {
        createdAt: "2026-07-01",
        completions: ["2026-07-01", "2026-07-02", "2026-07-03", YESTERDAY],
      },
    );

    const { getByText } = await renderDetail(habit.id);

    expect(blockText(getByText("CURRENT STREAK"))).toEqual([
      "CURRENT STREAK",
      "1",
      "day",
    ]);
    expect(blockText(getByText("Best streak"))).toEqual(["Best streak", "3"]);
  });

  it("should rate the last thirty days against the days that were scheduled", async () => {
    const habit = seedHabit(
      {},
      { createdAt: TWO_DAYS_AGO, completions: [TWO_DAYS_AGO, YESTERDAY] },
    );

    const { getByText } = await renderDetail(habit.id);

    /* Two of the three days the habit has existed for. */
    expect(blockText(getByText("30-day rate"))).toEqual(["30-day rate", "67%"]);
  });

  it("should rate the last thirty days rather than the habit's whole life", async () => {
    const habit = seedHabit(
      {},
      {
        createdAt: "2026-05-01",
        completions: [
          /* Four check-ins from three months back, outside the window. */
          "2026-05-01",
          "2026-05-02",
          "2026-05-03",
          "2026-05-04",
          YESTERDAY,
        ],
      },
    );

    const { getByText } = await renderDetail(habit.id);

    /* One day in thirty. Over the habit's ninety days it would read 6%. */
    expect(blockText(getByText("30-day rate"))).toEqual(["30-day rate", "3%"]);
  });

  it("should read the streak off the completions rather than off today", async () => {
    const habit = seedHabit(
      {},
      { createdAt: "2026-07-01", completions: ["2026-07-01", "2026-07-02"] },
    );

    const { getByText } = await renderDetail(habit.id);

    /* The run ended weeks ago, so nothing is running now. */
    expect(blockText(getByText("CURRENT STREAK"))).toEqual([
      "CURRENT STREAK",
      "0",
      "days",
    ]);
    expect(blockText(getByText("Best streak"))).toEqual(["Best streak", "2"]);
  });

  it("should start a habit with no history at zero rather than blank", async () => {
    const habit = seedHabit();

    const { getByText } = await renderDetail(habit.id);

    expect(blockText(getByText("CURRENT STREAK"))).toEqual([
      "CURRENT STREAK",
      "0",
      "days",
    ]);
    expect(blockText(getByText("Best streak"))).toEqual(["Best streak", "0"]);
    expect(blockText(getByText("30-day rate"))).toEqual(["30-day rate", "0%"]);
  });
});

describe("checking in from the detail screen", () => {
  it("should offer to check in on a day the habit is scheduled", async () => {
    const habit = seedHabit();

    const { getByRole } = await renderDetail(habit.id);

    expect(getByRole("button", { name: "Check in today" })).toBeOnTheScreen();
  });

  it("should record the check-in, the streak and the grid together", async () => {
    const habit = seedHabit(
      {},
      { createdAt: TWO_DAYS_AGO, completions: [TWO_DAYS_AGO, YESTERDAY] },
    );
    const view = await renderDetail(habit.id);
    expect(cellColors(view.container).filter((color) => color === DONE)).toHaveLength(2);

    await fireEvent.press(view.getByRole("button", { name: "Check in today" }));

    expect(getAppState().completions[habit.id]?.[TODAY]).toBe(true);
    expect(blockText(view.getByText("CURRENT STREAK"))).toEqual([
      "CURRENT STREAK",
      "3",
      "days",
    ]);
    expect(blockText(view.getByText("30-day rate"))).toEqual([
      "30-day rate",
      "100%",
    ]);
    expect(cellColors(view.container).filter((color) => color === DONE)).toHaveLength(3);
  });

  it("should hint today in the habit's color until it is checked in", async () => {
    const habit = seedHabit();

    const { container } = await renderDetail(habit.id);

    expect(cellColors(container)).toContain(PENDING);
    expect(cellColors(container)).not.toContain(DONE);
  });

  it("should offer to undo a check-in that is already in", async () => {
    const habit = seedHabit({}, { completions: [TODAY] });

    const { getByRole } = await renderDetail(habit.id);

    expect(getByRole("button", { name: "Undo today's check-in" })).toBeOnTheScreen();
  });

  it("should take the check-in back when it is undone", async () => {
    const habit = seedHabit({}, { completions: [TODAY] });
    const view = await renderDetail(habit.id);

    await fireEvent.press(
      view.getByRole("button", { name: "Undo today's check-in" }),
    );

    expect(getAppState().completions[habit.id]?.[TODAY]).toBeUndefined();
    expect(view.getByRole("button", { name: "Check in today" })).toBeOnTheScreen();
  });

  it("should say the day is a rest day rather than offer a check-in", async () => {
    const habit = seedHabit({ weekdays: MONDAY });

    const { getByText, queryByRole } = await renderDetail(habit.id);

    expect(getByText("Not scheduled today")).toBeOnTheScreen();
    expect(getByText("Your streak is safe on rest days.")).toBeOnTheScreen();
    expect(queryByRole("button", { name: "Check in today" })).toBeNull();
  });
});

describe("going somewhere else", () => {
  it("should open the habit form on the habit being shown", async () => {
    const habit = seedHabit();
    const { getByRole } = await renderDetail(habit.id);

    await fireEvent.press(getByRole("button", { name: "Edit habit" }));

    expect(routing.router.push).toHaveBeenCalledWith(
      `/habit-form?id=${habit.id}`,
    );
  });

  it("should point the history card at the habit's own history", async () => {
    const habit = seedHabit();

    await renderDetail(habit.id);

    expect(routing.Link).toHaveBeenCalledWith(
      expect.objectContaining({ href: `/habit-history?id=${habit.id}` }),
      undefined,
    );
  });

  it("should name the history card for a screen reader", async () => {
    const habit = seedHabit({ name: "Read" });

    const { getByRole } = await renderDetail(habit.id);

    expect(getByRole("button", { name: "Read history" })).toBeOnTheScreen();
  });
});
