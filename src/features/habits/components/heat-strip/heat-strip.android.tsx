import { HeatGraph } from "@/components/heat-graph";
import { heatStatusOfDayState } from "@/lib/domain/heat";
import { View } from "react-native";
import {
  STRIP_CELL_HEIGHT,
  STRIP_CELL_RADIUS,
  STRIP_GAP,
  styles,
} from "./styles";
import type { Props } from "./types";

/**
 * AD-033 inverted: the constraint that keeps iOS on a second renderer is the
 * SwiftUI `List` row, and an Android row is React Native, so this one delegates
 * to `components/heat-graph/` at the strip's dimensions. `neutral` is the iOS
 * strip's, which has no surface tokens inside that row to reach for.
 */
export function HeatStrip({ states, color }: Props) {
  return (
    <View style={styles.strip}>
      <HeatGraph
        columns={states.map((state) => [heatStatusOfDayState(state)])}
        accent={color}
        cellHeight={STRIP_CELL_HEIGHT}
        gap={STRIP_GAP}
        radius={STRIP_CELL_RADIUS}
      />
    </View>
  );
}
