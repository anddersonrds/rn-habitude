import { ComposeSymbol } from "@/components/ui/compose-symbol";
import { nativeViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { accent } from "@/theme";
import { waitFor } from "@testing-library/react-native";
import type { TestInstance } from "test-renderer";

/* Rasterising a glyph is native work, and the source it returns is opaque. */
jest.mock("expo-symbols", () => ({
  unstable_getMaterialSymbolSourceAsync: jest.fn(async () => ({
    uri: "file:///symbol.png",
  })),
}));

const { unstable_getMaterialSymbolSourceAsync: resolveSource } = jest.requireMock<{
  unstable_getMaterialSymbolSourceAsync: jest.Mock;
}>("expo-symbols");

const RASTERISED = "file:///symbol.png";

/** Waits for a rasterised glyph to reach the icon it was asked for. */
async function waitForGlyph(view: TestInstance): Promise<void> {
  await waitFor(() => expect(sourceOf(view).uri).toBe(RASTERISED));
}

function sourceOf(view: TestInstance): { uri?: string } {
  const [icon] = nativeViews(view);
  return icon.props.source as { uri?: string };
}

describe("ComposeSymbol", () => {
  it("should rasterise the Material name the stored one maps to", async () => {
    const { container } = await renderWithProviders(
      <ComposeSymbol name="flame.fill" size={20} color={accent} />,
    );

    expect(resolveSource).toHaveBeenCalledWith("local_fire_department", 20, accent);
    expect(nativeViews(container)).toHaveLength(1);
    await waitForGlyph(container);
  });

  it("should rasterise a symbol once however many rows draw it", async () => {
    resolveSource.mockClear();

    const { container } = await renderWithProviders(
      <>
        <ComposeSymbol name="bell.fill" size={18} color={accent} />
        <ComposeSymbol name="bell.fill" size={18} color={accent} />
      </>,
    );
    await waitForGlyph(container);

    expect(resolveSource).toHaveBeenCalledTimes(1);
    expect(nativeViews(container)).toHaveLength(2);
  });

  it("should draw its icon on the first render, before the glyph is rasterised", async () => {
    resolveSource.mockImplementationOnce(() => new Promise(() => {}));

    const { container } = await renderWithProviders(
      <ComposeSymbol name="checkmark" size={14} color={accent} />,
    );

    expect(nativeViews(container)).toHaveLength(1);
    expect(sourceOf(container).uri).not.toBe(RASTERISED);
  });

  it("should fill that icon in once the glyph lands", async () => {
    const { container } = await renderWithProviders(
      <ComposeSymbol name="trash" size={16} color={accent} />,
    );

    await waitForGlyph(container);
  });
});
