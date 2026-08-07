import { HABIT_COLORS } from "@/constants/habit-options";
import { layout } from "@/constants/layout";
import { useWindowDimensions } from "react-native";
import {
  COLOR_CARD_PADDING,
  COLOR_GAP_MIN,
  COLOR_RING,
} from "../../styles";
import type { ColorGrid } from "./types";

/**
 * The gap is derived so that a full row spans the card exactly, and a partial
 * row then gets that same gap - `justifyContent: "space-between"` is what
 * pushed two leftover swatches to opposite edges. The rows are explicit rather
 * than `flexWrap` for the same reason: whether flexbox wraps at exact equality
 * is a floating point coin flip.
 */
export function useColorGrid(): ColorGrid {
  const { width: windowWidth } = useWindowDimensions();

  const width = windowWidth - layout.screenPadding * 2 - COLOR_CARD_PADDING * 2;
  const columns = Math.max(
    1,
    Math.floor((width + COLOR_GAP_MIN) / (COLOR_RING + COLOR_GAP_MIN)),
  );
  const gap =
    columns > 1 ? (width - columns * COLOR_RING) / (columns - 1) : COLOR_GAP_MIN;

  const rows = Array.from(
    { length: Math.ceil(HABIT_COLORS.length / columns) },
    (_, row) => HABIT_COLORS.slice(row * columns, (row + 1) * columns),
  );

  return { rows, gap };
}
