import { ComposeSymbol } from "@/components/ui/compose-symbol";
import { accent } from "@/theme";
import { nativeViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";

/* Rasterising a glyph is native work, and the source it returns is opaque. */
jest.mock("expo-symbols", () => ({
  unstable_getMaterialSymbolSourceAsync: jest.fn(async () => ({
    uri: "file:///symbol.png",
  })),
}));

const { unstable_getMaterialSymbolSourceAsync: resolveSource } = jest.requireMock<{
  unstable_getMaterialSymbolSourceAsync: jest.Mock;
}>("expo-symbols");

/** Lets a rasterised source land before the case goes on. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

describe("ComposeSymbol", () => {
  it("should rasterise the Material name the stored one maps to", async () => {
    const { container } = await renderWithProviders(
      <ComposeSymbol name="flame.fill" size={20} color={accent} />,
    );

    expect(resolveSource).toHaveBeenCalledWith("local_fire_department", 20, accent);
    expect(nativeViews(container)).toHaveLength(1);
  });

  it("should rasterise a symbol once however many rows draw it", async () => {
    resolveSource.mockClear();

    const { container } = await renderWithProviders(
      <>
        <ComposeSymbol name="bell.fill" size={18} color={accent} />
        <ComposeSymbol name="bell.fill" size={18} color={accent} />
      </>,
    );
    await settle();

    expect(resolveSource).toHaveBeenCalledTimes(1);
    expect(nativeViews(container)).toHaveLength(2);
  });

  it("should draw nothing while a symbol is still being rasterised", async () => {
    resolveSource.mockImplementationOnce(() => new Promise(() => {}));

    const { container } = await renderWithProviders(
      <ComposeSymbol name="checkmark" size={14} color={accent} />,
    );

    expect(nativeViews(container)).toEqual([]);
  });
});
