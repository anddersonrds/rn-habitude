import SettingsScreen from "@/app/(tabs)/settings";
import i18n from "@/i18n/i18next";
import en from "@/i18n/locales/en";
import { createHabit, deleteAllData, getAppState } from "@/lib/store";
import type { HabitInput } from "@/lib/types";
import { accent } from "@/theme/colors";
import { pressButton } from "@/test-utils/native-events";
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
  not rewrite what these cases assert. */
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
      "none",
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
