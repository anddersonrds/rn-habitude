/* eslint-disable @typescript-eslint/no-require-imports --
the store loads its state at import, so every case reloads it against its own
database, and the hook, the permission boundary and the haptics have to come
from that same registry to be the ones the hook actually calls.
*/
import en from "@/i18n/locales/en";
import type { HabitInput } from "@/lib/types";
import { resetDatabase } from "@/test-utils/sqlite";
import { freezeClock, restoreClock, stableIds } from "@/test-utils/time";
/*
The main entry point switches React into its act environment at import, which a
test body may not do. The renderer itself is taken from `pure`, reloaded with
the store; see `load`.
*/
import "@testing-library/react-native";

jest.mock("@/lib/notifications", () => ({
  /* Reminders are the store's business, and their own tests cover them. */
  scheduleHabitReminders: jest.fn(async () => [] as string[]),
  cancelReminders: jest.fn(async () => {}),
  cancelAllReminders: jest.fn(async () => {}),
  getNotificationPermission: jest.fn(async () => null),
  ensureNotificationPermission: jest.fn(async () => true),
  sendTestNotification: jest.fn(async () => {}),
}));

jest.mock("@/lib/haptics", () => ({
  haptic: {
    selection: jest.fn(),
    tap: jest.fn(),
    impact: jest.fn(),
    rigid: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    checkIn: jest.fn(async () => {}),
    celebrate: jest.fn(async () => {}),
  },
}));

/*
Both version sources are read once, at import, so a case sets them before it
loads the model. The runner's own config carries a placeholder version, which
is why neither can be asserted against the real one.
*/
const mockVersions: { config: string | undefined; native: string | null } = {
  config: "9.9.9",
  native: "8.8.8",
};

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return mockVersions.config ? { version: mockVersions.config } : null;
    },
  },
}));

jest.mock("expo-application", () => ({
  __esModule: true,
  get nativeApplicationVersion() {
    return mockVersions.native;
  },
}));

/*
Reduced motion decides whether the change rides on the fade, and it is a hook
rather than a prop. Reanimated is spread so everything else stays real, and
`__esModule` has to be declared or its default export goes missing.
*/
jest.mock("react-native-reanimated", () => {
  const actual = jest.requireActual("react-native-reanimated");
  return {
    __esModule: true,
    ...actual,
    /*
    On throughout, except where a case says otherwise: `EaseView` never reports
    a transition end under the runner, so a change that waited on one would
    never land.
    */
    useReducedMotion: jest.fn(() => true),
  };
});

jest.mock("expo-router", () => ({
  /* The screen refreshes its permission on focus; here it runs once, on mount. */
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require("react") as typeof import("react");
    useEffect(effect, [effect]);
  },
}));

const TODAY = "2026-07-29";
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

type Permission = {
  granted: boolean;
  canAskAgain: boolean;
};

const settings = en.translations.settings;

const GRANTED: Permission = { granted: true, canAskAgain: false };
const NOT_ASKED: Permission = { granted: false, canAskAgain: true };
const DENIED: Permission = { granted: false, canAskAgain: false };

type StoreModule = typeof import("@/lib/store");
type ModelModule = typeof import("@/components/screens/settings/useSettingsModel");
type HapticsModule = typeof import("@/lib/haptics");
type TestingLibrary = typeof import("@testing-library/react-native/pure");
type AlertButtons = { text: string; style?: string; onPress?: () => void }[];

type Loaded = {
  store: StoreModule;
  i18n: typeof import("@/i18n/i18next");
  switching: typeof import("@/i18n/switching");
  reanimated: { useReducedMotion: jest.Mock };
  useSettingsModel: ModelModule["useSettingsModel"];
  haptic: { [K in keyof HapticsModule["haptic"]]: jest.Mock };
  getPermission: jest.Mock;
  ensurePermission: jest.Mock;
  sendTestNotification: jest.Mock;
  alert: jest.Mock;
  openURL: jest.Mock;
  testingLibrary: TestingLibrary;
};

/** Loads the hook and every boundary it talks to into one fresh registry. */
function load(): Loaded {
  jest.resetModules();
  const { Alert, Linking } =
    require("react-native") as typeof import("react-native");
  const notifications = require("@/lib/notifications");
  /*
  Pinned rather than inherited: the hook reads its settings through this registry,
  and a change to how the device is resolved must not rewrite what these cases
  assert.
  */
  const i18n = require("@/i18n/i18next") as typeof import("@/i18n/i18next");
  void i18n.default.changeLanguage("en");
  return {
    i18n,
    switching: require("@/i18n/switching"),
    reanimated: require("react-native-reanimated"),
    store: require("@/lib/store"),
    useSettingsModel: require("@/components/screens/settings/useSettingsModel")
      .useSettingsModel,
    haptic: require("@/lib/haptics").haptic,
    getPermission: notifications.getNotificationPermission,
    ensurePermission: notifications.ensureNotificationPermission,
    sendTestNotification: notifications.sendTestNotification,
    alert: jest.spyOn(Alert, "alert").mockImplementation(() => {}) as jest.Mock,
    openURL: jest
      .spyOn(Linking, "openURL")
      .mockImplementation(async () => true) as jest.Mock,
    testingLibrary: require("@testing-library/react-native/pure"),
  };
}

/** Lets the fire-and-forget reminder refresh settle before the case goes on. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

function input(overrides: Partial<HabitInput> = {}): HabitInput {
  return {
    name: "Walk outside",
    icon: "figure.walk",
    color: "#32ADE6",
    weekdays: EVERY_DAY,
    reminderTime: null,
    ...overrides,
  };
}

/** Renders the hook with a permission answer already decided. */
async function renderModel(
  permission: Permission | null = null,
  seed: (store: StoreModule) => void = () => {},
) {
  resetDatabase();
  const loaded = load();
  loaded.getPermission.mockResolvedValue(permission);
  seed(loaded.store);
  await settle();

  const { act, renderHook } = loaded.testingLibrary;
  const rendered = await renderHook(() => loaded.useSettingsModel());
  /* The permission is read asynchronously, so let the first read land. */
  await act(async () => settle());
  return { ...loaded, act, ...rendered };
}

function buttonsOf(alert: jest.Mock): AlertButtons {
  return alert.mock.calls[alert.mock.calls.length - 1][2];
}

beforeEach(() => {
  freezeClock(`${TODAY}T12:00:00-03:00`);
  stableIds();
});

afterEach(() => {
  restoreClock();
  jest.restoreAllMocks();
});

describe("what the screen says about notifications", () => {
  it("should say nothing yet while the permission is still being read", async () => {
    resetDatabase();
    const loaded = load();
    /* A promise that never settles: this is the state before the first read. */
    loaded.getPermission.mockReturnValue(new Promise(() => {}));

    const { result, unmount } = await loaded.testingLibrary.renderHook(() =>
      loaded.useSettingsModel(),
    );

    expect(result.current).toMatchObject({
      permissionLabel: settings.permissionPending,
      permissionColor: "secondary",
      canRequestPermission: false,
      canOpenSettings: false,
    });
    await unmount();
  });

  it("should say notifications are allowed", async () => {
    const { result, unmount } = await renderModel(GRANTED);

    expect(result.current).toMatchObject({
      permissionLabel: settings.permissionAllowed,
      permissionColor: "green",
      canRequestPermission: false,
      canOpenSettings: false,
    });
    await unmount();
  });

  it("should offer to ask while iOS would still show the prompt", async () => {
    const { result, unmount } = await renderModel(NOT_ASKED);

    expect(result.current).toMatchObject({
      permissionLabel: settings.permissionNotRequested,
      permissionColor: "secondary",
      canRequestPermission: true,
      canOpenSettings: false,
    });
    await unmount();
  });

  it("should offer iOS Settings once the prompt cannot be shown again", async () => {
    const { result, unmount } = await renderModel(DENIED);

    expect(result.current).toMatchObject({
      permissionLabel: settings.permissionDenied,
      permissionColor: "red",
      canRequestPermission: false,
      canOpenSettings: true,
    });
    await unmount();
  });
});

describe("asking for permission", () => {
  it("should read the answer back after asking", async () => {
    const { act, ensurePermission, getPermission, result, unmount } =
      await renderModel(NOT_ASKED);
    ensurePermission.mockResolvedValue(true);
    getPermission.mockResolvedValue(GRANTED);

    await act(async () => result.current.requestPermission());

    expect(result.current.permissionLabel).toBe(settings.permissionAllowed);
    await unmount();
  });

  it("should celebrate an answer of yes", async () => {
    const { act, ensurePermission, haptic, result, unmount } =
      await renderModel(NOT_ASKED);
    ensurePermission.mockResolvedValue(true);

    await act(async () => result.current.requestPermission());

    expect(haptic.success).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("should stay quiet on an answer of no", async () => {
    const { act, ensurePermission, getPermission, haptic, result, unmount } =
      await renderModel(NOT_ASKED);
    ensurePermission.mockResolvedValue(false);
    getPermission.mockResolvedValue(DENIED);

    await act(async () => result.current.requestPermission());

    expect(haptic.success).not.toHaveBeenCalled();
    expect(result.current.permissionLabel).toBe(settings.permissionDenied);
    await unmount();
  });

  it("should open iOS Settings when that is all that is left", async () => {
    const { act, openURL, result, unmount } = await renderModel(DENIED);

    await act(async () => result.current.openSystemSettings());

    expect(openURL).toHaveBeenCalledWith("app-settings:");
    await unmount();
  });
});

describe("sending a test notification", () => {
  it("should send one and say so", async () => {
    const { act, alert, haptic, result, sendTestNotification, unmount } =
      await renderModel(GRANTED);

    await act(async () => result.current.sendTest());

    expect(sendTestNotification).toHaveBeenCalledTimes(1);
    expect(haptic.impact).toHaveBeenCalledTimes(1);
    expect(alert).toHaveBeenCalledWith(
      settings.testSentTitle,
      settings.testSentBody,
    );
    await unmount();
  });

  it("should send nothing while notifications are off", async () => {
    const { act, alert, ensurePermission, result, sendTestNotification, unmount } =
      await renderModel(DENIED);
    ensurePermission.mockResolvedValue(false);

    await act(async () => result.current.sendTest());

    expect(sendTestNotification).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(
      settings.notificationsOffTitle,
      settings.notificationsOffBody,
      expect.any(Array),
    );
    await unmount();
  });

  it("should offer iOS Settings when it could not send", async () => {
    const { act, alert, ensurePermission, openURL, result, unmount } =
      await renderModel(DENIED);
    ensurePermission.mockResolvedValue(false);
    await act(async () => result.current.sendTest());

    const openSettings = buttonsOf(alert).find(
      (button) => button.text === settings.openSettings,
    );
    await act(async () => openSettings?.onPress?.());

    expect(openURL).toHaveBeenCalledWith("app-settings:");
    await unmount();
  });

  it("should do nothing more when that offer is declined", async () => {
    const { act, alert, ensurePermission, openURL, result, unmount } =
      await renderModel(DENIED);
    ensurePermission.mockResolvedValue(false);
    await act(async () => result.current.sendTest());

    const cancel = buttonsOf(alert).find((button) => button.style === "cancel");
    await act(async () => cancel?.onPress?.());

    expect(openURL).not.toHaveBeenCalled();
    await unmount();
  });
});

describe("loading the sample data", () => {
  it("should load it without asking when there is nothing to lose", async () => {
    const { act, alert, haptic, result, store, unmount } =
      await renderModel(GRANTED);

    await act(async () => result.current.loadSample());
    await settle();

    expect(alert).not.toHaveBeenCalled();
    expect(store.getAppState().habits.length).toBeGreaterThan(0);
    expect(haptic.success).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("should ask before adding to habits that already exist", async () => {
    const { act, alert, result, store, unmount } = await renderModel(
      GRANTED,
      (store) => {
        store.createHabit(input({ name: "Walk outside" }));
      },
    );

    await act(async () => result.current.loadSample());

    expect(alert).toHaveBeenCalledWith(
      settings.loadSampleTitle,
      settings.loadSampleBody,
      expect.any(Array),
    );
    expect(store.getAppState().habits).toHaveLength(1);
    await unmount();
  });

  it("should keep the habits as they are when the confirmation is cancelled", async () => {
    const { act, alert, result, store, unmount } = await renderModel(
      GRANTED,
      (store) => {
        store.createHabit(input({ name: "Walk outside" }));
      },
    );
    await act(async () => result.current.loadSample());

    const cancel = buttonsOf(alert).find((button) => button.style === "cancel");
    await act(async () => cancel?.onPress?.());
    await settle();

    expect(store.getAppState().habits.map((habit) => habit.name)).toEqual([
      "Walk outside",
    ]);
    await unmount();
  });

  it("should keep the habits that were there once the confirmation is taken", async () => {
    const { act, alert, result, store, unmount } = await renderModel(
      GRANTED,
      (store) => {
        store.createHabit(input({ name: "Walk outside" }));
      },
    );
    await act(async () => result.current.loadSample());

    const load = buttonsOf(alert).find((button) => button.text === settings.load);
    await act(async () => load?.onPress?.());
    await settle();

    const names = store.getAppState().habits.map((habit) => habit.name);
    expect(names).toContain("Walk outside");
    expect(names.length).toBeGreaterThan(1);
    await unmount();
  });
});

describe("deleting everything", () => {
  it("should ask before deleting anything", async () => {
    const { act, alert, haptic, result, unmount } = await renderModel(
      GRANTED,
      (store) => {
        store.createHabit(input());
      },
    );

    await act(async () => result.current.deleteEverything());

    expect(alert).toHaveBeenCalledWith(
      settings.deleteAllTitle,
      settings.deleteAllBody,
      expect.any(Array),
    );
    expect(haptic.warning).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("should keep everything when the confirmation is cancelled", async () => {
    const { act, alert, result, store, unmount } = await renderModel(
      GRANTED,
      (store) => {
        const habit = store.createHabit(input({ name: "Walk outside" }));
        store.completeHabit(habit.id, TODAY);
      },
    );
    await act(async () => result.current.deleteEverything());

    const cancel = buttonsOf(alert).find((button) => button.style === "cancel");
    await act(async () => cancel?.onPress?.());
    await settle();

    expect(store.getAppState().habits).toHaveLength(1);
    expect(result.current.totalCheckIns).toBe(1);
    await unmount();
  });

  it("should delete every habit and its history once the confirmation is taken", async () => {
    const { act, alert, result, store, unmount } = await renderModel(
      GRANTED,
      (store) => {
        const habit = store.createHabit(input());
        store.completeHabit(habit.id, TODAY);
      },
    );
    await act(async () => result.current.deleteEverything());

    const remove = buttonsOf(alert).find(
      (button) => button.style === "destructive",
    );
    await act(async () => remove?.onPress?.());
    await settle();

    expect(store.getAppState().habits).toEqual([]);
    expect(result.current).toMatchObject({
      habitCount: 0,
      totalCheckIns: 0,
      hasHabits: false,
    });
    await unmount();
  });
});

describe("what the screen counts", () => {
  it("should count no habits and no check-ins on a fresh install", async () => {
    const { result, unmount } = await renderModel(GRANTED);

    expect(result.current).toMatchObject({
      habitCount: 0,
      totalCheckIns: 0,
      hasHabits: false,
    });
    await unmount();
  });

  it("should count the habits and every check-in across them", async () => {
    const { result, unmount } = await renderModel(GRANTED, (store) => {
      const walk = store.createHabit(input({ name: "Walk outside" }));
      const read = store.createHabit(input({ name: "Read" }));
      store.completeHabit(walk.id, TODAY);
      store.completeHabit(read.id, TODAY);
    });

    expect(result.current).toMatchObject({
      habitCount: 2,
      totalCheckIns: 2,
      hasHabits: true,
    });
    await unmount();
  });

  it("should report the version the bundle was built from", async () => {
    mockVersions.config = "9.9.9";
    mockVersions.native = "8.8.8";

    const { result, unmount } = await renderModel(GRANTED);

    expect(result.current.version).toBe("9.9.9");
    await unmount();
  });

  it("should fall back to the version of the installed binary", async () => {
    mockVersions.config = undefined;
    mockVersions.native = "8.8.8";

    const { result, unmount } = await renderModel(GRANTED);

    expect(result.current.version).toBe("8.8.8");
    await unmount();
  });

  it("should say nothing rather than invent a version that never shipped", async () => {
    mockVersions.config = undefined;
    mockVersions.native = null;

    const { result, unmount } = await renderModel(GRANTED);

    expect(result.current.version).toBe("—");
    await unmount();
  });
});

describe("seeing the onboarding again", () => {
  it("should put the app back before onboarding", async () => {
    const { act, haptic, result, store, unmount } = await renderModel(GRANTED);

    await act(async () => result.current.viewOnboarding());
    await settle();

    expect(store.getAppState().onboarded).toBe(false);
    expect(haptic.impact).toHaveBeenCalledTimes(1);
    await unmount();
  });
});

describe("choosing a language", () => {
  it("should offer the system default first, then the languages by name", async () => {
    const { result, unmount } = await renderModel(GRANTED);

    expect(result.current.languages).toEqual([
      { tag: "device", label: en.translations.language.systemDefault },
      { tag: "en", label: "English" },
      { tag: "pt-BR", label: "Português (Brasil)" },
    ]);
    await unmount();
  });

  it("should start on the device while nothing has been chosen", async () => {
    const { result, unmount } = await renderModel(GRANTED);

    expect(result.current.language).toBe("device");
    await unmount();
  });

  it("should start on the language already stored", async () => {
    resetDatabase();
    const loaded = load();
    loaded.getPermission.mockResolvedValue(GRANTED);
    loaded.i18n.setLanguage("pt-BR");

    const { result, unmount } = await loaded.testingLibrary.renderHook(() =>
      loaded.useSettingsModel(),
    );

    expect(result.current.language).toBe("pt-BR");
    await unmount();
  });

  it("should store and apply the language it is given", async () => {
    const { act, i18n, result, unmount } = await renderModel(GRANTED);

    await act(async () => result.current.chooseLanguage("pt-BR"));

    expect(result.current.language).toBe("pt-BR");
    expect(i18n.getLanguagePreference()).toBe("pt-BR");
    expect(i18n.default.language).toBe("pt-BR");
    await unmount();
  });

  it("should go back to the device when the system default is chosen", async () => {
    const { act, i18n, result, unmount } = await renderModel(GRANTED);
    await act(async () => result.current.chooseLanguage("pt-BR"));

    await act(async () => result.current.chooseLanguage("device"));

    expect(result.current.language).toBe("device");
    expect(i18n.getLanguagePreference()).toBe("device");
    /* The runner's device reports en-US. */
    expect(i18n.default.language).toBe("en");
    await unmount();
  });
});

describe("the fade a language change rides on", () => {
  async function renderSwitch({ reduceMotion }: { reduceMotion: boolean }) {
    resetDatabase();
    const loaded = load();
    loaded.getPermission.mockResolvedValue(GRANTED);
    loaded.reanimated.useReducedMotion.mockReturnValue(reduceMotion);

    const { act, renderHook } = loaded.testingLibrary;
    const rendered = await renderHook(() => ({
      model: loaded.useSettingsModel(),
      fade: loaded.switching.useLanguageSwitch(),
    }));
    return { ...loaded, act, ...rendered };
  }

  it("should hold the change until the fade reports back", async () => {
    const { act, i18n, result, unmount } = await renderSwitch({
      reduceMotion: false,
    });

    await act(async () => result.current.model.chooseLanguage("pt-BR"));

    expect(result.current.fade.visible).toBe(false);
    expect(i18n.getLanguagePreference()).toBe("device");
    expect(i18n.default.language).toBe("en");
    await unmount();
  });

  it("should apply the change and come back once the fade reports", async () => {
    const { act, i18n, result, unmount } = await renderSwitch({
      reduceMotion: false,
    });
    await act(async () => result.current.model.chooseLanguage("pt-BR"));

    await act(async () => result.current.fade.onTransitionEnd());

    expect(result.current.fade.visible).toBe(true);
    expect(i18n.getLanguagePreference()).toBe("pt-BR");
    expect(i18n.default.language).toBe("pt-BR");
    expect(result.current.model.language).toBe("pt-BR");
    await unmount();
  });

  it("should apply the change at once with reduced motion, and play no fade", async () => {
    const { act, i18n, result, unmount } = await renderSwitch({
      reduceMotion: true,
    });

    await act(async () => result.current.model.chooseLanguage("pt-BR"));

    expect(result.current.fade.visible).toBe(true);
    expect(i18n.getLanguagePreference()).toBe("pt-BR");
    expect(i18n.default.language).toBe("pt-BR");
    await unmount();
  });
});
