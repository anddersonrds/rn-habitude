import { WelcomeStep } from "@/features/onboarding/components/welcome-step";
import { symbolViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { StyleSheet } from "react-native";
import type { TestInstance } from "test-renderer";

const CELL_HEIGHT = 18;

function previewCells(container: TestInstance) {
  return container.queryAll(
    (node) => StyleSheet.flatten(node.props.style)?.height === CELL_HEIGHT,
  );
}

describe("WelcomeStep", () => {
  it("should draw the example habit the step is built around", async () => {
    const { getByText } = await renderWithProviders(<WelcomeStep />);

    expect(getByText("Walk outside")).toBeOnTheScreen();
    expect(getByText("12-day streak")).toBeOnTheScreen();
  });

  it("should show the example habit as checked off", async () => {
    const { container } = await renderWithProviders(<WelcomeStep />);

    expect(symbolViews(container).map((symbol) => symbol.props.name)).toEqual([
      "figure.walk",
      "checkmark",
    ]);
  });

  it("should carry the heat preview under the card header", async () => {
    const { container } = await renderWithProviders(<WelcomeStep />);

    expect(previewCells(container)).toHaveLength(63);
  });
});
