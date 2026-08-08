import { ProgressDots } from "@/features/onboarding/components/progress-dots";
import { renderWithProviders } from "@/test-utils/render";
import { accent, colors } from "@/theme";
import { StyleSheet } from "react-native";
import type { TestInstance } from "test-renderer";

const DOT_HEIGHT = 7;
const CURRENT_DOT_WIDTH = 24;

/* Dots carry no text; their shared height is what marks them out. */
function dots(container: TestInstance) {
  return container
    .queryAll(
      (node) => StyleSheet.flatten(node.props.style)?.height === DOT_HEIGHT,
    )
    .map((dot) => {
      const style = StyleSheet.flatten(dot.props.style);
      return { width: style.width, color: style.backgroundColor };
    });
}

describe("ProgressDots", () => {
  it("should draw one dot per step it is given", async () => {
    const { container } = await renderWithProviders(
      <ProgressDots currentIndex={0} stepCount={5} />,
    );

    expect(dots(container)).toHaveLength(5);
  });

  it("should widen the dot of the step being shown", async () => {
    const { container } = await renderWithProviders(
      <ProgressDots currentIndex={1} stepCount={3} />,
    );

    expect(dots(container).map((dot) => dot.width)).toEqual([
      DOT_HEIGHT,
      CURRENT_DOT_WIDTH,
      DOT_HEIGHT,
    ]);
  });

  it("should fill the steps already behind it", async () => {
    const { container } = await renderWithProviders(
      <ProgressDots currentIndex={1} stepCount={3} />,
    );

    expect(dots(container).map((dot) => dot.color)).toEqual([
      accent,
      accent,
      colors.fill,
    ]);
  });

  it("should leave every step ahead in the system fill", async () => {
    const { container } = await renderWithProviders(
      <ProgressDots currentIndex={0} stepCount={3} />,
    );

    expect(dots(container).map((dot) => dot.color)).toEqual([
      accent,
      colors.fill,
      colors.fill,
    ]);
  });
});
