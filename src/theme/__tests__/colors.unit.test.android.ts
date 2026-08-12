import { materialPalette } from "@/theme/material-palette";
import { accent, colors, useSystemColors } from "@/theme";
import type { MaterialColorsOptions } from "@expo/ui/jetpack-compose";
import { getMaterialColors } from "@expo/ui/jetpack-compose";
import { renderHook } from "@testing-library/react-native";

/*
The palette comes from the Compose module, which is native. Every role is
answered with the scheme and the seed it was generated from, so one assertion
covers the mapping, the appearance and the seed at once.
*/
jest.mock("@expo/ui/jetpack-compose", () => ({
  getMaterialColors: jest.fn(({ scheme, seedColor }: MaterialColorsOptions) =>
    new Proxy(
      {},
      { get: (_target, role: string) => `${role}/${scheme}/${String(seedColor)}` },
    ),
  ),
}));

function role(name: string, scheme: "light" | "dark" = "light") {
  return `${name}/${scheme}/${accent}`;
}

describe("the Android palette", () => {
  it("should fill every key from a Material role seeded with the accent", () => {
    expect(colors).toEqual({
      background: role("surface"),
      groupedBackground: role("surface"),
      secondaryBackground: role("surfaceContainer"),
      text: role("onSurface"),
      secondaryText: role("onSurfaceVariant"),
      tertiaryText: role("outline"),
      mutedText: role("outline"),
      fill: role("surfaceContainerHigh"),
      subtleFill: role("surfaceContainerLow"),
      separator: role("outlineVariant"),
      destructive: role("error"),
    });
  });

  it("should generate the dark palette from the same seed", () => {
    /* `?.` because a single typecheck pass resolves the stand-in this file
    shadows, whose return is nullable. */
    expect(materialPalette("dark", accent)?.text).toBe(role("onSurface", "dark"));
  });

  it("should read the appearance through the hook", async () => {
    const { result } = await renderHook(() => useSystemColors());

    expect(result.current.background).toBe(role("surface"));
    expect(getMaterialColors).toHaveBeenLastCalledWith({
      scheme: "light",
      seedColor: accent,
    });
  });
});
