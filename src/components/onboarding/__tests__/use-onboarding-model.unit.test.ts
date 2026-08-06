/* eslint-disable @typescript-eslint/no-require-imports --
the store loads its state at import, so every case reloads it against its own
database, and the hook has to come from that same registry to be the one being
driven.
*/
import en from "@/i18n/locales/en";
import { resetDatabase } from "@/test-utils/sqlite";
import type * as Notifications from "expo-notifications";
/*
The main entry point switches React into its act environment at import, which a
test body may not do. The renderer itself is taken from `pure`, reloaded with
the store; see `load`.
*/
import "@testing-library/react-native";

type PermissionState = Notifications.NotificationPermissionsStatus;

/*
Built once, outside the factories, so the same mocks survive the registry reset
each case does. A factory would hand every reload a fresh set and the
assertions would be looking at the wrong one.
*/
const mockNotifications = {
  getNotificationPermission: jest.fn(async () => UNDETERMINED),
  ensureNotificationPermission: jest.fn(async () => true),
  scheduleHabitReminders: jest.fn(async () => [] as string[]),
  cancelReminders: jest.fn(async () => {}),
  cancelAllReminders: jest.fn(async () => {}),
};

const mockHaptic = {
  selection: jest.fn(),
  tap: jest.fn(),
  impact: jest.fn(),
  rigid: jest.fn(),
  success: jest.fn(),
  warning: jest.fn(),
  checkIn: jest.fn(async () => {}),
  celebrate: jest.fn(async () => {}),
};

const mockUseReducedMotion = jest.fn(() => false);

jest.mock("@/lib/notifications", () => mockNotifications);
jest.mock("@/lib/haptics", () => ({ haptic: mockHaptic }));
/* The hook reads one hook out of Reanimated and renders nothing. */
jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  useReducedMotion: mockUseReducedMotion,
}));

function permissionState(
  granted: boolean,
  canAskAgain: boolean,
): PermissionState {
  return {
    granted,
    canAskAgain,
    status: granted ? "granted" : "denied",
    expires: "never",
  } as PermissionState;
}

const onboarding = en.translations.onboarding;

const UNDETERMINED = {
  granted: false,
  canAskAgain: true,
  status: "undetermined",
  expires: "never",
} as PermissionState;
const ALLOWED = permissionState(true, true);
const REFUSED = permissionState(false, true);
const REFUSED_FOR_GOOD = permissionState(false, false);

type StoreModule = typeof import("@/lib/store");
type ModelModule = typeof import("@/components/onboarding/useOnboardingModel");
type TestingLibrary = typeof import("@testing-library/react-native/pure");

/** Loads the hook and the store it finishes onboarding through together. */
function load() {
  jest.resetModules();
  /* The hook translates, so the instance has to be the one in this registry,
  and its language pinned rather than inherited from how the device resolves. */
  const i18n = require("@/i18n/i18next") as typeof import("@/i18n/i18next");
  void i18n.default.changeLanguage("en");
  return {
    store: require("@/lib/store") as StoreModule,
    useOnboardingModel: (
      require("@/components/onboarding/useOnboardingModel") as ModelModule
    ).useOnboardingModel,
    testingLibrary: require("@testing-library/react-native/pure") as TestingLibrary,
  };
}

/** Lets a fire-and-forget promise settle before the case goes on. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

async function renderModel() {
  resetDatabase();
  const loaded = load();
  await settle();

  const { act, renderHook } = loaded.testingLibrary;
  const { result, unmount } = await renderHook(() => loaded.useOnboardingModel());

  /** One step forward, transition included, the way the flow drives it. */
  async function next(): Promise<void> {
    await act(async () => {
      await result.current.advance();
    });
    await act(async () => result.current.handleTransitionEnd());
    await settle();
  }

  /** The last step, where the permission request lives. */
  async function goToLastStep(): Promise<void> {
    while (!result.current.isLast) await next();
  }

  return { ...loaded, act, result, unmount, next, goToLastStep };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseReducedMotion.mockReturnValue(false);
  mockNotifications.getNotificationPermission.mockResolvedValue(UNDETERMINED);
  mockNotifications.ensureNotificationPermission.mockResolvedValue(true);
});

describe("the step being shown", () => {
  it("should open on the first step", async () => {
    const { result, unmount } = await renderModel();

    expect(result.current).toMatchObject({
      stepNumber: 1,
      currentIndex: 0,
      isLast: false,
      canGoBack: false,
    });
    expect(result.current.step.id).toBe("welcome");
    await unmount();
  });

  it("should count the steps there are rather than a number of its own", async () => {
    const { result, unmount } = await renderModel();
    const { STEP_COUNT } =
      require("@/components/onboarding/useOnboardingModel") as ModelModule;

    expect(result.current.stepCount).toBe(STEP_COUNT);
    await unmount();
  });

  it("should reach the last step by advancing through the ones before it", async () => {
    const { result, next, unmount } = await renderModel();

    await next();

    expect(result.current).toMatchObject({ stepNumber: 2, canGoBack: true });
    expect(result.current.step.id).toBe("consistency");

    await next();

    expect(result.current).toMatchObject({ stepNumber: 3, isLast: true });
    expect(result.current.step.id).toBe("reminders");
    await unmount();
  });

  it("should go back to the step before it", async () => {
    const { act, result, next, unmount } = await renderModel();
    await next();

    await act(async () => result.current.goBack());
    await act(async () => result.current.handleTransitionEnd());

    expect(result.current.step.id).toBe("welcome");
    await unmount();
  });

  it("should stay put when there is nothing behind the first step", async () => {
    const { act, result, unmount } = await renderModel();

    await act(async () => result.current.goBack());
    await act(async () => result.current.handleTransitionEnd());

    expect(result.current).toMatchObject({ stepNumber: 1, visible: true });
    expect(result.current.step.id).toBe("welcome");
    await unmount();
  });

  it("should fire the tap haptic on the way forward", async () => {
    const { result, next, unmount } = await renderModel();

    await next();

    expect(mockHaptic.tap).toHaveBeenCalledTimes(1);
    expect(result.current.step.id).toBe("consistency");
    await unmount();
  });
});

describe("the transition between steps", () => {
  it("should hold the step back until the one on screen has left", async () => {
    const { act, result, unmount } = await renderModel();

    await act(async () => {
      await result.current.advance();
    });

    expect(result.current).toMatchObject({ visible: false, stepNumber: 1 });

    await act(async () => result.current.handleTransitionEnd());

    expect(result.current).toMatchObject({ visible: true, stepNumber: 2 });
    await unmount();
  });

  it("should ignore a transition that ends with nothing waiting", async () => {
    const { act, result, unmount } = await renderModel();

    await act(async () => result.current.handleTransitionEnd());

    expect(result.current).toMatchObject({ visible: true, stepNumber: 1 });
    await unmount();
  });

  it("should change step outright when motion is reduced", async () => {
    mockUseReducedMotion.mockReturnValue(true);
    const { act, result, unmount } = await renderModel();

    await act(async () => {
      await result.current.advance();
    });

    expect(result.current).toMatchObject({ visible: true, stepNumber: 2 });
    await unmount();
  });

  it("should report reduced motion so the flow can render without a transition", async () => {
    mockUseReducedMotion.mockReturnValue(true);
    const { result, unmount } = await renderModel();

    expect(result.current.reduceMotion).toBe(true);
    await unmount();
  });
});

describe("what the button says", () => {
  it("should carry the step's own call to action before the last step", async () => {
    const { result, unmount } = await renderModel();

    expect(result.current.ctaLabel).toBe(onboarding.welcomeCta);
    await unmount();
  });

  it("should offer to ask for notifications on the last step", async () => {
    const { result, goToLastStep, unmount } = await renderModel();

    await goToLastStep();

    expect(result.current.ctaLabel).toBe(onboarding.remindersCta);
    await unmount();
  });

  it("should offer to start tracking once notifications are allowed", async () => {
    mockNotifications.getNotificationPermission.mockResolvedValue(ALLOWED);
    const { result, goToLastStep, unmount } = await renderModel();

    await goToLastStep();

    expect(result.current).toMatchObject({
      ctaLabel: onboarding.startTracking,
      permissionGranted: true,
    });
    await unmount();
  });

  it("should offer to move on when notifications can no longer be asked for", async () => {
    mockNotifications.getNotificationPermission.mockResolvedValue(
      REFUSED_FOR_GOOD,
    );
    const { result, goToLastStep, unmount } = await renderModel();

    await goToLastStep();

    expect(result.current.ctaLabel).toBe(onboarding.maybeLater);
    await unmount();
  });

  it("should say it is asking while the request is in flight", async () => {
    let allow = (_granted: boolean) => {};
    mockNotifications.ensureNotificationPermission.mockReturnValue(
      new Promise<boolean>((resolve) => {
        allow = resolve;
      }),
    );
    const { act, result, goToLastStep, unmount } = await renderModel();
    await goToLastStep();

    let pressed: Promise<void> | undefined;
    await act(async () => {
      pressed = result.current.advance();
    });

    expect(result.current).toMatchObject({
      ctaLabel: onboarding.requesting,
      requesting: true,
    });

    await act(async () => {
      allow(true);
      await pressed;
    });

    expect(result.current.requesting).toBe(false);
    await unmount();
  });
});

describe("asking for notifications", () => {
  it("should ask when the last step's button is pressed", async () => {
    const { act, result, goToLastStep, unmount } = await renderModel();
    await goToLastStep();

    await act(async () => {
      await result.current.advance();
    });

    expect(mockNotifications.ensureNotificationPermission).toHaveBeenCalledTimes(
      1,
    );
    await unmount();
  });

  it("should not ask before the last step", async () => {
    const { result, next, unmount } = await renderModel();

    await next();

    expect(mockNotifications.ensureNotificationPermission).not.toHaveBeenCalled();
    expect(result.current.step.id).toBe("consistency");
    await unmount();
  });

  it("should show notifications as allowed rather than finish on the same press", async () => {
    mockNotifications.ensureNotificationPermission.mockResolvedValue(true);
    const { act, result, store, goToLastStep, unmount } = await renderModel();
    await goToLastStep();
    mockNotifications.getNotificationPermission.mockResolvedValue(ALLOWED);

    await act(async () => {
      await result.current.advance();
    });

    expect(result.current.permissionGranted).toBe(true);
    expect(store.getAppState().onboarded).toBe(false);
    await unmount();
  });

  it("should finish onboarding on the press after notifications are allowed", async () => {
    const { act, result, store, goToLastStep, unmount } = await renderModel();
    await goToLastStep();
    mockNotifications.getNotificationPermission.mockResolvedValue(ALLOWED);
    await act(async () => {
      await result.current.advance();
    });

    await act(async () => {
      await result.current.advance();
    });

    expect(store.getAppState().onboarded).toBe(true);
    expect(mockNotifications.ensureNotificationPermission).toHaveBeenCalledTimes(
      1,
    );
    await unmount();
  });

  it("should finish onboarding even when notifications are refused", async () => {
    mockNotifications.ensureNotificationPermission.mockResolvedValue(false);
    const { act, result, store, goToLastStep, unmount } = await renderModel();
    await goToLastStep();
    mockNotifications.getNotificationPermission.mockResolvedValue(REFUSED);

    await act(async () => {
      await result.current.advance();
    });

    expect(store.getAppState().onboarded).toBe(true);
    await unmount();
  });

  it("should finish onboarding without asking when notifications are already allowed", async () => {
    mockNotifications.getNotificationPermission.mockResolvedValue(ALLOWED);
    const { act, result, store, goToLastStep, unmount } = await renderModel();
    await goToLastStep();

    await act(async () => {
      await result.current.advance();
    });

    expect(mockNotifications.ensureNotificationPermission).not.toHaveBeenCalled();
    expect(store.getAppState().onboarded).toBe(true);
    await unmount();
  });

  it("should finish onboarding without asking when it can no longer be asked", async () => {
    mockNotifications.getNotificationPermission.mockResolvedValue(
      REFUSED_FOR_GOOD,
    );
    const { act, result, store, goToLastStep, unmount } = await renderModel();
    await goToLastStep();

    await act(async () => {
      await result.current.advance();
    });

    expect(mockNotifications.ensureNotificationPermission).not.toHaveBeenCalled();
    expect(store.getAppState().onboarded).toBe(true);
    await unmount();
  });

  it("should ask once however many times the button is pressed", async () => {
    let allow = (_granted: boolean) => {};
    mockNotifications.ensureNotificationPermission.mockReturnValue(
      new Promise<boolean>((resolve) => {
        allow = resolve;
      }),
    );
    const { act, result, goToLastStep, unmount } = await renderModel();
    await goToLastStep();

    let pressed: Promise<void> | undefined;
    await act(async () => {
      pressed = result.current.advance();
    });
    await act(async () => {
      await result.current.advance();
    });
    await act(async () => {
      allow(false);
      await pressed;
    });

    expect(mockNotifications.ensureNotificationPermission).toHaveBeenCalledTimes(
      1,
    );
    await unmount();
  });
});

describe("skipping notifications", () => {
  it("should offer to skip only on the last step", async () => {
    const { result, next, goToLastStep, unmount } = await renderModel();

    expect(result.current.canSkip).toBe(false);
    await next();
    expect(result.current.canSkip).toBe(false);

    await goToLastStep();

    expect(result.current.canSkip).toBe(true);
    await unmount();
  });

  it("should stop offering to skip once notifications are allowed", async () => {
    mockNotifications.getNotificationPermission.mockResolvedValue(ALLOWED);
    const { result, goToLastStep, unmount } = await renderModel();

    await goToLastStep();

    expect(result.current.canSkip).toBe(false);
    await unmount();
  });

  it("should finish onboarding without asking for anything", async () => {
    const { act, result, store, goToLastStep, unmount } = await renderModel();
    await goToLastStep();

    await act(async () => result.current.skip());

    expect(store.getAppState().onboarded).toBe(true);
    expect(mockNotifications.ensureNotificationPermission).not.toHaveBeenCalled();
    await unmount();
  });

  it("should fire the tap haptic on the way out", async () => {
    const { act, result, goToLastStep, unmount } = await renderModel();
    await goToLastStep();
    jest.clearAllMocks();

    await act(async () => result.current.skip());

    expect(mockHaptic.tap).toHaveBeenCalledTimes(1);
    await unmount();
  });
});

describe("finishing onboarding", () => {
  it("should leave the flag alone until the flow is finished", async () => {
    const { result, store, goToLastStep, unmount } = await renderModel();

    await goToLastStep();

    expect(result.current.isLast).toBe(true);
    expect(store.getAppState().onboarded).toBe(false);
    await unmount();
  });

  it("should mark the app onboarded so the root layout stops showing the flow", async () => {
    mockNotifications.ensureNotificationPermission.mockResolvedValue(false);
    const { act, result, store, goToLastStep, unmount } = await renderModel();
    await goToLastStep();

    await act(async () => {
      await result.current.advance();
    });

    expect(store.getAppState().onboarded).toBe(true);
    expect(mockHaptic.success).toHaveBeenCalledTimes(1);
    await unmount();
  });
});
