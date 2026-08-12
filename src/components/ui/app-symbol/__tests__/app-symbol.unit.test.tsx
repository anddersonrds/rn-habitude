import { AppSymbol } from "@/components/ui/app-symbol";
import { accent } from "@/theme";
import { symbolView } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";

describe("AppSymbol", () => {
  it("should draw the symbol it is asked for", async () => {
    const { container } = await renderWithProviders(
      <AppSymbol name="flame.fill" size={24} tintColor={accent} />,
    );

    const symbol = symbolView(container, "flame.fill");
    expect(symbol.props.size).toBe(24);
    expect(symbol.props.tintColor).toBe(accent);
  });

  it("should draw a symbol whose name is not in the map", async () => {
    const { container } = await renderWithProviders(
      <AppSymbol name="nonexistent.symbol" size={12} />,
    );

    expect(symbolView(container, "nonexistent.symbol")).toBeTruthy();
  });
});
