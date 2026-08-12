import { AppSymbol } from "@/components/ui/app-symbol";
import { symbolView } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";

describe("AppSymbol on iOS", () => {
  it("should keep the properties only an SF Symbol has", async () => {
    const { container } = await renderWithProviders(
      <AppSymbol
        name="bell.fill"
        weight="semibold"
        animationSpec={{ effect: { type: "bounce" } }}
      />,
    );

    const symbol = symbolView(container, "bell.fill");
    expect(symbol.props.weight).toBe("semibold");
    expect(symbol.props.animated).toBe(true);
  });
});
