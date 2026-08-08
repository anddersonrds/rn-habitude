import {
  heatAppearance,
  heatStatusOfCell,
  heatStatusOfDayState,
  type HeatPalette,
  type HeatStatus,
} from "@/lib/domain/heat";
import type { HeatCell } from "@/lib/domain/streaks";

const TODAY = "2026-07-29";
const ACCENT = "#FF9500";

const palette: HeatPalette = {
  accent: ACCENT,
  missed: { color: "#111111", opacity: 0.5 },
  unscheduled: { color: "#222222", opacity: 0.25 },
};

function cell(date: string, status: HeatCell["status"]): HeatCell {
  return { date, week: 0, weekday: 0, status };
}

describe("heatStatusOfCell", () => {
  it("should call an unchecked day that is still today pending, not missed", () => {
    expect(heatStatusOfCell(cell(TODAY, "missed"), TODAY)).toBe("pending");
  });

  it("should call an unchecked day that is over missed", () => {
    expect(heatStatusOfCell(cell("2026-07-28", "missed"), TODAY)).toBe("missed");
  });

  it("should leave every other status as the grid built it", () => {
    for (const status of ["done", "unscheduled", "empty"] as const) {
      expect(heatStatusOfCell(cell(TODAY, status), TODAY)).toBe(status);
    }
  });
});

describe("heatStatusOfDayState", () => {
  it("should read the four states the widget's encoding carries", () => {
    expect([0, 1, 2, 3].map(heatStatusOfDayState)).toEqual([
      "unscheduled",
      "missed",
      "done",
      "pending",
    ]);
  });

  it("should treat a state it does not know as a day with nothing on it", () => {
    expect(heatStatusOfDayState(9)).toBe("unscheduled");
  });
});

describe("heatAppearance", () => {
  it("should draw a completed day solid in the habit's own colour", () => {
    expect(heatAppearance("done", palette)).toEqual({
      color: ACCENT,
      opacity: 1,
    });
  });

  it("should draw a day still open as a faded habit colour", () => {
    expect(heatAppearance("pending", palette)).toEqual({
      color: ACCENT,
      opacity: 0.3,
    });
  });

  it("should hand a missed day and a rest day to the palette it was given", () => {
    expect(heatAppearance("missed", palette)).toEqual(palette.missed);
    expect(heatAppearance("unscheduled", palette)).toEqual(palette.unscheduled);
  });

  it("should draw nothing at all where there is nothing to say", () => {
    expect(heatAppearance("empty", palette)).toEqual({
      color: "transparent",
      opacity: 1,
    });
  });

  it("should answer every status the vocabulary has", () => {
    const every: HeatStatus[] = [
      "done",
      "pending",
      "missed",
      "unscheduled",
      "empty",
    ];

    for (const status of every) {
      expect(heatAppearance(status, palette).color).toEqual(expect.any(String));
    }
  });
});
