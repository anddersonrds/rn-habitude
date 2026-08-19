import { colors, useSystemColors } from "@/theme";
import { renderHook } from "@testing-library/react-native";

/* A colour string here is the frozen palette 0.6.0 shipped, and no other gate
can see it. */
type Descriptor = { resource_paths: string[] };

function attributes(value: unknown) {
  return (value as Descriptor).resource_paths;
}

describe("the Android palette", () => {
  it("should name a Material 3 role for every key", () => {
    expect(
      Object.fromEntries(
        Object.entries(colors).map(([key, value]) => [key, attributes(value)]),
      ),
    ).toEqual({
      background: ["?attr/colorSurface"],
      groupedBackground: ["?attr/colorSurface"],
      secondaryBackground: ["?attr/colorSurfaceContainer"],
      text: ["?attr/colorOnSurface"],
      secondaryText: ["?attr/colorOnSurfaceVariant"],
      tertiaryText: ["?attr/colorOutline"],
      mutedText: ["?attr/colorOutline"],
      fill: ["?attr/colorSurfaceContainerHigh"],
      subtleFill: ["?attr/colorSurfaceContainerLow"],
      separator: ["?attr/colorOutlineVariant"],
      destructive: ["?attr/colorError"],
    });
  });

  it("should hold no token the platform cannot resolve", () => {
    for (const value of Object.values(colors)) {
      expect(typeof value).not.toBe("string");
      expect(typeof value).not.toBe("number");
    }
  });

  it("should answer the hook with the same palette", async () => {
    const { result } = await renderHook(() => useSystemColors());

    expect(result.current).toBe(colors);
  });
});
