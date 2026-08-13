import { Linking, Platform } from "react-native";

/** Android 12, where exact alarms moved behind a special access screen. */
const EXACT_ALARM_ACCESS_SINCE = 31;

/**
 * Whether the grant exists to be asked for, never whether it was given: React
 * Native cannot read `AlarmManager.canScheduleExactAlarms()`.
 */
export function needsExactAlarmAccess(): boolean {
  return (
    Platform.OS === "android" &&
    Number(Platform.Version) >= EXACT_ALARM_ACCESS_SINCE
  );
}

/**
 * Opens the special access screen. The fallback is there because some vendors
 * ship no activity for that intent.
 */
export async function openExactAlarmSettings(): Promise<void> {
  try {
    await Linking.sendIntent("android.settings.REQUEST_SCHEDULE_EXACT_ALARM");
  } catch {
    await Linking.openSettings();
  }
}
