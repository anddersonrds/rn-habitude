import SettingsScreen from "@/app/(tabs)/settings";
import i18n, { DEVICE, setLanguage } from "@/i18n/i18next";
import en from "@/i18n/locales/en";
import ptBR from "@/i18n/locales/pt-BR";
import { getSetting } from "@/lib/db";
import { createHabit, deleteAllData, getAppState } from "@/lib/store";
import type { HabitInput } from "@/lib/types";
import { accent } from "@/theme/colors";
import { chooseOption, pressButton } from "@/test-utils/native-events";
import { modifier, nativeView, nativeViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { freezeClock, restoreClock, stableIds } from "@/test-utils/time";
import { act } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { TestInstance } from "test-renderer";

/* Reminders are the store's business, and their own tests cover them. */
jest.mock("@/lib/notifications", () => ({
  scheduleHabitReminders: jest.fn(async () => [] as string[]),
  cancelReminders: jest.fn(async () => {}),
  cancelAllReminders: jest.fn(async () => {}),
  getNotificationPermission: jest.fn(async () => null),
  ensureNotificationPermission: jest.fn(async () => true),
  sendTestNotification: jest.fn(async () => {}),
}));

/*
Motion is reduced throughout: the picked language then lands on the press
rather than waiting on a fade the runner never plays. The sequencing itself is
the view model's, and its own suite covers both paths.
*/
jest.mock("react-native-reanimated", () => {
  const actual = jest.requireActual("react-native-reanimated");
  return { __esModule: true, ...actual, useReducedMotion: jest.fn(() => true) };
});

jest.mock("expo-router", () =>
  /* eslint-disable-next-line @typescript-eslint/no-require-imports --
  a mock factory is hoisted above the imports and cannot close over one. */
  require("@/test-utils/expo-router").expoRouterMock(),
);

const notifications = jest.requireMock<{
  getNotificationPermission: jest.Mock;
  sendTestNotification: jest.Mock;
}>("@/lib/notifications");

/* Asserted against the catalog, so a case proves the key rather than the copy. */
const copy = en.translations.settings;
const language = en.translations.language;

const TODAY = "2026-07-29";
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

const GRANTED = { granted: true, canAskAgain: false };
const NOT_ASKED = { granted: false, canAskAgain: true };
const DENIED = { granted: false, canAskAgain: false };

function input(overrides: Partial<HabitInput> = {}): HabitInput {
  return {
    name: "Walk outside",
    icon: "figure.walk",
    color: "#FF9500",
    weekdays: EVERY_DAY,
    reminderTime: null,
    ...overrides,
  };
}

/** Every piece of SwiftUI text the screen drew, in render order. */
function drawnText(container: TestInstance): string[] {
  return nativeViews(container)
    .filter((node) => typeof node.props.text === "string")
    .map((node) => node.props.text as string);
}

/* A settings row is a button that draws its own label as text inside it. */
function settingsButton(container: TestInstance, label: string): TestInstance {
  const found = nativeViews(container).find(
    (node) =>
      typeof node.props.onButtonPress === "function" &&
      node.queryAll((child) => child.props.text === label).length > 0,
  );
  if (!found) throw new Error(`No settings row is labelled "${label}".`);
  return found;
}

/**
 * Found by the handler rather than by its label, since the label is itself
 * translated and moves as soon as a language is picked.
 */
function languagePicker(container: TestInstance): TestInstance {
  const found = nativeViews(container).find(
    (node) => typeof node.props.onSelectionChange === "function",
  );
  if (!found) throw new Error("No row offers a language to pick.");
  return found;
}

/** The languages a picker offers, in the order it draws them. */
function optionsOf(picker: TestInstance): string[] {
  return picker
    .queryAll((node) => typeof node.props.text === "string")
    .map((node) => node.props.text as string);
}

/** The line drawn right after a labelled row, which is that row's value. */
function valueAfter(container: TestInstance, label: string): string {
  const drawn = drawnText(container);
  return drawn[drawn.indexOf(label) + 1];
}

async function renderSettings(permission: unknown = GRANTED) {
  notifications.getNotificationPermission.mockResolvedValue(permission);
  const rendered = await renderWithProviders(<SettingsScreen />);
  /* The permission is read asynchronously, so let the first read land. */
  await act(async () => new Promise((resolve) => setImmediate(resolve)));
  return rendered;
}

beforeEach(async () => {
  /* Pinned rather than inherited: a change to how the device is resolved must
  not rewrite what these cases assert. The preference is a stored row, so it
  outlives the case that wrote it unless it is cleared here. */
  setLanguage(DEVICE);
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

describe("the settings screen", () => {
  it("should render the whole screen", async () => {
    createHabit(input());

    const { toJSON } = await renderSettings();

    expect(toJSON()).toMatchSnapshot();
  });

  it("should draw every row's icon in the app's colour", async () => {
    const { container } = await renderSettings();

    const bell = nativeView(container, "systemName", "bell.fill");
    expect(modifier(bell, "foregroundStyle")).toMatchObject({ color: accent });
  });

  it("should say where the permission stands", async () => {
    const { container } = await renderSettings(GRANTED);

    expect(valueAfter(container, copy.permission)).toBe(copy.permissionAllowed);
  });

  it("should offer to ask while the prompt can still be shown", async () => {
    const { container } = await renderSettings(NOT_ASKED);

    expect(drawnText(container)).toContain(copy.allowNotifications);
    expect(drawnText(container)).not.toContain(copy.openIosSettings);
  });

  it("should offer iOS Settings once the prompt cannot be shown again", async () => {
    const { container } = await renderSettings(DENIED);

    expect(drawnText(container)).toContain(copy.openIosSettings);
    expect(drawnText(container)).not.toContain(copy.allowNotifications);
  });

  it("should send a test notification when that row is pressed", async () => {
    const { container } = await renderSettings(GRANTED);

    await pressButton(settingsButton(container, copy.sendTestNotification));
    await act(async () => new Promise((resolve) => setImmediate(resolve)));

    expect(notifications.sendTestNotification).toHaveBeenCalledTimes(1);
  });

  it("should count the habits and the check-ins", async () => {
    createHabit(input());
    const { container } = await renderSettings();

    expect(valueAfter(container, copy.habits)).toBe("1");
    expect(valueAfter(container, copy.checkIns)).toBe("0");
  });

  it("should put the app back before onboarding when that row is pressed", async () => {
    const { container } = await renderSettings();

    await pressButton(settingsButton(container, copy.viewOnboarding));

    expect(getAppState().onboarded).toBe(false);
  });

  it("should keep the way out of everything hidden while there is nothing to delete", async () => {
    const { container } = await renderSettings();

    expect(() => nativeView(container, "label", copy.deleteAllData)).toThrow(
      copy.deleteAllData,
    );
  });

  it("should offer to delete everything once there is something to delete", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    createHabit(input());
    const { container } = await renderSettings();

    await pressButton(nativeView(container, "label", copy.deleteAllData));

    expect(alert).toHaveBeenCalledWith(
      copy.deleteAllTitle,
      copy.deleteAllBody,
      expect.any(Array),
    );
    expect(getAppState().habits).toHaveLength(1);
  });
});

describe("the language row", () => {
  it("should carry the section's own title as its label", async () => {
    const { container } = await renderSettings();

    expect(languagePicker(container).props.label).toBe(language.title);
  });

  it("should offer the system default first, then the languages by name", async () => {
    const { container } = await renderSettings();

    expect(optionsOf(languagePicker(container))).toEqual([
      language.systemDefault,
      "English",
      "Português (Brasil)",
    ]);
  });

  it("should push a list rather than open a menu", async () => {
    const { container } = await renderSettings();

    expect(modifier(languagePicker(container), "pickerStyle")).toMatchObject({
      style: "navigationLink",
    });
  });

  it("should show the device as the selection until one is chosen", async () => {
    const { container } = await renderSettings();

    expect(languagePicker(container).props.selection).toBe(DEVICE);
  });

  it("should store the language it is given and switch to it", async () => {
    const { container } = await renderSettings();

    await chooseOption(languagePicker(container), "pt-BR");

    expect(getSetting("language")).toBe("pt-BR");
    expect(i18n.language).toBe("pt-BR");
    expect(languagePicker(container).props.selection).toBe("pt-BR");
    /* The screen redraws in the new language without being remounted. */
    expect(languagePicker(container).props.label).toBe(
      ptBR.translations.language.title,
    );
  });

  it("should follow the device again when the system default is chosen", async () => {
    const { container } = await renderSettings();
    await chooseOption(languagePicker(container), "pt-BR");

    await chooseOption(languagePicker(container), DEVICE);

    expect(getSetting("language")).toBe(DEVICE);
    /* The runner's device reports en-US. */
    expect(i18n.language).toBe("en");
  });
});
