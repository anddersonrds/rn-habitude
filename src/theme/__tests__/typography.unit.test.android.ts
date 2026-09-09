import { appFontFamily, typography } from "@/theme";
import type { TextStyle } from "react-native";

/* A key the ramp does not carry is a variant that draws unstyled. */
const RAMP = [
  "largeTitle",
  "title",
  "title2",
  "title3",
  "headline",
  "body",
  "subheadline",
  "footnote",
  "caption",
];

describe("the Android type ramp", () => {
  it("should carry every key a screen asks for", () => {
    expect(Object.keys(typography)).toEqual(RAMP);
  });

  it("should take its sizes from the Material 3 type scale", () => {
    expect(typography).toEqual({
      largeTitle: { fontSize: 32, fontWeight: "400", letterSpacing: 0 },
      title: { fontSize: 28, fontWeight: "400", letterSpacing: 0 },
      title2: { fontSize: 24, fontWeight: "400", letterSpacing: 0 },
      title3: { fontSize: 22, fontWeight: "400", letterSpacing: 0 },
      headline: { fontSize: 16, fontWeight: "500", letterSpacing: 0.15 },
      body: { fontSize: 16, letterSpacing: 0.5 },
      subheadline: { fontSize: 14, letterSpacing: 0.25 },
      footnote: { fontSize: 12, letterSpacing: 0.4 },
      caption: { fontSize: 11, fontWeight: "500", letterSpacing: 0.5 },
    });
  });

  it("should track no tighter than the font was drawn for", () => {
    /* A single `tsc` pass reads the iOS ramp, where one key has no tracking. */
    const ramp: Record<string, TextStyle> = typography;

    for (const style of Object.values(ramp)) {
      expect(style.letterSpacing ?? 0).toBeGreaterThanOrEqual(0);
    }
  });

  it("should name a family the platform can resolve", () => {
    expect(appFontFamily).toBe("sans-serif");
  });
});
