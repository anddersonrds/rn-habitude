import { accent, colors, getNavigationTheme } from "@/theme";

describe("the navigation theme", () => {
  it("should take every surface from the palette rather than from the base theme", () => {
    expect(getNavigationTheme(false).colors).toEqual({
      primary: accent,
      background: colors.background,
      card: colors.secondaryBackground,
      text: colors.text,
      border: colors.separator,
      notification: accent,
    });
  });

  it("should hand the navigator the same palette in either appearance", () => {
    expect(getNavigationTheme(true).colors).toEqual(
      getNavigationTheme(false).colors,
    );
  });

  it("should still tell the navigator which appearance it is in", () => {
    expect(getNavigationTheme(true).dark).toBe(true);
    expect(getNavigationTheme(false).dark).toBe(false);
  });
});
