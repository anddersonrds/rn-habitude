import { Linking, Platform } from "react-native";

/** Android 12, where exact alarms moved behind a special access screen. */
const EXACT_ALARM_ACCESS_SINCE = 31;

/**
 * Whether exact alarms are gated behind a user grant here. React Native cannot
 * read `AlarmManager.canScheduleExactAlarms()`, so this reports that the grant
 * exists to be asked for, never whether it was given.
 */
export function needsExactAlarmAccess(): boolean {
  return (
    Platform.OS === "android" &&
    Number(Platform.Version) >= EXACT_ALARM_ACCESS_SINCE
  );
}

/**
 * Opens the special access screen, falling back to the app's own settings page
 * because some vendors ship no activity for that intent. Refusing there costs
 * the exactness of the alarm, not the reminder.
 */
export async function openExactAlarmSettings(): Promise<void> {
  try {
    await Linking.sendIntent("android.settings.REQUEST_SCHEDULE_EXACT_ALARM");
  } catch {
    await Linking.openSettings();
  }
}
