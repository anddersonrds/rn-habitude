import { WIDGET_THEMES, widgetCellColor } from "../palette";

const HABIT_COLOR = "#34C759";

const DONE = 2;
const PENDING = 3;
const MISSED = 1;
const UNSCHEDULED = 0;

describe("widgetCellColor", () => {
  it("should paint a completed day in the habit's own colour, opaque", () => {
    expect(widgetCellColor(DONE, HABIT_COLOR, WIDGET_THEMES.light)).toBe(
      "#34C759FF",
    );
  });

  it("should fade a day still open to the same value the app fades it to", () => {
    expect(widgetCellColor(PENDING, HABIT_COLOR, WIDGET_THEMES.light)).toBe(
      "#34C7594D",
    );
  });

  it("should tint a missed day with the theme's neutral, not the habit", () => {
    expect(widgetCellColor(MISSED, HABIT_COLOR, WIDGET_THEMES.light)).toBe(
      "#0000001F",
    );
    expect(widgetCellColor(MISSED, HABIT_COLOR, WIDGET_THEMES.dark)).toBe(
      "#FFFFFF1F",
    );
  });

  it("should draw a day the habit was not scheduled on fainter than a missed one", () => {
    expect(widgetCellColor(UNSCHEDULED, HABIT_COLOR, WIDGET_THEMES.light)).toBe(
      "#0000000D",
    );
  });

  it("should treat a state it does not know as unscheduled", () => {
    expect(widgetCellColor(9, HABIT_COLOR, WIDGET_THEMES.light)).toBe(
      widgetCellColor(UNSCHEDULED, HABIT_COLOR, WIDGET_THEMES.light),
    );
  });
});
