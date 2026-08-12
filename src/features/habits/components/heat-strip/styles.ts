import { StyleSheet } from "react-native";

/** The strip is pinned to this width and its cells share whatever is left. */
export const STRIP_WIDTH = 76;
export const STRIP_GAP = 2;
export const STRIP_CELL_HEIGHT = 16;
export const STRIP_CELL_RADIUS = 1.5;

export const styles = StyleSheet.create({
  strip: {
    width: STRIP_WIDTH,
  },
});
