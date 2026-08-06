import {
  completionRate,
  computeStreaks,
  heatCells,
  heatMonthLabels,
  trailingDayStates,
} from "@/lib/streaks";
import { makeHabit } from "@/test-utils/factories";
import { freezeClock, restoreClock } from "@/test-utils/time";

/* A Wednesday, so a partial week sits on either side of it in the heat grid. */
const TODAY = "2026-07-29";

const MON_WED_FRI = [1, 3, 5];

function completedOn(...keys: string[]): Record<string, true> {
  return Object.fromEntries(keys.map((key) => [key, true]));
}

/*
Every function here defaults its date argument to `todayKey()`. The clock is
frozen for all of them so that the default and the explicit argument describe
the same day, and a test that forgets the argument still cannot drift.
*/
beforeEach(() => freezeClock(`${TODAY}T12:00:00-03:00`));
afterEach(restoreClock);

describe("computeStreaks", () => {
  it("should return zero for a habit with no completions", () => {
    const habit = makeHabit({ createdAt: "2026-07-20" });
    expect(computeStreaks(habit, undefined)).toEqual({ current: 0, best: 0 });
  });

  it("should count a habit completed only today as a streak of one", () => {
    const habit = makeHabit({ createdAt: TODAY });
    expect(computeStreaks(habit, completedOn(TODAY))).toEqual({
      current: 1,
      best: 1,
    });
  });

  it("should reset the current streak at a gap and keep the longest run as best", () => {
    const habit = makeHabit({ createdAt: "2026-07-20" });
    const done = completedOn(
      "2026-07-20",
      "2026-07-21",
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
      "2026-07-26",
      "2026-07-27",
      TODAY,
    );
    expect(computeStreaks(habit, done)).toEqual({ current: 1, best: 5 });
  });

  it("should not break a streak on days the habit is not scheduled", () => {
    const habit = makeHabit({ createdAt: "2026-07-20", weekdays: MON_WED_FRI });
    const done = completedOn(
      "2026-07-20",
      "2026-07-22",
      "2026-07-24",
      "2026-07-27",
      TODAY,
    );
    expect(computeStreaks(habit, done)).toEqual({ current: 5, best: 5 });
  });

  it("should not count days before the habit existed as missed", () => {
    const habit = makeHabit({ createdAt: TODAY });
    expect(computeStreaks(habit, completedOn(TODAY)).current).toBe(1);
  });

  it("should count back-filled completions older than the habit itself", () => {
    const habit = makeHabit({ createdAt: "2026-07-28" });
    const done = completedOn("2026-07-26", "2026-07-27", "2026-07-28", TODAY);
    expect(computeStreaks(habit, done)).toEqual({ current: 4, best: 4 });
  });

  it("should keep the current streak while today is still outstanding", () => {
    const habit = makeHabit({ createdAt: "2026-07-25" });
    const done = completedOn(
      "2026-07-25",
      "2026-07-26",
      "2026-07-27",
      "2026-07-28",
    );
    expect(computeStreaks(habit, done)).toEqual({ current: 4, best: 4 });
  });

  it("should count a fully complete history as one unbroken run", () => {
    const habit = makeHabit({ createdAt: "2026-07-27" });
    const done = completedOn("2026-07-27", "2026-07-28", TODAY);
    expect(computeStreaks(habit, done)).toEqual({ current: 3, best: 3 });
  });

  it("should return zero for a habit created after today", () => {
    const habit = makeHabit({ createdAt: "2026-08-01" });
    expect(computeStreaks(habit, completedOn("2026-08-01"))).toEqual({
      current: 0,
      best: 0,
    });
  });

  it("should fall back to today when no date is given", () => {
    const habit = makeHabit({ createdAt: "2026-07-27" });
    const done = completedOn("2026-07-27", "2026-07-28", TODAY);
    expect(computeStreaks(habit, done)).toEqual(
      computeStreaks(habit, done, TODAY),
    );
  });
});

describe("heatCells", () => {
  const habit = makeHabit({ createdAt: "2026-07-22", weekdays: MON_WED_FRI });
  const done = completedOn("2026-07-22");

  it("should fill one column of seven rows per week, ending on the week of the end date", () => {
    const cells = heatCells(habit, done, 2, TODAY);
    expect(cells).toHaveLength(14);
    /* The grid runs Sunday to Saturday around the end date's own week. */
    expect([cells[0].date, cells[13].date]).toEqual([
      "2026-07-19",
      "2026-08-01",
    ]);
    expect([cells[0].week, cells[0].weekday]).toEqual([0, 0]);
    expect([cells[13].week, cells[13].weekday]).toEqual([1, 6]);
  });

  it("should mark a completed day as done", () => {
    const cells = heatCells(habit, done, 2, TODAY);
    expect(cells.find((cell) => cell.date === "2026-07-22")?.status).toBe("done");
  });

  it("should mark a scheduled day with no completion as missed", () => {
    const cells = heatCells(habit, done, 2, TODAY);
    expect(cells.find((cell) => cell.date === "2026-07-24")?.status).toBe(
      "missed",
    );
  });

  it("should mark a day the habit is not scheduled on as unscheduled", () => {
    const cells = heatCells(habit, done, 2, TODAY);
    expect(cells.find((cell) => cell.date === "2026-07-23")?.status).toBe(
      "unscheduled",
    );
  });

  it("should mark days before the habit existed and days after today as empty", () => {
    const cells = heatCells(habit, done, 2, TODAY);
    expect(cells.find((cell) => cell.date === "2026-07-21")?.status).toBe(
      "empty",
    );
    expect(cells.find((cell) => cell.date === "2026-07-30")?.status).toBe(
      "empty",
    );
  });

  it("should treat a back-filled completion as the start of the tracked range", () => {
    const cells = heatCells(habit, completedOn("2026-07-20"), 2, TODAY);
    expect(cells.find((cell) => cell.date === "2026-07-20")?.status).toBe("done");
    expect(cells.find((cell) => cell.date === "2026-07-21")?.status).toBe(
      "unscheduled",
    );
  });

  it("should mark every day empty for a habit with no history at all", () => {
    const unborn = makeHabit({ createdAt: "2026-08-10" });
    const cells = heatCells(unborn, undefined, 2, TODAY);
    expect(cells.every((cell) => cell.status === "empty")).toBe(true);
  });
});

describe("heatMonthLabels", () => {
  const habit = makeHabit({ createdAt: "2020-01-01" });

  it("should label each column where a new month starts", () => {
    const cells = heatCells(habit, undefined, 8, "2027-01-06");
    expect(heatMonthLabels(cells, "en")).toEqual([
      { week: 0, label: "Nov" },
      { week: 3, label: "Dec" },
      { week: 7, label: "Jan" },
    ]);
  });

  it("should carry the label across a year boundary rather than repeating a month", () => {
    const cells = heatCells(habit, undefined, 12, "2027-01-06");
    expect(heatMonthLabels(cells, "en").map((entry) => entry.label)).toEqual([
      "Oct",
      "Nov",
      "Dec",
      "Jan",
    ]);
  });

  it("should abbreviate the month in the language it is given", () => {
    /* The runner is pinned to `en_US`, so a French month can only have come
    from the argument. */
    const cells = heatCells(habit, undefined, 8, "2027-01-06");
    expect(heatMonthLabels(cells, "fr").map((entry) => entry.label)).toEqual([
      "nov.",
      "déc.",
      "janv.",
    ]);
  });

  it("should drop a first label that would collide with the second", () => {
    /* This grid opens on 25 October, one column before November starts. */
    const cells = heatCells(habit, undefined, 8, "2026-12-16");
    expect(heatMonthLabels(cells, "en")).toEqual([
      { week: 1, label: "Nov" },
      { week: 6, label: "Dec" },
    ]);
  });
});

describe("trailingDayStates", () => {
  it("should return one state per day, oldest first, ending on today", () => {
    const habit = makeHabit({ createdAt: "2026-07-25" });
    const done = completedOn("2026-07-26", "2026-07-28");
    expect(trailingDayStates(habit, done, 7, TODAY)).toEqual([
      0, 0, 1, 2, 1, 2, 3,
    ]);
  });

  it("should return only today for a window of one day", () => {
    const habit = makeHabit({ createdAt: "2026-07-01" });
    expect(trailingDayStates(habit, completedOn(TODAY), 1, TODAY)).toEqual([2]);
  });

  it("should return an empty window for a window of no days", () => {
    const habit = makeHabit({ createdAt: "2026-07-01" });
    expect(trailingDayStates(habit, undefined, 0, TODAY)).toEqual([]);
  });

  it("should mark today as pending rather than missed while it is outstanding", () => {
    const habit = makeHabit({ createdAt: "2026-07-01" });
    const states = trailingDayStates(habit, undefined, 3, TODAY);
    expect(states[states.length - 1]).toBe(3);
  });

  it("should mark an unscheduled today as neither pending nor missed", () => {
    const habit = makeHabit({ createdAt: "2026-07-01", weekdays: [0, 6] });
    const states = trailingDayStates(habit, undefined, 3, TODAY);
    expect(states[states.length - 1]).toBe(0);
  });
});

describe("completionRate", () => {
  it("should count only scheduled days in the window", () => {
    const habit = makeHabit({ createdAt: "2026-07-01", weekdays: MON_WED_FRI });
    const done = completedOn("2026-07-27", TODAY);
    /* Monday, Wednesday and Friday fall three times in the trailing week. */
    expect(completionRate(habit, done, 7, TODAY)).toBeCloseTo(2 / 3);
  });

  it("should return one when every scheduled day in the window is done", () => {
    const habit = makeHabit({ createdAt: "2026-07-01" });
    const done = completedOn("2026-07-27", "2026-07-28", TODAY);
    expect(completionRate(habit, done, 3, TODAY)).toBe(1);
  });

  it("should return zero when the window holds no scheduled day", () => {
    const habit = makeHabit({ createdAt: "2026-07-01", weekdays: [] });
    expect(completionRate(habit, completedOn(TODAY), 7, TODAY)).toBe(0);
  });

  it("should return zero when the habit did not exist during the window", () => {
    const habit = makeHabit({ createdAt: "2026-08-01" });
    expect(completionRate(habit, undefined, 7, TODAY)).toBe(0);
  });

  it("should stop counting at the day the habit started", () => {
    const habit = makeHabit({ createdAt: "2026-07-28" });
    const done = completedOn("2026-07-28");
    /* Only the 28th and today are in range, so a single miss halves the rate. */
    expect(completionRate(habit, done, 30, TODAY)).toBe(0.5);
  });
});
