import { HeatPreview } from "@/features/onboarding/components/heat-preview";
import { renderWithProviders } from "@/test-utils/render";
import { accent } from "@/theme";
import { Color } from "expo-router";
import { StyleSheet } from "react-native";
import type { TestInstance } from "test-renderer";

const CELL_HEIGHT = 18;

/* Cells carry no text and no name; their shared height is what marks them. */
function cellColors(container: TestInstance) {
  return container
    .queryAll(
      (node) => StyleSheet.flatten(node.props.style)?.height === CELL_HEIGHT,
    )
    .map((cell) => StyleSheet.flatten(cell.props.style).backgroundColor);
}

describe("HeatPreview", () => {
  it("should draw nine weeks of seven days", async () => {
    const { container } = await renderWithProviders(<HeatPreview />);

    expect(cellColors(container)).toHaveLength(63);
  });

  it("should fill some days in the accent and leave the rest empty", async () => {
    const { container } = await renderWithProviders(<HeatPreview />);

    const colors = cellColors(container);
    const filled = colors.filter((color) => color === accent);

    expect(filled.length).toBeGreaterThan(0);
    expect(filled.length).toBeLessThan(colors.length);
  });

  it("should tint an empty day with the system fill", async () => {
    const { container } = await renderWithProviders(<HeatPreview />);

    const empty = cellColors(container).filter((color) => color !== accent);

    expect(empty).toEqual(
      new Array(empty.length).fill(Color.ios.tertiarySystemFill),
    );
  });

  it("should draw the same pattern every time, so the artwork never flickers", async () => {
    const first = await renderWithProviders(<HeatPreview />);
    const second = await renderWithProviders(<HeatPreview />);

    expect(cellColors(first.container)).toEqual(cellColors(second.container));
  });

  it("should fill the recent weeks more densely than the older ones", async () => {
    const { container } = await renderWithProviders(<HeatPreview />);

    const colors = cellColors(container);
    const filled = (from: number) =>
      colors.slice(from, from + 21).filter((color) => color === accent).length;

    expect(filled(42)).toBeGreaterThan(filled(0));
  });
});
