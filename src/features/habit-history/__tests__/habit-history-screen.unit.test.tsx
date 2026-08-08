import { HabitHistoryScreen } from "@/features/habit-history";
import i18n from "@/i18n/i18next";
import en from "@/i18n/locales/en";
import fr from "@/i18n/locales/fr";
import ptBR from "@/i18n/locales/pt-br";
import {
  completeHabit,
  createHabit,
  deleteAllData,
} from "@/lib/data/store";
import type { HabitInput } from "@/lib/domain/types";
import { renderWithProviders } from "@/test-utils/render";
import { freezeClock, restoreClock, stableIds } from "@/test-utils/time";
import { colors } from "@/theme";
import { StyleSheet } from "react-native";
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
  router: { back: jest.Mock; canGoBack: jest.Mock };
  useLocalSearchParams: jest.Mock;
  Stack: { Screen: jest.Mock };
}>("expo-router");

/*
A Wednesday. The grid ends on the Saturday of its week and holds 52 columns of
seven, so it runs from Sunday 2025-08-03 to Saturday 2026-08-01.
*/
const history = en.translations.history;

const TODAY = "2026-07-29";
const YESTERDAY = "2026-07-28";
const WINDOW_OPENS = "2025-08-03";
const DAY_BEFORE_WINDOW = "2025-08-02";
const HISTORY_CELLS = 364;

const HABIT_COLOR = "#FF9500";
const CELL_SIZE = 12;
const DONE = HABIT_COLOR;
/* A day still open is the habit's own colour, faded rather than tinted. */
const PENDING = `${HABIT_COLOR} at 0.3`;
const MISSED = colors.fill;
const BLANK = "transparent";

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

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
    .map((cell) => {
      const { backgroundColor, opacity } = StyleSheet.flatten(cell.props.style);
      return opacity == null || opacity === 1
        ? backgroundColor
        : `${backgroundColor} at ${opacity}`;
    });
}

/* Month labels are the only absolutely positioned thing the grid draws. */
function monthLabels(container: TestInstance): string[] {
  return container
    .queryAll(
      (node) => StyleSheet.flatten(node.props.style)?.position === "absolute",
    )
    .map((label) => label.children.join(""));
}

function drawnText(container: TestInstance): string[] {
  return container
    .queryAll((node) => node.type === "Text")
    .map((text) => text.children.join(""));
}

/** The number beside a summary label, which sits above it in the same block. */
function statBlock(label: TestInstance): string[] {
  const block = label.parent;
  if (!block) throw new Error("The label is not inside a block.");
  return block
    .queryAll((node) => node.type === "Text")
    .map((text) => text.children.join(""));
}

async function renderHistory(id: string) {
  routing.useLocalSearchParams.mockReturnValue({ id });
  return renderWithProviders(<HabitHistoryScreen />);
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

    const { container } = await renderHistory("gone");

    expect(routing.router.back).toHaveBeenCalledTimes(1);
    expect(drawnText(container)).toEqual([]);
  });

  it("should stay put when there is nowhere to go back to", async () => {
    routing.router.canGoBack.mockReturnValue(false);

    const { container } = await renderHistory("gone");

    expect(routing.router.back).not.toHaveBeenCalled();
    expect(drawnText(container)).toEqual([]);
  });
});

describe("the habit being shown", () => {
  it("should carry the habit's name into the title", async () => {
    const habit = seedHabit({ name: "Read" });

    await renderHistory(habit.id);

    expect(routing.Stack.Screen).toHaveBeenCalledWith(
      expect.objectContaining({ options: { title: "Read" } }),
      undefined,
    );
  });

  it("should say the grid covers a year", async () => {
    const habit = seedHabit();

    const { getByText } = await renderHistory(habit.id);

    expect(getByText(history.consistency)).toBeOnTheScreen();
    expect(getByText(history.range)).toBeOnTheScreen();
  });

  it("should say it in the language the app is set to", async () => {
    const habit = seedHabit();
    await i18n.changeLanguage("pt-BR");

    const { getByText } = await renderHistory(habit.id);

    const inPortuguese = ptBR.translations.history;
    expect(getByText(inPortuguese.consistency)).toBeOnTheScreen();
    expect(getByText(inPortuguese.legendRest)).toBeOnTheScreen();
    expect(getByText(inPortuguese.yearRate)).toBeOnTheScreen();
  });

  it("should key the legend to the habit's own color", async () => {
    const habit = seedHabit({ color: "#34C759" });

    const { container, getByText } = await renderHistory(habit.id);

    expect(getByText(history.legendDone)).toBeOnTheScreen();
    expect(getByText(history.legendMissed)).toBeOnTheScreen();
    expect(getByText(history.legendRest)).toBeOnTheScreen();
    expect(
      container
        .queryAll((node) => {
          const style = StyleSheet.flatten(node.props.style);
          return style?.width === 11 && style?.height === 11;
        })
        .map((swatch) => StyleSheet.flatten(swatch.props.style).backgroundColor),
    ).toEqual([
      "#34C759",
      colors.fill,
      colors.subtleFill,
    ]);
  });
});

describe("the year of squares", () => {
  it("should draw fifty-two weeks of seven days", async () => {
    const habit = seedHabit();

    const { container } = await renderHistory(habit.id);

    expect(cellColors(container)).toHaveLength(HISTORY_CELLS);
  });

  it("should open the window on the oldest day it can show", async () => {
    const habit = seedHabit(
      {},
      { createdAt: WINDOW_OPENS, completions: [WINDOW_OPENS] },
    );

    const { container } = await renderHistory(habit.id);

    expect(cellColors(container)[0]).toBe(DONE);
  });

  it("should leave a check-in older than the window off the grid", async () => {
    const habit = seedHabit(
      {},
      { createdAt: DAY_BEFORE_WINDOW, completions: [DAY_BEFORE_WINDOW] },
    );

    const { container } = await renderHistory(habit.id);

    /* The day it was checked in falls before the first column. */
    expect(cellColors(container)[0]).toEqual(MISSED);
    expect(cellColors(container)).toHaveLength(HISTORY_CELLS);
  });

  it("should close the window on the Saturday of this week", async () => {
    const habit = seedHabit();

    const { container } = await renderHistory(habit.id);
    const cells = cellColors(container);

    /* Today is a Wednesday, so the last three days have not happened. */
    expect(cells.slice(-4)).toEqual([PENDING, BLANK, BLANK, BLANK]);
  });

  it("should leave a habit blank for the part of the year before it existed", async () => {
    const habit = seedHabit(
      {},
      { createdAt: YESTERDAY, completions: [YESTERDAY] },
    );

    const { container } = await renderHistory(habit.id);
    const cells = cellColors(container);

    /* Yesterday, today, and the three days still to come. */
    expect(cells.slice(-5)).toEqual([DONE, PENDING, BLANK, BLANK, BLANK]);
    expect(cells.filter((color) => color === BLANK)).toHaveLength(
      HISTORY_CELLS - 2,
    );
  });

  it("should color every day by what happened on it", async () => {
    const habit = seedHabit(
      {},
      { createdAt: "2026-07-26", completions: ["2026-07-26", YESTERDAY] },
    );

    const { container } = await renderHistory(habit.id);
    const cells = cellColors(container);

    /* Sunday done, Monday and Tuesday missed, Tuesday done, then today. */
    expect(cells.slice(-7)).toEqual([
      DONE,
      MISSED,
      DONE,
      PENDING,
      BLANK,
      BLANK,
      BLANK,
    ]);
  });

  it("should label the months across the year boundary", async () => {
    const habit = seedHabit();

    const { container } = await renderHistory(habit.id);

    /*
    A month is labelled on the column it begins in, and a column begins on its
    Sunday. The last one begins on 26 July, so the four days of August the grid
    ends on carry no label of their own.
    */
    expect(monthLabels(container)).toEqual([
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
    ]);
  });

  it("should mark the weekday rows down the side", async () => {
    const habit = seedHabit();

    const { getByText } = await renderHistory(habit.id);

    expect(getByText("M")).toBeOnTheScreen();
    expect(getByText("W")).toBeOnTheScreen();
    expect(getByText("F")).toBeOnTheScreen();
  });
});

describe("the summary", () => {
  it("should count every check-in the habit has", async () => {
    const habit = seedHabit(
      {},
      {
        createdAt: "2026-07-01",
        completions: ["2026-07-01", "2026-07-02", YESTERDAY],
      },
    );

    const { getByText } = await renderHistory(habit.id);

    expect(statBlock(getByText(history.totalCheckIns))).toEqual([
      "3",
      history.totalCheckIns,
    ]);
  });

  it("should remember the best streak in the history", async () => {
    const habit = seedHabit(
      {},
      {
        createdAt: "2026-07-01",
        completions: ["2026-07-01", "2026-07-02", "2026-07-03", YESTERDAY],
      },
    );

    const { getByText } = await renderHistory(habit.id);

    expect(statBlock(getByText(history.bestStreak))).toEqual(["3", history.bestStreak]);
  });

  it("should rate the year against the days the habit has existed for", async () => {
    const habit = seedHabit(
      {},
      { createdAt: "2026-07-26", completions: ["2026-07-26", YESTERDAY] },
    );

    const { getByText } = await renderHistory(habit.id);

    /* Two of the four days from the 26th to today. */
    expect(statBlock(getByText(history.yearRate))).toEqual(["50%", history.yearRate]);
  });

  it("should rate the whole year rather than the last month of it", async () => {
    const habit = seedHabit(
      {},
      {
        createdAt: "2026-01-01",
        completions: ["2026-01-01", "2026-01-02", YESTERDAY],
      },
    );

    const { getByText } = await renderHistory(habit.id);

    /* Three days out of the two hundred and ten since New Year. Over the last
    thirty alone it would read 3%. */
    expect(statBlock(getByText(history.yearRate))).toEqual(["1%", history.yearRate]);
  });

  it("should punctuate the rate the way the app's language punctuates it", async () => {
    const habit = seedHabit(
      {},
      { createdAt: "2026-07-26", completions: ["2026-07-26", YESTERDAY] },
    );
    await i18n.changeLanguage("fr");

    const { getByText } = await renderHistory(habit.id);

    const inFrench = fr.translations.history;
    const [rate] = statBlock(getByText(inFrench.yearRate));
    expect(rate).not.toBe("50%");
    expect(rate.replace(/\s/g, "")).toBe("50%");
  });

  it("should start a habit with no history at zero rather than blank", async () => {
    const habit = seedHabit();

    const { getByText } = await renderHistory(habit.id);

    expect(statBlock(getByText(history.totalCheckIns))).toEqual([
      "0",
      history.totalCheckIns,
    ]);
    expect(statBlock(getByText(history.bestStreak))).toEqual(["0", history.bestStreak]);
    expect(statBlock(getByText(history.yearRate))).toEqual(["0%", history.yearRate]);
  });
});
