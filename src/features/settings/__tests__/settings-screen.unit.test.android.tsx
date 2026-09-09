import { SettingsScreen } from "@/features/settings";
import i18n, { DEVICE, setLanguage } from "@/i18n/i18next";
import en from "@/i18n/locales/en";
import ptBR from "@/i18n/locales/pt-br";
import { getSetting } from "@/lib/data/db";
import { createHabit, deleteAllData, getAppState } from "@/lib/data/store";
import type { HabitInput } from "@/lib/domain/types";
import {
  clickCompose,
  pressComposeButton,
  pressMenuItem,
} from "@/test-utils/native-events";
import {
  composeButton,
  nativeView,
  nativeViews,
} from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { freezeClock, restoreClock, stableIds } from "@/test-utils/time";
import { accent, success } from "@/theme";
import { act, fireEvent } from "@testing-library/react-native";
import * as Application from "expo-application";
import { Linking, Platform } from "react-native";
import type { TestInstance } from "test-renderer";

/* Reminders are the store's business, and their own tests cover them. */
jest.mock("@/lib/native/notifications", () => ({
  scheduleHabitReminders: jest.fn(async () => [] as string[]),
  cancelReminders: jest.fn(async () => {}),
  cancelAllReminders: jest.fn(async () => {}),
  getNotificationPermission: jest.fn(async () => null),
  ensureNotificationPermission: jest.fn(async () => true),
  sendTestNotification: jest.fn(async () => {}),
}));

/* Motion is reduced throughout, so a picked language lands on the press instead
of waiting on a fade the runner never plays. */
jest.mock("react-native-reanimated", () => {
  const actual = jest.requireActual("react-native-reanimated");
  return { __esModule: true, ...actual, useReducedMotion: jest.fn(() => true) };
});

jest.mock("react-native-safe-area-context", () => {
  const actual = jest.requireActual("react-native-safe-area-context");
  return {
    __esModule: true,
    ...actual,
    useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
  };
});

jest.mock("expo-router", () =>
  /* eslint-disable-next-line @typescript-eslint/no-require-imports --
  a mock factory is hoisted above the imports and cannot close over one. */
  require("@/test-utils/expo-router").expoRouterMock(),
);

const { useSafeAreaInsets } = jest.requireMock<{
  useSafeAreaInsets: jest.Mock;
}>("react-native-safe-area-context");

const routing = jest.requireMock<{
  Stack: { Screen: jest.Mock };
}>("expo-router");

/** The bar is not in the screen's tree, so this reads what it handed the stack. */
function screenOptions(): { title: string } {
  const [call] = routing.Stack.Screen.mock.calls;
  if (!call) throw new Error("The screen sets no options on the stack.");
  return (call[0] as { options: { title: string } }).options;
}

const notifications = jest.requireMock<{
  getNotificationPermission: jest.Mock;
  ensureNotificationPermission: jest.Mock;
  sendTestNotification: jest.Mock;
}>("@/lib/native/notifications");

const settings = en.translations.settings;
const language = en.translations.language;
const tabs = en.translations.tabs;

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

function drawnText(container: TestInstance): string[] {
  return nativeViews(container)
    .filter((node) => typeof node.props.text === "string")
    .map((node) => node.props.text as string);
}

function settingsRow(container: TestInstance, label: string): TestInstance {
  const found = nativeViews(container).find(
    (node) =>
      ((node.props.modifiers ?? []) as { $type: string }[]).some(
        (entry) => entry.$type === "clickable",
      ) && node.queryAll((child) => child.props.text === label).length > 0,
  );
  if (!found) throw new Error(`No settings row is labelled "${label}".`);
  return found;
}

/** The line drawn right after a labelled row, which is that row's value. */
function valueAfter(container: TestInstance, label: string): string {
  const drawn = drawnText(container);
  return drawn[drawn.indexOf(label) + 1];
}

/** The menu, found by the dismissal only it carries. */
function languageMenu(container: TestInstance): TestInstance {
  const found = nativeViews(container).find(
    (node) => typeof node.props.onDismissRequest === "function",
  );
  if (!found) throw new Error("No row offers a language to pick.");
  return found;
}

function languageOption(container: TestInstance, label: string): TestInstance {
  const found = nativeViews(container).find(
    (node) =>
      typeof node.props.onItemPressed === "function" &&
      node.queryAll((child) => child.props.text === label).length > 0,
  );
  if (!found) throw new Error(`The menu offers no "${label}".`);
  return found;
}

function optionsOf(container: TestInstance): string[] {
  return nativeViews(container)
    .filter((node) => typeof node.props.onItemPressed === "function")
    .map((item) => {
      const [text] = item.queryAll(
        (child) => typeof child.props.text === "string",
      );
      if (!text) throw new Error("A menu item draws no name.");
      return text.props.text as string;
    });
}

/** Found by position: the label is translated and moves once a language is picked. */
function languageRowTexts(container: TestInstance): string[] {
  const [row] = nativeViews(container).filter((node) =>
    ((node.props.modifiers ?? []) as { $type: string }[]).some(
      (entry) => entry.$type === "clickable",
    ),
  );
  if (!row) throw new Error("No row offers a language to pick.");
  return row
    .queryAll((child) => typeof child.props.text === "string")
    .map((node) => node.props.text as string);
}

/** The section labels, which carry the one typography only they use. */
function sectionLabels(container: TestInstance): string[] {
  return nativeViews(container)
    .filter((node) => node.props.typography === "labelLarge")
    .map((node) => node.props.text as string);
}

/* `Version` is a getter, so it is spied rather than assigned. */
function onApiLevel(level: number): void {
  jest.spyOn(Platform, "Version", "get").mockReturnValue(level);
}

async function renderSettings(permission: unknown = GRANTED) {
  notifications.getNotificationPermission.mockResolvedValue(permission);
  const rendered = await renderWithProviders(<SettingsScreen />);
  /* The permission is read asynchronously, so let the first read land. */
  await act(async () => new Promise((resolve) => setImmediate(resolve)));
  return rendered;
}

beforeEach(async () => {
  useSafeAreaInsets.mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 });
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
  it("should label its sections in order, since Compose has no Section", async () => {
    const { container } = await renderSettings();

    expect(sectionLabels(container)).toEqual([
      language.title,
      settings.notifications,
      settings.data,
      settings.about,
    ]);
  });

  it("should end its content clear of the tab bar and the gesture inset", async () => {
    useSafeAreaInsets.mockReturnValue({ top: 0, bottom: 24, left: 0, right: 0 });

    const { container } = await renderSettings();
    const list = nativeViews(container).find(
      (node) => node.props.contentPadding !== undefined,
    );

    expect(list?.props.contentPadding).toMatchObject({ bottom: 80 + 24 });
  });

  it("should draw every section's rows", async () => {
    createHabit(input());

    const { container } = await renderSettings();
    const drawn = drawnText(container);

    expect(drawn).toEqual(
      expect.arrayContaining([
        settings.permission,
        settings.sendTestNotification,
        settings.loadSampleData,
        settings.viewOnboarding,
        settings.habits,
        settings.checkIns,
        settings.version,
      ]),
    );
  });

  /* The runner's config declares no version, so the model falls back here. */
  it("should show the version the app is running", async () => {
    const { container } = await renderSettings();

    expect(valueAfter(container, settings.version)).toBe(
      Application.nativeApplicationVersion,
    );
  });

  it("should draw every row's icon in the app's colour", async () => {
    const { container } = await renderSettings();

    const icons = nativeViews(container).filter(
      (node) => node.props.source !== undefined,
    );
    expect(icons.length).toBeGreaterThan(0);
    expect(icons.every((icon) => icon.props.tint === accent)).toBe(true);
  });

  it("should say where the permission stands, in the colour of that state", async () => {
    const { container } = await renderSettings(GRANTED);

    expect(valueAfter(container, settings.permission)).toBe(
      settings.permissionAllowed,
    );
    expect(nativeView(container, "text", settings.permissionAllowed).props.color)
      .toBe(success);
  });

  it("should mark a refused permission as the one state that is a problem", async () => {
    const { container } = await renderSettings(DENIED);

    expect(nativeView(container, "text", settings.permissionDenied).props.color)
      .not.toBe(success);
  });

  it("should ask for the permission when that row is pressed", async () => {
    const { container } = await renderSettings(NOT_ASKED);

    await clickCompose(settingsRow(container, settings.allowNotifications));
    await act(async () => new Promise((resolve) => setImmediate(resolve)));

    expect(notifications.ensureNotificationPermission).toHaveBeenCalledTimes(1);
  });

  it("should offer to ask while the prompt can still be shown", async () => {
    const { container } = await renderSettings(NOT_ASKED);

    expect(drawnText(container)).toContain(settings.allowNotifications);
    expect(drawnText(container)).not.toContain(settings.openSettings);
  });

  it("should offer the system settings once the prompt cannot be shown again", async () => {
    const { container } = await renderSettings(DENIED);

    expect(drawnText(container)).toContain(settings.openSettings);
    expect(drawnText(container)).not.toContain(settings.allowNotifications);
  });

  it("should send a test notification when that row is pressed", async () => {
    const { container } = await renderSettings(GRANTED);

    await clickCompose(settingsRow(container, settings.sendTestNotification));
    await act(async () => new Promise((resolve) => setImmediate(resolve)));

    expect(notifications.sendTestNotification).toHaveBeenCalledTimes(1);
  });

  it("should leave out the exact alarm row where there is no grant to ask for", async () => {
    onApiLevel(30);

    const { container } = await renderSettings(GRANTED);

    expect(drawnText(container)).not.toContain(settings.exactAlarms);
  });

  it("should open the special access screen from the exact alarm row", async () => {
    onApiLevel(31);
    const sendIntent = jest
      .spyOn(Linking, "sendIntent")
      .mockImplementation(async () => {});

    const { container } = await renderSettings(GRANTED);
    await clickCompose(settingsRow(container, settings.exactAlarms));
    await act(async () => new Promise((resolve) => setImmediate(resolve)));

    expect(sendIntent).toHaveBeenCalledWith(
      "android.settings.REQUEST_SCHEDULE_EXACT_ALARM",
    );
  });

  it("should count the habits and the check-ins", async () => {
    createHabit(input());
    const { container } = await renderSettings();

    expect(valueAfter(container, settings.habits)).toBe("1");
    expect(valueAfter(container, settings.checkIns)).toBe("0");
  });

  it("should load the sample data when that row is pressed", async () => {
    const { container } = await renderSettings();

    await clickCompose(settingsRow(container, settings.loadSampleData));

    expect(getAppState().habits.length).toBeGreaterThan(0);
  });

  it("should put the app back before onboarding when that row is pressed", async () => {
    const { container } = await renderSettings();

    await clickCompose(settingsRow(container, settings.viewOnboarding));

    expect(getAppState().onboarded).toBe(false);
  });

  it("should keep the way out of everything hidden while there is nothing to delete", async () => {
    const { container } = await renderSettings();

    expect(() => composeButton(container, settings.deleteAllData)).toThrow();
  });

  it("should offer to delete everything once there is something to delete", async () => {
    createHabit(input());
    const { container } = await renderSettings();

    await pressComposeButton(composeButton(container, settings.deleteAllData));

    expect(nativeView(container, "text", settings.deleteAllTitle)).toBeTruthy();
    expect(nativeView(container, "text", settings.deleteAllBody)).toBeTruthy();
    expect(getAppState().habits).toHaveLength(1);
  });
});

describe("the language row", () => {
  it("should carry the section's own title as its label", async () => {
    const { container } = await renderSettings();

    expect(languageRowTexts(container)[0]).toBe(language.title);
  });

  it("should offer the system default first, then the languages by name", async () => {
    const { container } = await renderSettings();

    expect(optionsOf(container)).toEqual([
      language.systemDefault,
      "Deutsch",
      "English",
      "Español",
      "Français",
      "Português (Brasil)",
      "한국어",
      "中文（简体）",
      "日本語",
    ]);
  });

  it("should stay closed until the row is pressed", async () => {
    const { container } = await renderSettings();

    expect(languageMenu(container).props.expanded).toBe(false);

    await clickCompose(settingsRow(container, language.title));

    expect(languageMenu(container).props.expanded).toBe(true);
  });

  it("should close without changing anything when it is dismissed", async () => {
    const { container } = await renderSettings();
    await clickCompose(settingsRow(container, language.title));

    await fireEvent(languageMenu(container), "dismissRequest");

    expect(languageMenu(container).props.expanded).toBe(false);
    expect(getSetting("language")).toBe(DEVICE);
  });

  it("should show the device as the selection until one is chosen", async () => {
    const { container } = await renderSettings();

    expect(languageRowTexts(container)[1]).toBe(language.systemDefault);
  });

  it("should store the language it is given and switch to it", async () => {
    const { container } = await renderSettings();

    await pressMenuItem(languageOption(container, "Português (Brasil)"));

    expect(getSetting("language")).toBe("pt-BR");
    expect(i18n.language).toBe("pt-BR");
    /* The screen redraws in the new language without being remounted. */
    expect(languageRowTexts(container)[0]).toBe(ptBR.translations.language.title);
  });
});

describe("the screen's own title", () => {
  it("should leave the bar without a title of its own", async () => {
    await renderSettings();

    expect(screenOptions().title).toBe("");
  });

  it("should draw the title in the content", async () => {
    const { container } = await renderSettings();

    expect(nativeView(container, "text", tabs.settings)).toBeTruthy();
  });
});
