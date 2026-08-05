import { HabitsScreen } from "@/components/screens/habits/HabitsScreen";
import i18n from "@/i18n/i18next";
import { completeHabit, createHabit, deleteAllData, getAppState } from "@/lib/store";
import type { Habit, HabitInput } from "@/lib/types";
import { moveRow, pressButton, tapNative } from "@/test-utils/native-events";
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

/* A Wednesday. Every fixture below is dated against it. */
const TODAY = "2026-07-29";
const YESTERDAY = "2026-07-28";
const TWO_DAYS_AGO = "2026-07-27";

const HABIT_COLOR = "#FF9500";
const NEUTRAL = "#000000";
const STRIP_DAYS = 21;
const TODAY_IN_STRIP = STRIP_DAYS - 1;
/* The strip draws a state as an opacity over one of the two colours. */
const OPACITY = { done: 1, pending: 0.3, missed: 0.14, off: 0.06 };

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

/* A row is the one native view that names itself to a screen reader. */
function rowNamed(container: TestInstance, name: string): TestInstance {
  const row = nativeViews(container).find((node) =>
    ((node.props.modifiers ?? []) as { $type: string; label?: string }[]).some(
      (entry) => entry.$type === "accessibilityLabel" && entry.label?.startsWith(name),
    ),
  );
  if (!row) throw new Error(`No row names itself "${name}".`);
  return row;
}

/** The list itself, which is the only view carrying an edit mode. */
function list(container: TestInstance): TestInstance {
  const [found] = nativeViews(container).filter((node) =>
    ((node.props.modifiers ?? []) as { $type: string }[]).some(
      (entry) => entry.$type === "environment",
    ),
  );
  if (!found) throw new Error("The screen draws no list.");
  return found;
}

/** The reorderable collection, which is what a drop is delivered to. */
function reorderable(container: TestInstance): TestInstance {
  const [found] = nativeViews(container).filter(
    (node) => typeof node.props.onMove === "function",
  );
  if (!found) throw new Error("The screen draws nothing reorderable.");
  return found;
}

/** Every cell of a row's heat strip, oldest first, as colour and opacity. */
function stripOf(row: TestInstance): { color: string; opacity: number }[] {
  return row
    .queryAll((node) => node.props.cornerRadius === 1.5)
    .map((cell) => ({
      color: modifier(cell, "foregroundStyle").color as string,
      opacity: modifier(cell, "opacity").value as number,
    }));
}

/** Every piece of SwiftUI text the screen drew, in render order. */
function drawnText(container: TestInstance): string[] {
  return nativeViews(container)
    .filter((node) => typeof node.props.text === "string")
    .map((node) => node.props.text as string);
}

async function renderList() {
  return renderWithProviders(<HabitsScreen />);
}

/** Lets the fire-and-forget reminder refresh settle before the case goes on. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

beforeEach(async () => {
  /* Pinned rather than inherited, so a change to how the device is resolved
  cannot rewrite what these cases assert. */
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
  it("should render the empty state", async () => {
    const { toJSON } = await renderList();

    expect(toJSON()).toMatchSnapshot();
  });

  it("should say there is nothing here yet, and offer a way out", async () => {
    const { getByText, getByLabelText } = await renderList();

    expect(getByText("No habits yet")).toBeTruthy();
    expect(getByLabelText("Add habit")).toBeTruthy();
    await fireEvent.press(getByText("New habit"));

    expect(routing.router.push).toHaveBeenCalledWith("/habit-form");
  });

  it("should offer no reordering", async () => {
    const { queryByLabelText } = await renderList();

    expect(queryByLabelText("Reorder")).toBeNull();
  });
});

describe("a list with habits", () => {
  it("should render the list", async () => {
    seedHabit({ name: "Walk outside" }, { createdAt: TWO_DAYS_AGO });
    seedHabit({ name: "Read", color: "#FF3B30" });

    const { toJSON } = await renderList();

    expect(toJSON()).toMatchSnapshot();
  });

  it("should count the habits above them", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });

    const { container } = await renderList();

    expect(nativeView(container, "title", "2 habits")).toBeTruthy();
  });

  it("should report the longest streak and every check-in ever made", async () => {
    seedHabit(
      { name: "Walk outside" },
      { createdAt: TWO_DAYS_AGO, completions: [TWO_DAYS_AGO, YESTERDAY, TODAY] },
    );
    seedHabit({ name: "Read" }, { completions: [TODAY] });

    const { container } = await renderList();

    const drawn = drawnText(container);
    expect(drawn[drawn.indexOf("longest active streak") - 1]).toBe("3");
    expect(drawn[drawn.indexOf("check-ins") - 1]).toBe("4");
  });
});

describe("what a row shows", () => {
  it("should name itself, its schedule and its streak to a screen reader", async () => {
    seedHabit(
      { name: "Walk outside", weekdays: [1, 3, 5] },
      { createdAt: TWO_DAYS_AGO, completions: [TODAY] },
    );

    const { container } = await renderList();

    expect(modifier(rowNamed(container, "Walk outside"), "accessibilityLabel")).toEqual({
      $type: "accessibilityLabel",
      label: "Walk outside, Mon, Wed, Fri, 1-day streak",
    });
  });

  it("should leave the streak out of its name while there is none", async () => {
    seedHabit({ name: "Walk outside" });

    const { container } = await renderList();

    expect(modifier(rowNamed(container, "Walk outside"), "accessibilityLabel")).toMatchObject(
      { label: "Walk outside, Every day" },
    );
  });

  it("should say what a tap and a long press do", async () => {
    seedHabit({ name: "Walk outside" });

    const { container } = await renderList();

    expect(modifier(rowNamed(container, "Walk outside"), "accessibilityHint")).toMatchObject(
      { hint: "Opens habit history. Long press for more actions." },
    );
  });

  it("should draw the habit's icon in the habit's colour", async () => {
    seedHabit({ name: "Walk outside", icon: "book.fill" });

    const { container } = await renderList();

    const icon = nativeView(container, "systemName", "book.fill");
    expect(modifier(icon, "foregroundStyle")).toMatchObject({ color: HABIT_COLOR });
    expect(modifier(icon, "background")).toMatchObject({
      color: `${HABIT_COLOR}26`,
    });
  });

  it("should say only the schedule while the habit is on no streak", async () => {
    seedHabit({ name: "Walk outside" });

    const { container } = await renderList();

    expect(drawnText(container)).toContain("Every day");
    expect(() => nativeView(container, "systemName", "flame.fill")).toThrow(
      "figure.walk",
    );
  });

  it("should flag a streak with the days it is on and a flame", async () => {
    seedHabit(
      { name: "Walk outside" },
      { createdAt: TWO_DAYS_AGO, completions: [YESTERDAY, TODAY] },
    );

    const { container } = await renderList();

    expect(drawnText(container)).toContain("2 days  ·  Every day");
    expect(
      modifier(nativeView(container, "systemName", "flame.fill"), "foregroundStyle"),
    ).toMatchObject({ color: HABIT_COLOR });
  });
});

describe("the heat strip on a row", () => {
  it("should draw three weeks, ending today", async () => {
    seedHabit({ name: "Walk outside" });

    const { container } = await renderList();

    expect(stripOf(rowNamed(container, "Walk outside"))).toHaveLength(STRIP_DAYS);
  });

  it("should draw a day that was done in the habit's colour", async () => {
    seedHabit({ name: "Walk outside" }, { completions: [TODAY] });

    const { container } = await renderList();

    expect(stripOf(rowNamed(container, "Walk outside"))[TODAY_IN_STRIP]).toEqual({
      color: HABIT_COLOR,
      opacity: OPACITY.done,
    });
  });

  it("should draw today as still open until it is checked in", async () => {
    seedHabit({ name: "Walk outside" });

    const { container } = await renderList();

    expect(stripOf(rowNamed(container, "Walk outside"))[TODAY_IN_STRIP]).toEqual({
      color: HABIT_COLOR,
      opacity: OPACITY.pending,
    });
  });

  it("should draw a day that was missed and a day before the habit apart", async () => {
    seedHabit({ name: "Walk outside" }, { createdAt: YESTERDAY });

    const { container } = await renderList();

    const strip = stripOf(rowNamed(container, "Walk outside"));
    expect(strip[TODAY_IN_STRIP - 1]).toEqual({
      color: NEUTRAL,
      opacity: OPACITY.missed,
    });
    expect(strip[TODAY_IN_STRIP - 2]).toEqual({
      color: NEUTRAL,
      opacity: OPACITY.off,
    });
  });
});

describe("the two shapes a row takes", () => {
  it("should hold the row in a context menu while the list is not being reordered", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });

    const { container } = await renderList();

    expect(nativeView(container, "label", "Open")).toBeTruthy();
    expect(nativeView(container, "label", "Edit")).toBeTruthy();
    expect(nativeView(container, "label", "Delete")).toBeTruthy();
  });

  it("should refuse the drag while the list is not being reordered", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });

    const { container } = await renderList();

    const menu = nativeViews(container).find((node) =>
      ((node.props.modifiers ?? []) as { $type: string }[]).some(
        (entry) => entry.$type === "moveDisabled",
      ),
    );
    expect(menu).toBeTruthy();
    expect(modifier(list(container), "environment")).toMatchObject({
      key: "editMode",
      value: "inactive",
    });
  });

  it("should drop the context menu and take the drag once the list is reordered", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });
    const { container, getByLabelText } = await renderList();

    await fireEvent.press(getByLabelText("Reorder"));

    expect(() => nativeView(container, "label", "Open")).toThrow("none");
    expect(
      nativeViews(container).some((node) =>
        ((node.props.modifiers ?? []) as { $type: string }[]).some(
          (entry) => entry.$type === "moveDisabled",
        ),
      ),
    ).toBe(false);
    expect(modifier(list(container), "environment")).toMatchObject({
      value: "active",
    });
  });

  it("should carry its identity on whichever view is the row's root", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });
    const [{ id }] = getAppState().habits;
    const { container, getByLabelText } = await renderList();

    /* Outside reorder mode the tag is on the menu, not on the row. */
    expect(() => modifier(rowNamed(container, "Walk outside"), "tag")).toThrow(
      "contentShape",
    );

    await fireEvent.press(getByLabelText("Reorder"));

    expect(modifier(rowNamed(container, "Walk outside"), "tag")).toMatchObject({
      tag: id,
    });
  });

  it("should say the row is dragged rather than tapped while reordering", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });
    const { container, getByLabelText } = await renderList();

    await fireEvent.press(getByLabelText("Reorder"));

    expect(modifier(rowNamed(container, "Walk outside"), "accessibilityHint")).toMatchObject(
      { hint: "Drag the handle to reorder." },
    );
  });
});

describe("what a row does", () => {
  it("should open the habit's history when the row is tapped", async () => {
    const habit = seedHabit({ name: "Walk outside" });
    const { container } = await renderList();

    await tapNative(rowNamed(container, "Walk outside"));

    expect(routing.router.push).toHaveBeenCalledWith(`/habit/${habit.id}`);
  });

  it("should not answer a tap while the list is being reordered", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });
    const { container, getByLabelText } = await renderList();
    await fireEvent.press(getByLabelText("Reorder"));

    /*
    The row still receives events - the modifiers it keeps carry their own -
    so what proves the tap is gone is that the gesture reaches nothing.
    */
    await tapNative(rowNamed(container, "Walk outside"));

    expect(() => modifier(rowNamed(container, "Walk outside"), "onTapGesture")).toThrow(
      "accessibilityHint",
    );
    expect(routing.router.push).not.toHaveBeenCalled();
  });

  it("should open the habit's history from the context menu", async () => {
    const habit = seedHabit({ name: "Walk outside" });
    const { container } = await renderList();

    await pressButton(nativeView(container, "label", "Open"));

    expect(routing.router.push).toHaveBeenCalledWith(`/habit/${habit.id}`);
  });

  it("should open the habit form from the context menu", async () => {
    const habit = seedHabit({ name: "Walk outside" });
    const { container } = await renderList();

    await pressButton(nativeView(container, "label", "Edit"));

    expect(routing.router.push).toHaveBeenCalledWith(
      `/habit-form?id=${habit.id}`,
    );
  });

  it("should ask before deleting from the context menu", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    seedHabit({ name: "Walk outside" });
    const { container } = await renderList();

    await pressButton(nativeView(container, "label", "Delete"));

    expect(alert).toHaveBeenCalledWith(
      'Delete "Walk outside"?',
      "This permanently deletes the habit and its history.",
      expect.any(Array),
    );
    expect(getAppState().habits).toHaveLength(1);
  });
});

describe("putting the habits in a different order", () => {
  it("should offer no reordering for a single habit", async () => {
    seedHabit({ name: "Walk outside" });

    const { queryByLabelText } = await renderList();

    expect(queryByLabelText("Reorder")).toBeNull();
  });

  it("should offer to finish once the list is being reordered", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });
    const { getByLabelText, queryByLabelText } = await renderList();

    await fireEvent.press(getByLabelText("Reorder"));

    expect(getByLabelText("Done")).toBeTruthy();
    expect(queryByLabelText("Reorder")).toBeNull();
  });

  it("should write the order a drop asks for", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });
    seedHabit({ name: "Stretch" });
    const { container, getByLabelText } = await renderList();
    await fireEvent.press(getByLabelText("Reorder"));

    await moveRow(reorderable(container), 2, 0);
    await settle();

    expect(getAppState().habits.map((habit) => habit.name)).toEqual([
      "Stretch",
      "Walk outside",
      "Read",
    ]);
  });

  it("should draw the rows in the order it wrote", async () => {
    seedHabit({ name: "Walk outside" });
    seedHabit({ name: "Read" });
    const { container, getByLabelText } = await renderList();
    await fireEvent.press(getByLabelText("Reorder"));

    await moveRow(reorderable(container), 1, 0);
    await settle();

    const labels = nativeViews(container)
      .map((node) =>
        ((node.props.modifiers ?? []) as { $type: string; label?: string }[]).find(
          (entry) => entry.$type === "accessibilityLabel",
        ),
      )
      .filter(Boolean)
      .map((entry) => entry!.label);
    expect(labels).toEqual(["Read, Every day", "Walk outside, Every day"]);
  });
});
