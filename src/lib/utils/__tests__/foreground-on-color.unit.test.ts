import { HABIT_COLORS } from "@/constants/habit-options";
import { foregroundOnColor } from "@/lib/utils/foreground-on-color";

/*
The two constants the function can return. WCAG puts the crossover at a relative
luminance of about 0.179, so the palette lands almost entirely on black.
*/
const BLACK = "#000000";
const WHITE = "#FFFFFF";

describe("foregroundOnColor", () => {
  it("should put black on the light end of the palette", () => {
    expect(foregroundOnColor("#FFCC00")).toBe(BLACK);
    expect(foregroundOnColor("#A2D729")).toBe(BLACK);
    expect(foregroundOnColor("#00C7BE")).toBe(BLACK);
  });

  it("should put white on the dark end of the palette", () => {
    expect(foregroundOnColor("#5856D6")).toBe(WHITE);
    expect(foregroundOnColor("#8A4FE8")).toBe(WHITE);
  });

  it("should invert at the extremes", () => {
    expect(foregroundOnColor("#FFFFFF")).toBe(BLACK);
    expect(foregroundOnColor("#000000")).toBe(WHITE);
  });

  it("should answer for every habit color", () => {
    for (const color of HABIT_COLORS) {
      expect(foregroundOnColor(color)).toBe(
        color === "#5856D6" || color === "#8A4FE8" ? WHITE : BLACK,
      );
    }
  });

  it("should read a lowercase hex the same as an uppercase one", () => {
    for (const color of HABIT_COLORS) {
      expect(foregroundOnColor(color.toLowerCase())).toBe(
        foregroundOnColor(color),
      );
    }
  });

  it("should fall back to white when the value is not a six-digit hex", () => {
    expect(foregroundOnColor("#FC0")).toBe(WHITE);
    expect(foregroundOnColor("rgb(255, 204, 0)")).toBe(WHITE);
    expect(foregroundOnColor("")).toBe(WHITE);
  });
});
