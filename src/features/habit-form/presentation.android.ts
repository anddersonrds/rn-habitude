import type { NativeStackNavigationOptions } from "expo-router";

/* No sheet: `formSheet` draws no header here, and the screen's own title,
cancel and save went with it. */
export const habitFormPresentation: NativeStackNavigationOptions = {
  headerShown: true,
};
