import { HStack, RoundedRectangle } from "@expo/ui/swift-ui";
import {
  foregroundStyle,
  frame,
  opacity,
} from "@expo/ui/swift-ui/modifiers";
import type { Props } from "./types";

/** The habit's recent consistency, drawn natively so the row stays SwiftUI. */
export function HeatStrip({ states, color, neutral }: Props) {
  return (
    <HStack spacing={2} modifiers={[frame({ width: 76 })]}>
      {states.map((state, index) => (
        <RoundedRectangle
          key={index}
          cornerRadius={1.5}
          modifiers={[
            frame({ height: 16 }),
            foregroundStyle(state === 2 || state === 3 ? color : neutral),
            opacity(state === 2 ? 1 : state === 3 ? 0.3 : state === 1 ? 0.14 : 0.06),
          ]}
        />
      ))}
    </HStack>
  );
}
