import { scheduleLabel } from "@/lib/habits";
import type { Habit } from "@/lib/types";
import { makeHabit } from "@/test-utils/factories";

function habit(weekdays: number[]): Habit {
  return makeHabit({ weekdays });
}

describe("scheduleLabel", () => {
  it("should say a habit on all seven days runs every day", () => {
    expect(scheduleLabel(habit([0, 1, 2, 3, 4, 5, 6]))).toBe("Every day");
  });

  it("should abbreviate the days a habit runs on, in the order it holds them", () => {
    expect(scheduleLabel(habit([1, 3, 5]))).toBe("Mon, Wed, Fri");
  });

  it("should name a single day on its own", () => {
    expect(scheduleLabel(habit([0]))).toBe("Sun");
  });

  it("should say a habit on no days at all runs on none", () => {
    expect(scheduleLabel(habit([]))).toBe("No days");
  });
});
