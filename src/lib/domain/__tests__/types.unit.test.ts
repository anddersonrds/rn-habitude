import { isDaily, isScheduledOn } from "@/lib/domain/types";
import { makeHabit } from "@/test-utils/factories";

const WEEKDAYS_ONLY = [1, 2, 3, 4, 5];
const EVERY_WEEKDAY = [0, 1, 2, 3, 4, 5, 6];

describe("isScheduledOn", () => {
  it("should return true for a weekday the habit lists", () => {
    expect(isScheduledOn(makeHabit({ weekdays: WEEKDAYS_ONLY }), 3)).toBe(true);
  });

  it("should return false for a weekday the habit omits", () => {
    expect(isScheduledOn(makeHabit({ weekdays: WEEKDAYS_ONLY }), 0)).toBe(false);
  });

  it("should return true for every weekday when the habit is daily", () => {
    const habit = makeHabit({ weekdays: EVERY_WEEKDAY });
    expect(EVERY_WEEKDAY.map((day) => isScheduledOn(habit, day))).toEqual(
      EVERY_WEEKDAY.map(() => true),
    );
  });

  it("should return false for every weekday when the habit has no schedule", () => {
    const habit = makeHabit({ weekdays: [] });
    expect(EVERY_WEEKDAY.some((day) => isScheduledOn(habit, day))).toBe(false);
  });
});

describe("isDaily", () => {
  it("should return true when all seven weekdays are scheduled", () => {
    expect(isDaily({ weekdays: EVERY_WEEKDAY })).toBe(true);
  });

  it("should return false when one weekday is missing", () => {
    expect(isDaily({ weekdays: [0, 1, 2, 3, 4, 5] })).toBe(false);
  });

  it("should return false when nothing is scheduled", () => {
    expect(isDaily({ weekdays: [] })).toBe(false);
  });
});
