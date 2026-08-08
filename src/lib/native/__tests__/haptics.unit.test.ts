import { haptic } from "@/lib/native/haptics";
import * as Haptics from "expo-haptics";

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Rigid: "rigid",
    Soft: "soft",
  },
  NotificationFeedbackType: { Success: "success", Warning: "warning" },
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
}));

const haptics = jest.mocked(Haptics);

/** The impact styles played so far, in the order they were played. */
function impacts(): string[] {
  return haptics.impactAsync.mock.calls.map(([style]) => String(style));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("the single beat helpers", () => {
  it("should play a selection for a selection", () => {
    haptic.selection();
    expect(haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it("should play a light impact for a tap", () => {
    haptic.tap();
    expect(impacts()).toEqual(["light"]);
  });

  it("should play a medium impact for an impact", () => {
    haptic.impact();
    expect(impacts()).toEqual(["medium"]);
  });

  it("should play a rigid impact for a rigid beat", () => {
    haptic.rigid();
    expect(impacts()).toEqual(["rigid"]);
  });

  it("should play a success notification for a success", () => {
    haptic.success();
    expect(haptics.notificationAsync).toHaveBeenCalledWith("success");
  });

  it("should play a warning notification for a warning", () => {
    haptic.warning();
    expect(haptics.notificationAsync).toHaveBeenCalledWith("warning");
  });
});

describe("the patterned helpers", () => {
  /*
  These space their beats with `setTimeout`, so the timers are faked here
  rather than through the shared clock helper, which deliberately leaves them
  running.
  */
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("should play a check in as a rigid beat followed by a lighter one", async () => {
    const played = haptic.checkIn();

    await jest.advanceTimersByTimeAsync(0);
    expect(impacts()).toEqual(["rigid"]);

    await jest.advanceTimersByTimeAsync(70);
    await played;
    expect(impacts()).toEqual(["rigid", "light"]);
  });

  it("should play a celebration as three beats that rise", async () => {
    const played = haptic.celebrate();

    await jest.advanceTimersByTimeAsync(0);
    expect(impacts()).toEqual(["soft"]);

    await jest.advanceTimersByTimeAsync(120);
    expect(impacts()).toEqual(["soft", "medium"]);
    expect(haptics.notificationAsync).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(120);
    await played;
    expect(impacts()).toEqual(["soft", "medium"]);
    expect(haptics.notificationAsync).toHaveBeenCalledWith("success");
  });

  it("should not replay a check in that already finished", async () => {
    await jest.advanceTimersByTimeAsync(0);
    const played = haptic.checkIn();
    await jest.advanceTimersByTimeAsync(70);
    await played;

    await jest.advanceTimersByTimeAsync(1000);

    expect(impacts()).toHaveLength(2);
  });
});
