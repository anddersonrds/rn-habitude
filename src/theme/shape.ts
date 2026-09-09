import type { ViewStyle } from "react-native";

/**
 * The corner iOS draws when a radius is rounded off along a continuous curve.
 * It is spread into a style rather than written there so that the platform that
 * has no such curve simply spreads nothing.
 */
export const continuousCorner = { borderCurve: "continuous" } satisfies ViewStyle;
