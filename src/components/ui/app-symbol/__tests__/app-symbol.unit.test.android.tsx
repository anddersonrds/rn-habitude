import { AppSymbol } from "@/components/ui/app-symbol";
import { renderWithProviders } from "@/test-utils/render";

/* The runner's stand-in resolves the name; this case wants the props raw. */
jest.mock("expo-symbols", () => ({ SymbolView: jest.fn(() => null) }));

const { SymbolView } = jest.requireMock<{ SymbolView: jest.Mock }>("expo-symbols");

describe("AppSymbol on Android", () => {
  it("should hand the Material name over beside the stored one", async () => {
    await renderWithProviders(<AppSymbol name="flame.fill" size={24} />);

    expect(SymbolView).toHaveBeenCalledWith(
      expect.objectContaining({
        name: {
          ios: "flame.fill",
          android: "local_fire_department",
          web: "local_fire_department",
        },
      }),
      undefined,
    );
  });

  it("should drop the properties only an SF Symbol has", async () => {
    await renderWithProviders(
      <AppSymbol
        name="bell.fill"
        weight="semibold"
        animationSpec={{ effect: { type: "bounce" } }}
      />,
    );

    expect(SymbolView).toHaveBeenCalledWith(
      expect.objectContaining({ weight: undefined, animationSpec: undefined }),
      undefined,
    );
  });
});
