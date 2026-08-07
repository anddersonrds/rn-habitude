import { HabitFormScreen } from "@/components/screens/habit-form";
import {
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_ICON,
  HABIT_ICONS,
  WEEKDAY_KEYS,
} from "@/constants/habit-options";
import i18n from "@/i18n/i18next";
import en from "@/i18n/locales/en";
import ptBR from "@/i18n/locales/pt-br";
import { createHabit, deleteAllData, getAppState } from "@/lib/store";
import type { HabitInput } from "@/lib/types";
import { foregroundOnColor } from "@/theme/colors";
import {
  chooseOption,
  pickDate,
  pressButton,
  toggleSwitch,
} from "@/test-utils/native-events";
import { modifier, nativeView, symbolView } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { freezeClock, restoreClock, stableIds } from "@/test-utils/time";
import { fireEvent } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import type { TestInstance } from "test-renderer";

/* Reminders are the store's business, and their own tests cover them. */
jest.mock("@/lib/notifications", () => ({
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

/**
 * Found by its handler rather than by its label, since the label is itself
 * translated and moves as soon as a language is picked.
 */
function frequencyPicker(container: TestInstance): TestInstance {
  const [found] = container.queryAll(
    (node) => typeof node.props.onSelectionChange === "function",
  );
  if (!found) throw new Error("The form draws no frequency control.");
  return found;
}

function reminderSwitch(container: TestInstance): TestInstance {
  const [found] = container.queryAll((node) => node.type === "RCTSwitch");
  if (!found) throw new Error("The form draws no switch.");
  return found;
}

/* The time picker is the one native view carrying a date to show. */
function timePicker(container: TestInstance): TestInstance {
  const [found] = container.queryAll(
    (node) =>
      node.type === "ViewManagerAdapter_ExpoUI" &&
      typeof node.props.onDateChange === "function",
  );
  if (!found) throw new Error("The form draws no date picker.");
  return found;
}

function backgroundOf(node: TestInstance): string | undefined {
  return StyleSheet.flatten(node.props.style)?.backgroundColor;
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
    const { container, getByLabelText, queryByText } = await renderForm();

    expect(getByLabelText(habitForm.nameLabel).props.value).toBe("");
    expect(frequencyPicker(container).props.selection).toBe("daily");
    expect(reminderSwitch(container).props.value).toBe(false);
    expect(queryByText(habitForm.time)).toBeNull();
  });

  it("should name every control it offers", async () => {
    const { getByLabelText } = await renderForm();

    expect(getByLabelText(habitForm.nameLabel)).toBeTruthy();
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
      getByLabelText(fill(habitForm.iconLabel, { symbol: DEFAULT_HABIT_ICON })).props
        .accessibilityState,
    ).toMatchObject({ selected: true });
  });

  it("should not offer to delete a habit that does not exist yet", async () => {
    const { queryByText } = await renderForm();

    expect(queryByText(habitForm.deleteHabit)).toBeNull();
  });

  it("should draw itself in the language the app is set to", async () => {
    await i18n.changeLanguage("pt-BR");

    const { container, getByLabelText, getByText } = await renderForm();

    const inPortuguese = ptBR.translations.habitForm;
    expect(getByLabelText(inPortuguese.nameLabel)).toBeTruthy();
    expect(getByText(inPortuguese.scheduleSection)).toBeTruthy();
    expect(nativeView(container, "text", inPortuguese.daily)).toBeTruthy();

    await chooseOption(frequencyPicker(container), "specific");

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

    const { container, getByLabelText } = await renderForm(habit.id);

    expect(frequencyPicker(container).props.selection).toBe("specific");
    for (const [day, name] of WEEKDAY_NAMES.entries()) {
      expect(getByLabelText(name).props.accessibilityState).toMatchObject({
        selected: [1, 3, 5].includes(day),
      });
    }
  });

  it("should open on the reminder the habit carries, set to its time", async () => {
    const habit = createHabit(input({ reminderTime: "07:30" }));

    const { container, getByText } = await renderForm(habit.id);

    expect(reminderSwitch(container).props.value).toBe(true);
    expect(getByText(habitForm.time)).toBeTruthy();
    const shown = new Date(timePicker(container).props.selection);
    expect([shown.getHours(), shown.getMinutes()]).toEqual([7, 30]);
  });

  it("should offer to save rather than to add", async () => {
    const habit = createHabit(input());

    const { getByLabelText, queryByLabelText } = await renderForm(habit.id);

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
  it("should tint the frequency control with it", async () => {
    const { container } = await renderForm();

    expect(modifier(frequencyPicker(container), "tint")).toMatchObject({
      color: DEFAULT_HABIT_COLOR,
    });
  });

  it("should mark the chosen colour and unmark the one before it", async () => {
    const { getByLabelText } = await renderForm();

    await fireEvent.press(getByLabelText(fill(habitForm.colorLabel, { color: OTHER_COLOR })));

    expect(
      getByLabelText(fill(habitForm.colorLabel, { color: OTHER_COLOR })).props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      getByLabelText(fill(habitForm.colorLabel, { color: DEFAULT_HABIT_COLOR })).props.accessibilityState,
    ).toMatchObject({ selected: false });
  });

  it("should check off the chosen colour in a foreground that reads on it", async () => {
    const { container, getByLabelText } = await renderForm();

    await fireEvent.press(getByLabelText(fill(habitForm.colorLabel, { color: OTHER_COLOR })));

    expect(symbolView(container, "checkmark").props.tintColor).toBe(
      foregroundOnColor(OTHER_COLOR),
    );
  });

  it("should follow the chosen colour everywhere it is used", async () => {
    const { container, getByLabelText } = await renderForm();

    await fireEvent.press(getByLabelText(fill(habitForm.colorLabel, { color: OTHER_COLOR })));

    expect(symbolView(container, DEFAULT_HABIT_ICON).props.tintColor).toBe(
      OTHER_COLOR,
    );
    expect(modifier(frequencyPicker(container), "tint")).toMatchObject({
      color: OTHER_COLOR,
    });
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
      getByLabelText(fill(habitForm.iconLabel, { symbol: DEFAULT_HABIT_ICON })).props.accessibilityState,
    ).toMatchObject({ selected: false });
  });
});

describe("how often the habit runs", () => {
  it("should offer the two frequencies as a segmented control", async () => {
    const { container } = await renderForm();
    const picker = frequencyPicker(container);

    expect(modifier(picker, "pickerStyle")).toMatchObject({
      style: "segmented",
    });
    expect(picker.props.selection).toBe("daily");
    expect(modifier(nativeView(container, "text", habitForm.daily), "tag")).toMatchObject(
      { tag: "daily" },
    );
    expect(modifier(nativeView(container, "text", habitForm.specificDays), "tag")).toMatchObject(
      { tag: "specific" },
    );
  });

  it("should keep the days out of the way while the habit is daily", async () => {
    const { queryByLabelText } = await renderForm();

    expect(queryByLabelText("Monday")).toBeNull();
  });

  it("should offer every day, weekdays chosen, once the habit is not daily", async () => {
    const { container, getByLabelText } = await renderForm();

    await chooseOption(frequencyPicker(container), "specific");

    for (const [day, name] of WEEKDAY_NAMES.entries()) {
      expect(getByLabelText(name).props.accessibilityState).toMatchObject({
        selected: WEEKDAYS_ONLY.includes(day),
      });
    }
  });

  it("should fill the day that is chosen with the habit's colour", async () => {
    const { container, getByLabelText } = await renderForm();
    await chooseOption(frequencyPicker(container), "specific");

    await fireEvent.press(getByLabelText("Sunday"));

    expect(backgroundOf(getByLabelText("Sunday"))).toBe(DEFAULT_HABIT_COLOR);
  });

  it("should say so when every day has been taken away", async () => {
    const { container, getByLabelText, queryByText } = await renderForm();
    await chooseOption(frequencyPicker(container), "specific");

    for (const day of WEEKDAYS_ONLY) {
      await fireEvent.press(getByLabelText(WEEKDAY_NAMES[day]));
    }

    expect(queryByText("Choose at least one day.")).toBeTruthy();
  });
});

describe("the reminder", () => {
  it("should keep the time out of the way while the reminder is off", async () => {
    const { container, queryByText } = await renderForm();

    expect(queryByText(habitForm.time)).toBeNull();
    expect(() => timePicker(container)).toThrow("draws no date picker");
  });

  it("should offer a time once the reminder is on", async () => {
    const { container, getByText } = await renderForm();

    await toggleSwitch(reminderSwitch(container), true);

    expect(getByText(habitForm.time)).toBeTruthy();
    expect(new Date(timePicker(container).props.selection).getHours()).toBe(9);
  });

  it("should show the time that was picked", async () => {
    const { container } = await renderForm();
    await toggleSwitch(reminderSwitch(container), true);

    await pickDate(timePicker(container), new Date(2026, 6, 29, 7, 5));

    const shown = new Date(timePicker(container).props.selection);
    expect([shown.getHours(), shown.getMinutes()]).toEqual([7, 5]);
  });

  it("should take the time away again when the reminder goes off", async () => {
    const { container, queryByText } = await renderForm();
    await toggleSwitch(reminderSwitch(container), true);

    await toggleSwitch(reminderSwitch(container), false);

    expect(queryByText(habitForm.time)).toBeNull();
  });
});

describe("saving what the form shows", () => {
  it("should refuse the toolbar button while there is nothing to save", async () => {
    const { getByLabelText } = await renderForm();

    const add = getByLabelText(habitForm.add);
    expect(add.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(add);

    expect(getAppState().habits).toEqual([]);
  });

  it("should keep the prominent button out of the way until there is something to save", async () => {
    const { container, getByLabelText } = await renderForm();

    expect(() => nativeView(container, "label", habitForm.createHabit)).toThrow(
      habitForm.dismissKeyboard,
    );

    await fireEvent.changeText(getByLabelText(habitForm.nameLabel), "Read");
    expect(nativeView(container, "label", habitForm.createHabit)).toBeTruthy();
  });

  it("should show the prominent button as prominent, tinted, and icon only", async () => {
    const { container, getByLabelText } = await renderForm();
    await fireEvent.changeText(getByLabelText(habitForm.nameLabel), "Read");

    const save = nativeView(container, "label", habitForm.createHabit);
    expect(modifier(save, "buttonStyle")).toMatchObject({
      style: "glassProminent",
    });
    expect(modifier(save, "labelStyle")).toMatchObject({ style: "iconOnly" });
    expect(modifier(save, "tint")).toMatchObject({
      color: DEFAULT_HABIT_COLOR,
    });
  });

  it("should save the habit the form shows when the prominent button is pressed", async () => {
    const { container, getByLabelText } = await renderForm();
    await fireEvent.changeText(getByLabelText(habitForm.nameLabel), "Read");
    await fireEvent.press(getByLabelText("Icon book.fill"));
    await fireEvent.press(getByLabelText(fill(habitForm.colorLabel, { color: OTHER_COLOR })));

    await pressButton(nativeView(container, "label", habitForm.createHabit));
    await settle();

    expect(getAppState().habits).toMatchObject([
      { name: "Read", icon: "book.fill", color: OTHER_COLOR },
    ]);
  });

  it("should save the habit the form shows when the toolbar button is pressed", async () => {
    const { getByLabelText } = await renderForm();
    await fireEvent.changeText(getByLabelText(habitForm.nameLabel), "Read");

    await fireEvent.press(getByLabelText(habitForm.add));
    await settle();

    expect(getAppState().habits).toMatchObject([{ name: "Read" }]);
    expect(routing.router.back).toHaveBeenCalledTimes(1);
  });

  it("should leave the form alone when the cancel button is pressed", async () => {
    const { getByLabelText } = await renderForm();
    await fireEvent.changeText(getByLabelText(habitForm.nameLabel), "Read");

    await fireEvent.press(getByLabelText(common.cancel));
    await settle();

    expect(getAppState().habits).toEqual([]);
    expect(routing.router.back).toHaveBeenCalledTimes(1);
  });
});
