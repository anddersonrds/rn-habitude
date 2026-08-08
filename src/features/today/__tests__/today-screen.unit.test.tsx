import { TodayScreen } from "@/features/today";
import i18n from "@/i18n/i18next";
import en from "@/i18n/locales/en";
import ptBR from "@/i18n/locales/pt-br";
import {
  completeHabit,
  createHabit,
  deleteAllData,
  getAppState,
} from "@/lib/store";
import type { Habit, HabitInput } from "@/lib/domain/types";
import { accent, success } from "@/theme";
import { pressButton, tapNative } from "@/test-utils/native-events";
import { modifier, nativeView, nativeViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { freezeClock, restoreClock, stableIds } from "@/test-utils/time";
import { fireEvent } from "@testing-library/react-native";
import { Alert } from "react-native";
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

const routing = jest.requireMock<{ router: { push: jest.Mock } }>("expo-router");

const today = en.translations.today;
const common = en.translations.common;
const inPortuguese = ptBR.translations.today;

/**
 * Fills a catalog template here rather than calling the same `t` the screen
 * calls, so a case still fails when the screen interpolates the wrong number.
 */
function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replace(`{{${name}}}`, `${value}`),
    template,
  );
}

/* A Wednesday. Every fixture below is dated against it. */
const TODAY = "2026-07-29";
const HABIT_COLOR = "#FF9500";
const UNDONE_GREY = "#8E8E93";
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

/* A row is a native view tagged with the habit it belongs to. */
function rows(container: TestInstance): TestInstance[] {
  return nativeViews(container).filter((node) =>
    ((node.props.modifiers ?? []) as { $type: string }[]).some(
      (entry) => entry.$type === "tag",
    ),
  );
}

function rowOf(container: TestInstance, habit: Habit): TestInstance {
  const row = rows(container).find(
    (node) => modifier(node, "tag").tag === habit.id,
  );
  if (!row) throw new Error(`No row is tagged for "${habit.name}".`);
  return row;
}

function titleOf(row: TestInstance): string {
  const [first] = row.queryAll((node) => typeof node.props.text === "string");
  if (!first) throw new Error("The row draws no name.");
  return first.props.text as string;
}

function accentOf(row: TestInstance): unknown {
  const [icon] = row.queryAll(
    (node) => typeof node.props.systemName === "string",
  );
  if (!icon) throw new Error("The row draws no icon.");
  return modifier(icon, "foregroundStyle").color;
}

/* The row's own content, which is what a tap lands on. */
function contentOf(row: TestInstance): TestInstance {
  const [found] = row.queryAll((node) =>
    ((node.props.modifiers ?? []) as { $type: string }[]).some(
      (entry) => entry.$type === "onTapGesture",
    ),
  );
  if (!found) throw new Error("The row takes no tap.");
  return found;
}

/** Every piece of SwiftUI text the screen drew, in render order. */
function drawnText(container: TestInstance): string[] {
  return nativeViews(container)
    .filter((node) => typeof node.props.text === "string")
    .map((node) => node.props.text as string);
}

/** The progress bar, which is the only view carrying a value to read out. */
function progressBar(container: TestInstance): TestInstance {
  const [found] = nativeViews(container).filter((node) =>
    ((node.props.modifiers ?? []) as { $type: string }[]).some(
      (entry) => entry.$type === "accessibilityValue",
    ),
  );
  if (!found) throw new Error("The screen draws no progress bar.");
  return found;
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

  it("should say there is nothing here yet, and offer a way out", async () => {
    const { getByText, getByLabelText } = await renderToday();

    expect(getByText(common.noHabitsYet)).toBeTruthy();
    expect(getByLabelText(common.addHabit)).toBeTruthy();
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
    expect(nativeView(container, "systemName", "moon.zzz.fill")).toBeTruthy();
  });

  it("should draw no progress on a day with nothing to do", async () => {
    seedHabit({ weekdays: MONDAY });

    const { container } = await renderToday();

    expect(() => progressBar(container)).toThrow("no progress bar");
  });
});

describe("a day with habits", () => {
  it("should draw a row per habit due today, in the order they were made", async () => {
    seedHabit({ name: "Walk outside" }, { done: true });
    seedHabit({ name: "Read", color: "#FF3B30" });

    const { container } = await renderToday();

    expect(rows(container).map(titleOf)).toEqual(["Walk outside", "Read"]);
  });

  it("should draw each row in its own habit's colour", async () => {
    const walk = seedHabit({ name: "Walk outside" }, { done: true });
    const read = seedHabit({ name: "Read", color: "#FF3B30" });

    const { container } = await renderToday();

    expect(accentOf(rowOf(container, walk))).toBe(HABIT_COLOR);
    expect(accentOf(rowOf(container, read))).toBe("#FF3B30");
  });

  it("should head the list with the day it is showing", async () => {
    seedHabit();

    const { container } = await renderToday();

    expect(nativeView(container, "title", "Wednesday, July 29")).toBeTruthy();
  });

  it("should count how much of the day is done", async () => {
    seedHabit({ name: "Walk outside" }, { done: true });
    seedHabit({ name: "Read" });

    const { container } = await renderToday();

    expect(drawnText(container)).toContain(fill(today.progress_other, { done: 1, count: 2 }));
  });

  it("should say the day is done rather than counting it", async () => {
    seedHabit({ name: "Walk outside" }, { done: true });

    const { container } = await renderToday();

    expect(drawnText(container)).toContain(today.allDone);
    expect(nativeView(container, "systemName", "checkmark.seal.fill")).toBeTruthy();
  });

  it("should read the progress out with its label and its value", async () => {
    seedHabit({ name: "Walk outside" }, { done: true });
    seedHabit({ name: "Read" });

    const { container } = await renderToday();

    const bar = progressBar(container);
    expect(bar.props.value).toBe(0.5);
    expect(modifier(bar, "accessibilityLabel")).toMatchObject({
      label: today.progressLabel,
    });
    expect(modifier(bar, "accessibilityValue")).toMatchObject({
      value: fill(today.progressValue_other, { done: 1, count: 2 }),
    });
  });

  it("should draw the day in the language the app is set to", async () => {
    seedHabit({ name: "Walk outside" }, { done: true });
    seedHabit({ name: "Read" });
    await i18n.changeLanguage("pt-BR");

    const { container } = await renderToday();

    expect(
      nativeView(container, "title", inPortuguese.checkInSection),
    ).toBeTruthy();
    expect(drawnText(container)).toContain(
      fill(inPortuguese.progress_other, { done: 1, count: 2 }),
    );
  });

  it("should count one habit in the singular", async () => {
    seedHabit({ name: "Walk outside" });
    await i18n.changeLanguage("pt-BR");

    const { container } = await renderToday();

    /* Asserted in Portuguese because English spells both forms the same way,
    so an English case cannot tell `progress_one` from `progress_other`. */
    expect(drawnText(container)).toContain(
      fill(inPortuguese.progress_one, { done: 0, count: 1 }),
    );
  });

  it("should turn the progress bar from the app's colour to the done colour", async () => {
    const habit = seedHabit({ name: "Walk outside" });
    const { container } = await renderToday();
    expect(modifier(progressBar(container), "tint")).toMatchObject({
      color: accent,
    });

    await tapNative(contentOf(rowOf(container, habit)));
    await settle();

    expect(modifier(progressBar(container), "tint")).toMatchObject({
      color: success,
    });
  });
});

describe("what a row shows", () => {
  it("should draw the habit's icon in the habit's colour", async () => {
    seedHabit({ icon: "book.fill" });

    const { container } = await renderToday();

    const icon = nativeView(container, "systemName", "book.fill");
    expect(modifier(icon, "foregroundStyle")).toMatchObject({
      color: HABIT_COLOR,
    });
    expect(modifier(icon, "background")).toMatchObject({
      color: `${HABIT_COLOR}26`,
    });
  });

  it("should draw an open habit as an empty circle", async () => {
    const habit = seedHabit();

    const { container } = await renderToday();

    const status = nativeView(rowOf(container, habit), "systemName", "circle");
    expect(modifier(status, "foregroundStyle")).toMatchObject({
      color: UNDONE_GREY,
    });
  });

  it("should draw a checked-in habit as a filled circle in its own colour", async () => {
    const habit = seedHabit({}, { done: true });

    const { container } = await renderToday();

    const status = nativeView(
      rowOf(container, habit),
      "systemName",
      "checkmark.circle.fill",
    );
    expect(modifier(status, "foregroundStyle")).toMatchObject({
      color: HABIT_COLOR,
    });
    expect(modifier(status, "opacity")).toMatchObject({ value: 1 });
  });

  it("should strike a checked-in habit's name through", async () => {
    const habit = seedHabit({ name: "Walk outside" }, { done: true });

    const { container } = await renderToday();

    const name = nativeView(rowOf(container, habit), "text", "Walk outside");
    expect(modifier(name, "strikethrough")).toMatchObject({ isActive: true });
  });

  it("should leave an open habit's name alone", async () => {
    const habit = seedHabit({ name: "Walk outside" });

    const { container } = await renderToday();

    const name = nativeView(rowOf(container, habit), "text", "Walk outside");
    expect(modifier(name, "strikethrough")).toMatchObject({ isActive: false });
  });

  it("should say what the habit is on under its name", async () => {
    seedHabit({ reminderTime: "07:30" });

    const { container } = await renderToday();

    expect(drawnText(container)).toContain("7:30 AM");
  });

  it("should say nothing under a habit with no streak and no reminder", async () => {
    const habit = seedHabit({ name: "Walk outside" });

    const { container } = await renderToday();

    const texts = rowOf(container, habit)
      .queryAll((node) => typeof node.props.text === "string")
      .map((node) => node.props.text as string);
    expect(texts).toEqual(["Walk outside"]);
  });
});

describe("checking a habit in", () => {
  it("should check it in when the row is tapped", async () => {
    const habit = seedHabit();
    const { container } = await renderToday();

    await tapNative(contentOf(rowOf(container, habit)));
    await settle();

    expect(getAppState().completions[habit.id]).toEqual({ [TODAY]: true });
  });

  it("should redraw the row as done", async () => {
    const habit = seedHabit();
    const { container } = await renderToday();

    await tapNative(contentOf(rowOf(container, habit)));
    await settle();

    expect(
      nativeView(rowOf(container, habit), "systemName", "checkmark.circle.fill"),
    ).toBeTruthy();
  });

  it("should take the check-in back when the row is tapped again", async () => {
    const habit = seedHabit({}, { done: true });
    const { container } = await renderToday();

    await tapNative(contentOf(rowOf(container, habit)));
    await settle();

    expect(getAppState().completions[habit.id]?.[TODAY]).toBeUndefined();
  });
});

describe("the actions behind a swipe", () => {
  it("should offer a check-in from the leading edge", async () => {
    const habit = seedHabit();
    const { container } = await renderToday();

    const checkIn = nativeView(rowOf(container, habit), "label", today.checkIn);
    expect(modifier(checkIn, "tint")).toMatchObject({ color: success });
    await pressButton(checkIn);
    await settle();

    expect(getAppState().completions[habit.id]).toEqual({ [TODAY]: true });
  });

  it("should offer to undo once the habit is done", async () => {
    const habit = seedHabit({}, { done: true });
    const { container } = await renderToday();

    const undo = nativeView(rowOf(container, habit), "label", today.undo);
    expect(modifier(undo, "tint")).toMatchObject({ color: accent });
    await pressButton(undo);
    await settle();

    expect(getAppState().completions[habit.id]?.[TODAY]).toBeUndefined();
  });

  it("should open the habit form from the trailing edge", async () => {
    const habit = seedHabit();
    const { container } = await renderToday();

    await pressButton(nativeView(rowOf(container, habit), "label", common.edit));

    expect(routing.router.push).toHaveBeenCalledWith(
      `/habit-form?id=${habit.id}`,
    );
  });

  it("should open the habit's history from the trailing edge", async () => {
    const habit = seedHabit();
    const { container } = await renderToday();

    await pressButton(nativeView(rowOf(container, habit), "label", today.history));

    expect(routing.router.push).toHaveBeenCalledWith(`/habit/${habit.id}`);
  });

  it("should ask before deleting from the trailing edge", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const habit = seedHabit({ name: "Walk outside" });
    const { container } = await renderToday();

    await pressButton(nativeView(rowOf(container, habit), "label", common.delete));

    expect(alert).toHaveBeenCalledWith(
      fill(common.deleteHabitTitle, { name: "Walk outside" }),
      common.deleteHabitBody,
      expect.any(Array),
    );
    expect(getAppState().habits).toHaveLength(1);
  });

  it("should keep a full swipe from deleting a habit outright", async () => {
    const habit = seedHabit();

    const { container } = await renderToday();

    expect(modifier(rowOf(container, habit), "deleteDisabled")).toBeTruthy();
  });
});
