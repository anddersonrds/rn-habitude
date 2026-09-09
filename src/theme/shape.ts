import type { ViewStyle } from "react-native";

/** Spread rather than written, so the platform without the curve spreads nothing. */
export const continuousCorner = { borderCurve: "continuous" } satisfies ViewStyle;
