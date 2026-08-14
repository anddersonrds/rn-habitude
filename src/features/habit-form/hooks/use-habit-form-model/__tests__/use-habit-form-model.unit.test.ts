/* eslint-disable @typescript-eslint/no-require-imports --
the store loads its state at import, so every case reloads it against its own
database, and the hook, the router, the permission check and the haptics have to
come from that same registry to be the ones the hook actually calls.
*/
import en from "@/i18n/locales/en";
import type { HabitInput } from "@/lib/domain/types";
import type { ConfirmRequest } from "@/lib/utils/confirmations";
import { resetDatabase } from "@/test-utils/sqlite";
import { freezeClock, restoreClock, stableIds } from "@/test-utils/time";
/*
The main entry point switches React into its act environment at import, which a
test body may not do. The renderer itself is taken from `pure`, reloaded with
the store; see `load`.
*/
import "@testing-library/react-native";

jest.mock("@/lib/native/notifications", () => ({
  /* Reminders are the store's business, and their own tests cover them. */
  scheduleHabitReminders: jest.fn(async () => [] as string[]),
  cancelReminders: jest.fn(async () => {}),
  cancelAllReminders: jest.fn(async () => {}),
  ensureNotificationPermission: jest.fn(async () => true),
}));

jest.mock("@/lib/native/haptics", () => ({
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

jest.mock("expo-router", () => ({
  router: {
    canGoBack: jest.fn(() => true),
    back: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
}));

const habitForm = en.translations.habitForm;
const common = en.translations.common;

/**
 * Fills a catalog template here rather than calling the same `t` the hook
 * calls, so a case still fails when the hook interpolates the wrong value.
 */
function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replace(`{{${name}}}`, `${value}`),
    template,
  );
}

const TODAY = "2026-07-29";
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS_ONLY = [1, 2, 3, 4, 5];
const MONDAY = 1;
const TUESDAY = 2;

type StoreModule = typeof import("@/lib/data/store");
type ModelModule = typeof import("@/features/habit-form/hooks/use-habit-form-model");
type HapticsModule = typeof import("@/lib/native/haptics");
type TestingLibrary = typeof import("@testing-library/react-native/pure");

type Loaded = {
  store: StoreModule;
  useHabitFormModel: ModelModule["useHabitFormModel"];
  haptic: { [K in keyof HapticsModule["haptic"]]: jest.Mock };
  router: { canGoBack: jest.Mock; back: jest.Mock; replace: jest.Mock };
  useLocalSearchParams: jest.Mock;
  ensurePermission: jest.Mock;
  confirm: jest.Mock;
  dismissKeyboard: jest.Mock;
  openSettings: jest.Mock;
  testingLibrary: TestingLibrary;
};

/** Loads the hook and every boundary it talks to into one fresh registry. */
function load(): Loaded {
  jest.resetModules();
  const { Keyboard, Linking } =
    require("react-native") as typeof import("react-native");
  /* The hook translates, so the instance has to be the one in this registry,
  and its language pinned rather than inherited from how the device resolves. */
  const i18n = require("@/i18n/i18next") as typeof import("@/i18n/i18next");
  void i18n.default.changeLanguage("en");
  return {
    store: require("@/lib/data/store"),
    useHabitFormModel: require("@/features/habit-form/hooks/use-habit-form-model")
      .useHabitFormModel,
    haptic: require("@/lib/native/haptics").haptic,
    router: require("expo-router").router,
    useLocalSearchParams: require("expo-router").useLocalSearchParams,
    ensurePermission: require("@/lib/native/notifications").ensureNotificationPermission,
    confirm: jest.fn() as jest.Mock,
    dismissKeyboard: jest
      .spyOn(Keyboard, "dismiss")
      .mockImplementation(() => {}) as jest.Mock,
    openSettings: jest
      .spyOn(Linking, "openSettings")
      .mockImplementation(async () => {}) as jest.Mock,
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

/**
 * Renders the form over a database seeded before its first render. The seed
 * returns the habit being edited, if there is one, so the form opens on it.
 */
async function renderForm(
  seed: (store: StoreModule) => { id: string } | void = () => {},
) {
  resetDatabase();
  const loaded = load();
  const editing = seed(loaded.store);
  loaded.useLocalSearchParams.mockReturnValue(
    editing ? { id: editing.id } : {},
  );
  await settle();

  const { act, renderHook } = loaded.testingLibrary;
  const { result, unmount } = await renderHook(() =>
    loaded.useHabitFormModel(loaded.confirm),
  );
  return { ...loaded, act, result, unmount, editing };
}

/** The last confirmation the model asked for. */
function askedBy(confirm: jest.Mock): ConfirmRequest {
  return confirm.mock.calls[confirm.mock.calls.length - 1][0] as ConfirmRequest;
}

function savedHabit(store: StoreModule) {
  return store.getAppState().habits[0];
}

beforeEach(() => {
  freezeClock(`${TODAY}T12:00:00-03:00`);
  stableIds();
});

afterEach(() => {
  restoreClock();
  jest.restoreAllMocks();
});

describe("the form a new habit opens on", () => {
  it("should open empty, daily, and with no reminder", async () => {
    const { result, unmount } = await renderForm();

    expect(result.current).toMatchObject({
      isEditing: false,
      name: "",
      daily: true,
      frequency: "daily",
      reminderOn: false,
      canSave: false,
    });
    await unmount();
  });

  it("should offer the default icon and colour", async () => {
    const { result, unmount } = await renderForm();

    expect(result.current).toMatchObject({
      icon: "figure.walk",
      color: "#34C759",
    });
    await unmount();
  });

  it("should hold the weekdays it would fall back to when daily is turned off", async () => {
    const { act, result, unmount } = await renderForm();

    await act(async () => result.current.chooseFrequency("specific"));

    expect(result.current.weekdays).toEqual(WEEKDAYS_ONLY);
    await unmount();
  });
});

describe("the form an existing habit opens on", () => {
  it("should open on the habit being edited", async () => {
    const { result, unmount } = await renderForm((store) =>
      store.createHabit(
        input({ name: "Read", icon: "book.fill", color: "#FF3B30" }),
      ),
    );

    expect(result.current).toMatchObject({
      isEditing: true,
      name: "Read",
      icon: "book.fill",
      color: "#FF3B30",
      canSave: true,
    });
    await unmount();
  });

  it("should read a habit scheduled every day as daily", async () => {
    const { result, unmount } = await renderForm((store) =>
      store.createHabit(input({ weekdays: EVERY_DAY })),
    );

    expect(result.current).toMatchObject({ daily: true, frequency: "daily" });
    await unmount();
  });

  it("should read a habit scheduled on some days as specific, and carry those days", async () => {
    const { result, unmount } = await renderForm((store) =>
      store.createHabit(input({ weekdays: [1, 3, 5] })),
    );

    expect(result.current).toMatchObject({
      daily: false,
      frequency: "specific",
      weekdays: [1, 3, 5],
    });
    await unmount();
  });

  it("should turn the habit's reminder time back into a date the picker can show", async () => {
    const { result, unmount } = await renderForm((store) =>
      store.createHabit(input({ reminderTime: "07:30" })),
    );

    expect(result.current.reminderOn).toBe(true);
    expect(result.current.reminderDate.getHours()).toBe(7);
    expect(result.current.reminderDate.getMinutes()).toBe(30);
    await unmount();
  });

  it("should open as a new habit when the id belongs to no habit", async () => {
    const { result, unmount } = await renderForm((store) => {
      store.createHabit(input());
      return { id: "gone" };
    });

    expect(result.current).toMatchObject({ isEditing: false, name: "" });
    await unmount();
  });
});

describe("what makes a habit saveable", () => {
  it("should refuse a habit with no name", async () => {
    const { result, unmount } = await renderForm();

    expect(result.current.canSave).toBe(false);
    await unmount();
  });

  it("should refuse a name that is only whitespace", async () => {
    const { act, result, unmount } = await renderForm();

    await act(async () => result.current.setName("   "));

    expect(result.current.canSave).toBe(false);
    await unmount();
  });

  it("should refuse a named habit with daily off and no day chosen", async () => {
    const { act, result, unmount } = await renderForm();
    await act(async () => result.current.setName("Read"));
    await act(async () => result.current.chooseFrequency("specific"));

    for (const day of WEEKDAYS_ONLY) {
      await act(async () => result.current.toggleWeekday(day));
    }

    expect(result.current.weekdays).toEqual([]);
    expect(result.current.canSave).toBe(false);
    await unmount();
  });

  it("should accept a named habit that keeps at least one day", async () => {
    const { act, result, unmount } = await renderForm();
    await act(async () => result.current.setName("Read"));
    await act(async () => result.current.chooseFrequency("specific"));

    await act(async () => result.current.toggleWeekday(MONDAY));

    expect(result.current.canSave).toBe(true);
    await unmount();
  });
});

describe("saving a new habit", () => {
  it("should create the habit the form describes", async () => {
    const { act, result, store, unmount } = await renderForm();
    await act(async () => result.current.setName("Read"));
    await act(async () => result.current.selectIcon("book.fill"));
    await act(async () => result.current.selectColor("#FF3B30"));

    await act(async () => result.current.save());
    await settle();

    expect(savedHabit(store)).toMatchObject({
      name: "Read",
      icon: "book.fill",
      color: "#FF3B30",
      weekdays: EVERY_DAY,
      reminderTime: null,
    });
    await unmount();
  });

  it("should save the name without the whitespace around it", async () => {
    const { act, result, store, unmount } = await renderForm();
    await act(async () => result.current.setName("  Read  "));

    await act(async () => result.current.save());
    await settle();

    expect(savedHabit(store).name).toBe("Read");
    await unmount();
  });

  it("should save only the days chosen when daily is off", async () => {
    const { act, result, store, unmount } = await renderForm();
    await act(async () => result.current.setName("Read"));
    await act(async () => result.current.chooseFrequency("specific"));
    await act(async () => result.current.toggleWeekday(0));

    await act(async () => result.current.save());
    await settle();

    expect(savedHabit(store).weekdays).toEqual([0, ...WEEKDAYS_ONLY]);
    await unmount();
  });

  it("should save the reminder time only while the reminder is on", async () => {
    const { act, result, store, unmount } = await renderForm();
    await act(async () => result.current.setName("Read"));
    await act(async () => result.current.pickReminderTime(new Date(2026, 6, 29, 7, 5)));

    await act(async () => result.current.save());
    await settle();

    expect(savedHabit(store).reminderTime).toBeNull();
    await unmount();
  });

  it("should save the time the picker was left on", async () => {
    const { act, result, store, unmount } = await renderForm();
    await act(async () => result.current.setName("Read"));
    await act(async () => result.current.toggleReminder(true));
    await act(async () => result.current.pickReminderTime(new Date(2026, 6, 29, 7, 5)));

    await act(async () => result.current.save());
    await settle();

    expect(savedHabit(store).reminderTime).toBe("07:05");
    await unmount();
  });

  it("should save nothing while the form is not saveable", async () => {
    const { act, result, store, unmount } = await renderForm();
    await act(async () => result.current.setName("   "));

    await act(async () => result.current.save());
    await settle();

    expect(store.getAppState().habits).toEqual([]);
    await unmount();
  });

  it("should stay on the form when there was nothing to save", async () => {
    const { act, result, router, unmount } = await renderForm();

    await act(async () => result.current.save());

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
    await unmount();
  });

  it("should leave the form once the habit is saved", async () => {
    const { act, haptic, result, router, unmount } = await renderForm();
    await act(async () => result.current.setName("Read"));

    await act(async () => result.current.save());
    await settle();

    expect(haptic.success).toHaveBeenCalledTimes(1);
    expect(router.back).toHaveBeenCalledTimes(1);
    await unmount();
  });
});

describe("saving an existing habit", () => {
  it("should change the habit rather than create a second one", async () => {
    const { act, result, store, unmount } = await renderForm((store) =>
      store.createHabit(input({ name: "Read" })),
    );
    await act(async () => result.current.setName("Read at night"));

    await act(async () => result.current.save());
    await settle();

    expect(store.getAppState().habits).toHaveLength(1);
    expect(savedHabit(store).name).toBe("Read at night");
    await unmount();
  });

  it("should keep the habit's history", async () => {
    const { act, result, store, unmount } = await renderForm((store) => {
      const habit = store.createHabit(input({ name: "Read" }));
      store.completeHabit(habit.id, TODAY);
      return habit;
    });
    const { id } = savedHabit(store);
    await act(async () => result.current.setName("Read at night"));

    await act(async () => result.current.save());
    await settle();

    expect(store.getAppState().completions[id]).toEqual({ [TODAY]: true });
    await unmount();
  });

  it("should drop the reminder when it is turned off", async () => {
    const { act, result, store, unmount } = await renderForm((store) =>
      store.createHabit(input({ reminderTime: "07:30" })),
    );

    await act(async () => result.current.toggleReminder(false));
    await act(async () => result.current.save());
    await settle();

    expect(savedHabit(store).reminderTime).toBeNull();
    await unmount();
  });
});

describe("turning the reminder on", () => {
  it("should turn it on once notifications are allowed", async () => {
    const { act, ensurePermission, haptic, result, unmount } = await renderForm();
    ensurePermission.mockResolvedValue(true);

    await act(async () => result.current.toggleReminder(true));

    expect(result.current.reminderOn).toBe(true);
    expect(haptic.selection).toHaveBeenCalled();
    await unmount();
  });

  it("should leave it off and offer the system settings when notifications are denied", async () => {
    const { act, confirm, ensurePermission, result, unmount } = await renderForm();
    ensurePermission.mockResolvedValue(false);

    await act(async () => result.current.toggleReminder(true));

    expect(result.current.reminderOn).toBe(false);
    expect(askedBy(confirm)).toMatchObject({
      title: habitForm.notificationsOffTitle,
      body: "Allow notifications in the system settings to add a reminder.",
      confirmLabel: habitForm.openSettings,
      cancelLabel: habitForm.notNow,
    });
    await unmount();
  });

  it("should open the system settings when that is the answer taken", async () => {
    const { act, confirm, ensurePermission, openSettings, result, unmount } =
      await renderForm();
    ensurePermission.mockResolvedValue(false);
    await act(async () => result.current.toggleReminder(true));

    await act(async () => askedBy(confirm).onConfirm?.());

    expect(openSettings).toHaveBeenCalled();
    await unmount();
  });

  it("should leave the reminder off while the offer goes unanswered", async () => {
    const { act, ensurePermission, openSettings, result, unmount } =
      await renderForm();
    ensurePermission.mockResolvedValue(false);
    await act(async () => result.current.toggleReminder(true));

    expect(result.current.reminderOn).toBe(false);
    expect(openSettings).not.toHaveBeenCalled();
    await unmount();
  });

  it("should not ask for permission to turn the reminder off", async () => {
    const { act, ensurePermission, result, unmount } = await renderForm((store) =>
      store.createHabit(input({ reminderTime: "07:30" })),
    );

    await act(async () => result.current.toggleReminder(false));

    expect(result.current.reminderOn).toBe(false);
    expect(ensurePermission).not.toHaveBeenCalled();
    await unmount();
  });
});

describe("choosing how often a habit runs", () => {
  it("should keep the days chosen when the frequency does not change", async () => {
    const { act, haptic, result, unmount } = await renderForm();

    await act(async () => result.current.chooseFrequency("daily"));

    expect(result.current.daily).toBe(true);
    expect(haptic.selection).not.toHaveBeenCalled();
    await unmount();
  });

  it("should add a day that was not chosen", async () => {
    const { act, result, unmount } = await renderForm();
    await act(async () => result.current.chooseFrequency("specific"));

    await act(async () => result.current.toggleWeekday(0));

    expect(result.current.weekdays).toEqual([...WEEKDAYS_ONLY, 0]);
    await unmount();
  });

  it("should take back a day that was chosen", async () => {
    const { act, result, unmount } = await renderForm();
    await act(async () => result.current.chooseFrequency("specific"));

    await act(async () => result.current.toggleWeekday(TUESDAY));

    expect(result.current.weekdays).toEqual([1, 3, 4, 5]);
    await unmount();
  });

  it("should dismiss the keyboard before anything else moves", async () => {
    const { act, dismissKeyboard, result, unmount } = await renderForm();

    await act(async () => result.current.selectIcon("book.fill"));

    expect(dismissKeyboard).toHaveBeenCalled();
    await unmount();
  });
});

describe("deleting the habit being edited", () => {
  it("should ask before deleting anything", async () => {
    const { act, confirm, haptic, result, unmount } = await renderForm((store) =>
      store.createHabit(input({ name: "Read" })),
    );

    await act(async () => result.current.confirmDelete());

    expect(askedBy(confirm)).toMatchObject({
      title: fill(common.deleteHabitTitle, { name: "Read" }),
      body: common.deleteHabitBody,
      destructive: true,
    });
    expect(haptic.warning).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("should keep the habit while the confirmation goes unanswered", async () => {
    const { act, result, router, store, unmount } = await renderForm((store) =>
      store.createHabit(input({ name: "Read" })),
    );
    await act(async () => result.current.confirmDelete());

    expect(store.getAppState().habits).toHaveLength(1);
    expect(router.back).not.toHaveBeenCalled();
    await unmount();
  });

  it("should delete the habit and leave the form once the confirmation is taken", async () => {
    const { act, confirm, result, router, store, unmount } = await renderForm(
      (store) => store.createHabit(input({ name: "Read" })),
    );
    await act(async () => result.current.confirmDelete());

    await act(async () => askedBy(confirm).onConfirm?.());
    await settle();

    expect(store.getAppState().habits).toEqual([]);
    expect(router.back).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("should offer nothing to delete on a habit that does not exist yet", async () => {
    const { act, confirm, result, unmount } = await renderForm();

    await act(async () => result.current.confirmDelete());

    expect(confirm).not.toHaveBeenCalled();
    await unmount();
  });
});

describe("leaving the form", () => {
  it("should go back to where the form was opened from", async () => {
    const { act, result, router, unmount } = await renderForm();
    router.canGoBack.mockReturnValue(true);

    await act(async () => result.current.cancel());

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
    await unmount();
  });

  it("should go to the first tab when there is nowhere to go back to", async () => {
    const { act, result, router, unmount } = await renderForm();
    router.canGoBack.mockReturnValue(false);

    await act(async () => result.current.cancel());

    expect(router.replace).toHaveBeenCalledWith("/");
    expect(router.back).not.toHaveBeenCalled();
    await unmount();
  });

  it("should change nothing on the way out", async () => {
    const { act, result, store, unmount } = await renderForm();
    await act(async () => result.current.setName("Read"));

    await act(async () => result.current.cancel());
    await settle();

    expect(store.getAppState().habits).toEqual([]);
    await unmount();
  });
});
