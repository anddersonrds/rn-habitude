import { ComposeSymbol } from "@/components/ui/compose-symbol";
import { accent } from "@/theme";
import { nativeViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";

describe("ComposeSymbol off Android", () => {
  it("should draw nothing, there being no Compose tree to draw into", async () => {
    const { container } = await renderWithProviders(
      <ComposeSymbol name="flame.fill" color={accent} />,
    );

    expect(nativeViews(container)).toEqual([]);
  });
});
