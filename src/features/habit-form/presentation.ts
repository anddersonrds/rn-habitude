import type { NativeStackNavigationOptions } from "expo-router";

export const habitFormPresentation: NativeStackNavigationOptions = {
  headerShown: true,
  presentation: "formSheet",
  /* Fully expanded: the whole form is reachable without a drag. */
  sheetAllowedDetents: [1],
  sheetCornerRadius: 28,
};
