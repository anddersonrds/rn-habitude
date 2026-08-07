import { LegendSwatch } from "@/features/habit-history/components/legend-swatch";
import { renderWithProviders } from "@/test-utils/render";
import { StyleSheet } from "react-native";
import type { TestInstance } from "test-renderer";

const SWATCH_SIZE = 11;

/* The swatch carries no text; its square shape is what marks it out. */
function swatchColor(container: TestInstance) {
  const [swatch] = container.queryAll(
    (node) => StyleSheet.flatten(node.props.style)?.width === SWATCH_SIZE,
  );
  if (!swatch) throw new Error("The legend draws no swatch.");
  return StyleSheet.flatten(swatch.props.style).backgroundColor;
}

describe("LegendSwatch", () => {
  it("should name what the colour means", async () => {
    const { getByText } = await renderWithProviders(
      <LegendSwatch color="#FF9500" label="Done" />,
    );

    expect(getByText("Done")).toBeOnTheScreen();
  });

  it("should fill the swatch with the colour it is given", async () => {
    const { container } = await renderWithProviders(
      <LegendSwatch color="#FF9500" label="Done" />,
    );

    expect(swatchColor(container)).toBe("#FF9500");
  });
});
