import { heatAppearance, heatStatusOfDayState } from "@/lib/domain/heat";
import { HStack, RoundedRectangle } from "@expo/ui/swift-ui";
import { foregroundStyle, frame, opacity } from "@expo/ui/swift-ui/modifiers";
import {
  STRIP_CELL_HEIGHT,
  STRIP_CELL_RADIUS,
  STRIP_GAP,
  STRIP_WIDTH,
} from "./styles";
import type { Props } from "./types";

/**
 * The one heat graph that cannot come from `components/heat-graph/`: it renders
 * inside a SwiftUI `List` row, which no React Native view can enter. What it
 * does share is the rule that turns a day into a color and an opacity.
 */
export function HeatStrip({ states, color, neutral }: Props) {
  const palette = {
    accent: color,
    missed: { color: neutral, opacity: 0.14 },
    unscheduled: { color: neutral, opacity: 0.06 },
  };

  return (
    <HStack spacing={STRIP_GAP} modifiers={[frame({ width: STRIP_WIDTH })]}>
      {states.map((state, index) => {
        const cell = heatAppearance(heatStatusOfDayState(state), palette);
        return (
          <RoundedRectangle
            key={index}
            cornerRadius={STRIP_CELL_RADIUS}
            modifiers={[
              frame({ height: STRIP_CELL_HEIGHT }),
              foregroundStyle(cell.color),
              opacity(cell.opacity),
            ]}
          />
        );
      })}
    </HStack>
  );
}
