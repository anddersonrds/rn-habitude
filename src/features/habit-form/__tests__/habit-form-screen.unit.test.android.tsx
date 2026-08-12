import {
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_ICON,
  HABIT_ICONS,
  WEEKDAY_KEYS,
} from "@/constants/habit-options";
import { HabitFormScreen } from "@/features/habit-form";
import i18n from "@/i18n/i18next";
import en from "@/i18n/locales/en";
import ptBR from "@/i18n/locales/pt-br";
import { createHabit, deleteAllData, getAppState } from "@/lib/data/store";
import type { HabitInput } from "@/lib/domain/types";
import { foregroundOnColor } from "@/lib/utils/foreground-on-color";
import { toggleSwitch } from "@/test-utils/native-events";
import { symbolView } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { freezeClock, restoreClock, stableIds } from "@/test-utils/time";
import { colors } from "@/theme";
import { fireEvent } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { StyleSheet } from "react-native";
import type { TestInstance } from "test-renderer";

/* Reminders are the store's business, and their own tests cover them. */
jest.mock("@/lib/native/notifications", () => ({
  scheduleHabitReminders: jest.fn(async () => [] as string[]),
  cancelReminders: jest.fn(async () => {}),
  cancelAllReminders: jest.fn(async () => {}),
  ensureNotificationPermission: jest.fn(async () => true),
}));

jest.mock("expo-router", () =>
  /* eslint-disable-next-line @typescript-eslint/no-require-imports --
  a mock factory is hoisted above the imports and cannot close over one. */
  require("@/test-utils/expo-router").expoRouterMock(),
);

const routing = jest.requireMock<{
  router: { back: jest.Mock; replace: jest.Mock; canGoBack: jest.Mock };
  useLocalSearchParams: jest.Mock;
  Stack: { Screen: jest.Mock };
}>("expo-router");

const TODAY = "2026-07-29";
const HABIT_COLOR = "#FF9500";
const OTHER_COLOR = "#FF3B30";
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS_ONLY = [1, 2, 3, 4, 5];

const habitForm = en.translations.habitForm;
const common = en.translations.common;

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

/* The day dots are labelled from the catalog, so the labels to press are read
from it rather than written out a second time. */
const WEEKDAY_NAMES = WEEKDAY_KEYS.map(
  (keys) => en.translations.schedule[keys.name],
);

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

/* The switch reaches the Android tree under its own host name and prop. */
function reminderSwitch(container: TestInstance): TestInstance {
  const [found] = container.queryAll((node) => node.type === "AndroidSwitch");
  if (!found) throw new Error("The form draws no switch.");
  return found;
}

function reminderIsOn(container: TestInstance): boolean {
  return reminderSwitch(container).props.on as boolean;
}

function backgroundOf(node: TestInstance): string | undefined {
  return StyleSheet.flatten(node.props.style)?.backgroundColor;
}

function colorOf(node: TestInstance): string | undefined {
  return StyleSheet.flatten(node.props.style)?.color;
}

/**
 * The header is the navigator's, not the screen's, so this renders what the
 * screen last handed the stack. Last rather than first: the save button turns
 * on and off as the form is filled in.
 */
function header(): ReactElement {
  const calls = routing.Stack.Screen.mock.calls;
  const { options } = calls[calls.length - 1][0] as {
    options: { headerLeft: () => ReactElement; headerRight: () => ReactElement };
  };
  return (
    <>
      {options.headerLeft()}
      {options.headerRight()}
    </>
  );
}

async function renderForm(id?: string) {
  routing.useLocalSearchParams.mockReturnValue(id ? { id } : {});
  return renderWithProviders(<HabitFormScreen />);
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
  routing.router.canGoBack.mockReturnValue(true);
});

afterEach(() => {
  restoreClock();
  jest.restoreAllMocks();
});

describe("the form a new habit opens on", () => {
  it("should open on an empty name, every day, and no reminder", async () => {
    const { container, getByLabelText, queryByLabelText } = await renderForm();

    expect(getByLabelText(habitForm.nameLabel).props.value).toBe("");
    expect(
      getByLabelText(habitForm.daily).props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(reminderIsOn(container)).toBe(false);
    expect(queryByLabelText(habitForm.time)).toBeNull();
  });

  it("should name every control it offers", async () => {
    await renderForm();

    const { getByLabelText } = await renderWithProviders(header());

    expect(getByLabelText(habitForm.add)).toBeTruthy();
    expect(getByLabelText(common.cancel)).toBeTruthy();
  });

  it("should preview the default icon in the default colour", async () => {
    const { container } = await renderForm();

    const preview = symbolView(container, DEFAULT_HABIT_ICON);
    expect(preview.props.tintColor).toBe(DEFAULT_HABIT_COLOR);
    expect(backgroundOf(preview.parent!)).toBe(`${DEFAULT_HABIT_COLOR}26`);
  });

  it("should offer every icon by name", async () => {
    const { getByLabelText } = await renderForm();

    for (const symbol of HABIT_ICONS) {
      expect(getByLabelText(fill(habitForm.iconLabel, { symbol }))).toBeTruthy();
    }
    expect(
      getByLabelText(fill(habitForm.iconLabel, { symbol: DEFAULT_HABIT_ICON }))
        .props.accessibilityState,
    ).toMatchObject({ selected: true });
  });

  it("should not offer to delete a habit that does not exist yet", async () => {
    const { queryByText } = await renderForm();

    expect(queryByText(habitForm.deleteHabit)).toBeNull();
  });

  it("should draw itself in the language the app is set to", async () => {
    await i18n.changeLanguage("pt-BR");

    const { getByLabelText, getByText } = await renderForm();

    const inPortuguese = ptBR.translations.habitForm;
    expect(getByLabelText(inPortuguese.nameLabel)).toBeTruthy();
    expect(getByText(inPortuguese.scheduleSection)).toBeTruthy();

    await fireEvent.press(getByLabelText(inPortuguese.specificDays));

    expect(getByLabelText(ptBR.translations.schedule.monday)).toBeTruthy();
  });
});

describe("the form an existing habit opens on", () => {
  it("should open on the habit's name, icon and colour", async () => {
    const habit = createHabit(
      input({ name: "Read", icon: "book.fill", color: OTHER_COLOR }),
    );

    const { container, getByLabelText } = await renderForm(habit.id);

    expect(getByLabelText(habitForm.nameLabel).props.value).toBe("Read");
    expect(
      getByLabelText(fill(habitForm.iconLabel, { symbol: "book.fill" })).props
        .accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      getByLabelText(fill(habitForm.colorLabel, { color: OTHER_COLOR })).props
        .accessibilityState,
    ).toMatchObject({ selected: true });
    expect(symbolView(container, "book.fill").props.tintColor).toBe(OTHER_COLOR);
  });

  it("should open on the days the habit runs rather than on daily", async () => {
    const habit = createHabit(input({ weekdays: [1, 3, 5] }));

    const { getByLabelText } = await renderForm(habit.id);

    expect(
      getByLabelText(habitForm.specificDays).props.accessibilityState,
    ).toMatchObject({ selected: true });
    for (const [day, name] of WEEKDAY_NAMES.entries()) {
      expect(getByLabelText(name).props.accessibilityState).toMatchObject({
        selected: [1, 3, 5].includes(day),
      });
    }
  });

  it("should open on the reminder the habit carries, set to its time", async () => {
    const habit = createHabit(input({ reminderTime: "07:30" }));

    const { container, getByLabelText } = await renderForm(habit.id);

    expect(reminderIsOn(container)).toBe(true);
    expect(getByLabelText(habitForm.time).props.value).toBe("07:30");
  });

  it("should offer to save rather than to add", async () => {
    const habit = createHabit(input());
    await renderForm(habit.id);

    const { getByLabelText, queryByLabelText } = await renderWithProviders(header());

    expect(getByLabelText(habitForm.save)).toBeTruthy();
    expect(queryByLabelText(habitForm.add)).toBeNull();
  });

  it("should offer to delete the habit", async () => {
    const habit = createHabit(input());

    const { getByText } = await renderForm(habit.id);

    expect(getByText(habitForm.deleteHabit)).toBeTruthy();
  });
});

describe("the colour the form is set to", () => {
  it("should mark the chosen colour and unmark the one before it", async () => {
    const { getByLabelText } = await renderForm();

    await fireEvent.press(
      getByLabelText(fill(habitForm.colorLabel, { color: OTHER_COLOR })),
    );

    expect(
      getByLabelText(fill(habitForm.colorLabel, { color: OTHER_COLOR })).props
        .accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      getByLabelText(fill(habitForm.colorLabel, { color: DEFAULT_HABIT_COLOR }))
        .props.accessibilityState,
    ).toMatchObject({ selected: false });
  });

  it("should check off the chosen colour in a foreground that reads on it", async () => {
    const { container, getByLabelText } = await renderForm();

    await fireEvent.press(
      getByLabelText(fill(habitForm.colorLabel, { color: OTHER_COLOR })),
    );

    expect(symbolView(container, "checkmark").props.tintColor).toBe(
      foregroundOnColor(OTHER_COLOR),
    );
  });

  it("should follow the chosen colour everywhere it is used", async () => {
    const { container, getByLabelText } = await renderForm();

    await fireEvent.press(
      getByLabelText(fill(habitForm.colorLabel, { color: OTHER_COLOR })),
    );

    expect(symbolView(container, DEFAULT_HABIT_ICON).props.tintColor).toBe(
      OTHER_COLOR,
    );
    expect(backgroundOf(getByLabelText(habitForm.daily))).toBe(OTHER_COLOR);
  });
});

describe("the icon the form is set to", () => {
  it("should preview the icon that was chosen", async () => {
    const { container, getByLabelText } = await renderForm();

    await fireEvent.press(getByLabelText("Icon book.fill"));

    expect(symbolView(container, "book.fill").props.tintColor).toBe(
      DEFAULT_HABIT_COLOR,
    );
  });

  it("should mark the chosen icon and unmark the one before it", async () => {
    const { getByLabelText } = await renderForm();

    await fireEvent.press(getByLabelText("Icon book.fill"));

    expect(
      getByLabelText("Icon book.fill").props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      getByLabelText(fill(habitForm.iconLabel, { symbol: DEFAULT_HABIT_ICON }))
        .props.accessibilityState,
    ).toMatchObject({ selected: false });
  });
});

describe("how often the habit runs", () => {
  it("should offer the two frequencies as chips, since Compose has no segmented control", async () => {
    const { getByLabelText } = await renderForm();

    expect(
      getByLabelText(habitForm.daily).props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      getByLabelText(habitForm.specificDays).props.accessibilityState,
    ).toMatchObject({ selected: false });
  });

  it("should keep the days out of the way while the habit is daily", async () => {
    const { queryByLabelText } = await renderForm();

    expect(queryByLabelText("Monday")).toBeNull();
  });

  it("should offer every day, weekdays chosen, once the habit is not daily", async () => {
    const { getByLabelText } = await renderForm();

    await fireEvent.press(getByLabelText(habitForm.specificDays));

    for (const [day, name] of WEEKDAY_NAMES.entries()) {
      expect(getByLabelText(name).props.accessibilityState).toMatchObject({
        selected: WEEKDAYS_ONLY.includes(day),
      });
    }
  });

  it("should fill the day that is chosen with the habit's colour", async () => {
    const { getByLabelText } = await renderForm();
    await fireEvent.press(getByLabelText(habitForm.specificDays));

    await fireEvent.press(getByLabelText("Sunday"));

    expect(backgroundOf(getByLabelText("Sunday"))).toBe(DEFAULT_HABIT_COLOR);
  });

  it("should say so when every day has been taken away", async () => {
    const { getByLabelText, queryByText } = await renderForm();
    await fireEvent.press(getByLabelText(habitForm.specificDays));

    for (const day of WEEKDAYS_ONLY) {
      await fireEvent.press(getByLabelText(WEEKDAY_NAMES[day]));
    }

    expect(queryByText(habitForm.chooseADay)).toBeTruthy();
  });
});

describe("the reminder", () => {
  it("should keep the time out of the way while the reminder is off", async () => {
    const { queryByLabelText } = await renderForm();

    expect(queryByLabelText(habitForm.time)).toBeNull();
  });

  it("should offer a time once the reminder is on", async () => {
    const { container, getByLabelText } = await renderForm();

    await toggleSwitch(reminderSwitch(container), true);

    expect(getByLabelText(habitForm.time).props.value).toBe("09:00");
  });

  it("should take the time away again when the reminder goes off", async () => {
    const { container, queryByLabelText } = await renderForm();
    await toggleSwitch(reminderSwitch(container), true);

    await toggleSwitch(reminderSwitch(container), false);

    expect(queryByLabelText(habitForm.time)).toBeNull();
  });

  it("should keep a time the pattern accepts", async () => {
    const { container, getByLabelText } = await renderForm();
    await toggleSwitch(reminderSwitch(container), true);

    await fireEvent.changeText(getByLabelText(habitForm.time), "07:05");

    expect(getByLabelText(habitForm.time).props.value).toBe("07:05");
    expect(colorOf(getByLabelText(habitForm.time))).toBe(colors.text);
  });

  it("should mark a time the pattern refuses", async () => {
    const { container, getByLabelText } = await renderForm();
    await toggleSwitch(reminderSwitch(container), true);

    await fireEvent.changeText(getByLabelText(habitForm.time), "25:00");

    expect(getByLabelText(habitForm.time).props.value).toBe("25:00");
    expect(colorOf(getByLabelText(habitForm.time))).toBe(colors.destructive);
  });

  it("should save the time that was typed", async () => {
    const { container, getByLabelText } = await renderForm();
    await fireEvent.changeText(getByLabelText(habitForm.nameLabel), "Read");
    await toggleSwitch(reminderSwitch(container), true);
    await fireEvent.changeText(getByLabelText(habitForm.time), "07:05");

    const { getByLabelText: getHeader } = await renderWithProviders(header());
    await fireEvent.press(getHeader(habitForm.add));
    await settle();

    expect(getAppState().habits).toMatchObject([{ reminderTime: "07:05" }]);
  });
});

describe("saving what the form shows", () => {
  it("should refuse the save button while there is nothing to save", async () => {
    await renderForm();

    const { getByLabelText } = await renderWithProviders(header());
    const add = getByLabelText(habitForm.add);
    expect(add.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(add);

    expect(getAppState().habits).toEqual([]);
  });

  it("should refuse the save button while the reminder time is not a time", async () => {
    const { container, getByLabelText } = await renderForm();
    await fireEvent.changeText(getByLabelText(habitForm.nameLabel), "Read");
    await toggleSwitch(reminderSwitch(container), true);

    await fireEvent.changeText(getByLabelText(habitForm.time), "9am");

    const { getByLabelText: getHeader } = await renderWithProviders(header());
    const add = getHeader(habitForm.add);
    expect(add.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(add);
    await settle();

    expect(getAppState().habits).toEqual([]);
  });

  it("should save the habit the form shows when the save button is pressed", async () => {
    const { getByLabelText } = await renderForm();
    await fireEvent.changeText(getByLabelText(habitForm.nameLabel), "Read");
    await fireEvent.press(getByLabelText("Icon book.fill"));
    await fireEvent.press(
      getByLabelText(fill(habitForm.colorLabel, { color: OTHER_COLOR })),
    );

    const { getByLabelText: getHeader } = await renderWithProviders(header());
    await fireEvent.press(getHeader(habitForm.add));
    await settle();

    expect(getAppState().habits).toMatchObject([
      { name: "Read", icon: "book.fill", color: OTHER_COLOR },
    ]);
    expect(routing.router.back).toHaveBeenCalledTimes(1);
  });

  it("should leave the form alone when the cancel button is pressed", async () => {
    const { getByLabelText } = await renderForm();
    await fireEvent.changeText(getByLabelText(habitForm.nameLabel), "Read");

    const { getByLabelText: getHeader } = await renderWithProviders(header());
    await fireEvent.press(getHeader(common.cancel));
    await settle();

    expect(getAppState().habits).toEqual([]);
    expect(routing.router.back).toHaveBeenCalledTimes(1);
  });
});
