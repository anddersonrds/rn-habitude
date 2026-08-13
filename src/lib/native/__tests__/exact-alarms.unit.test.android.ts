import {
  needsExactAlarmAccess,
  openExactAlarmSettings,
} from "@/lib/native/exact-alarms";
import { Linking, Platform } from "react-native";

const EXACT_ALARM_INTENT = "android.settings.REQUEST_SCHEDULE_EXACT_ALARM";

const sendIntent = jest
  .spyOn(Linking, "sendIntent")
  .mockImplementation(async () => {});
const openSettings = jest
  .spyOn(Linking, "openSettings")
  .mockImplementation(async () => {});

/* `Version` is a getter, so it is spied rather than replaced. */
function onApiLevel(level: number): void {
  jest.spyOn(Platform, "Version", "get").mockReturnValue(level);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("needsExactAlarmAccess", () => {
  it("should report the grant exists from Android 12, where the screen was added", () => {
    onApiLevel(31);

    expect(needsExactAlarmAccess()).toBe(true);
  });

  it("should report nothing to ask for below Android 12", () => {
    onApiLevel(30);

    expect(needsExactAlarmAccess()).toBe(false);
  });
});

describe("openExactAlarmSettings", () => {
  it("should open the special access screen", async () => {
    await openExactAlarmSettings();

    expect(sendIntent).toHaveBeenCalledWith(EXACT_ALARM_INTENT);
    expect(openSettings).not.toHaveBeenCalled();
  });

  it("should fall back to the app settings when the vendor ships no such activity", async () => {
    sendIntent.mockRejectedValueOnce(new Error("No Activity found to handle Intent"));

    await openExactAlarmSettings();

    expect(openSettings).toHaveBeenCalled();
  });
});
