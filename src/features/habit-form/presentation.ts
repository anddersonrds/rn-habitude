import type { NativeStackNavigationOptions } from "expo-router";

/**
 * How the route presents this screen, which is the one thing about it that is
 * not shared: a sheet is the iOS presentation, and it is the only presentation
 * that draws a header on both platforms without one.
 */
export const habitFormPresentation: NativeStackNavigationOptions = {
  headerShown: true,
  presentation: "formSheet",
  /* Fully expanded: the whole form is reachable without a drag. */
  sheetAllowedDetents: [1],
  sheetCornerRadius: 28,
};
