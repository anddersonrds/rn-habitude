import type { NativeStackNavigationOptions } from "expo-router";

/**
 * A pushed screen rather than a sheet. `formSheet` draws no header here, and
 * the title, the cancel and the save the screen builds went with it.
 */
export const habitFormPresentation: NativeStackNavigationOptions = {
  headerShown: true,
};
