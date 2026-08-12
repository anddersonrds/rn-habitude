import { Celebration } from "@/components/celebration";
import { renderWithProviders } from "@/test-utils/render";
import { colors } from "@/theme";
import { StyleSheet } from "react-native";
import type { TestInstance } from "test-renderer";

/* The badge is the only 96pt circle in the tree. */
function badge(container: TestInstance): TestInstance {
  const [found] = container.queryAll((node) => {
    const style = StyleSheet.flatten(node.props.style);
    return style?.width === 96 && style.borderRadius === 48;
  });
  if (!found) throw new Error("The celebration draws no badge.");
  return found;
}

describe("the celebration without Liquid Glass", () => {
  it("should stand the badge on a theme surface, since Android has no glass", async () => {
    const { container } = await renderWithProviders(
      <Celebration colors={[]} onFinished={jest.fn()} />,
    );

    expect(StyleSheet.flatten(badge(container).props.style).backgroundColor).toBe(
      colors.secondaryBackground,
    );
  });
});
