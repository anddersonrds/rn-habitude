import { useHabitHeat } from "@/components/heat-graph/hooks/use-habit-heat";
import i18n from "@/i18n/i18next";
import { makeHabit } from "@/test-utils/factories";
import { freezeClock, restoreClock } from "@/test-utils/time";
import { renderHook } from "@testing-library/react-native";

/*
A Wednesday, so the last column is a partial week: the three days after it are
the future, which is a different blank from the days before the habit existed.
The grid ends on the Saturday of this week and starts on a Sunday.
*/
const TODAY = "2026-07-29T12:00:00-03:00";

const WEEKDAYS = [1, 2, 3, 4, 5];

const habit = makeHabit({ createdAt: "2026-07-15", weekdays: WEEKDAYS });

async function renderHeat(
  weeks: number,
  completed?: Record<string, true>,
  target = habit,
) {
  const { result } = await renderHook(() =>
    useHabitHeat(target, completed, weeks),
  );
  return result.current;
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
  freezeClock(TODAY);
});
afterEach(restoreClock);

describe("the columns", () => {
  it("should give a column of seven days for every week it is asked for", async () => {
    const heat = await renderHeat(3);

    expect(heat.columns).toHaveLength(3);
    expect(heat.columns.every((column) => column.length === 7)).toBe(true);
  });

  it("should say what happened on every day of a week", async () => {
    const heat = await renderHeat(3, { "2026-07-16": true });

    expect(heat.columns[0]).toEqual([
      /* The habit began on the 15th, a Wednesday. */
      "empty",
      "empty",
      "empty",
      "missed",
      "done",
      "missed",
      "unscheduled",
    ]);
  });

  it("should call today pending rather than missed while the day is open", async () => {
    const heat = await renderHeat(1);

    expect(heat.columns[0][3]).toBe("pending");
  });

  it("should call today done once it is checked off", async () => {
    const heat = await renderHeat(1, { "2026-07-29": true });

    expect(heat.columns[0][3]).toBe("done");
  });

  it("should leave the days after today blank", async () => {
    const heat = await renderHeat(1);

    expect(heat.columns[0].slice(4)).toEqual(["empty", "empty", "empty"]);
  });

  it("should track back to a record older than the habit's own start date", async () => {
    const heat = await renderHeat(3, { "2026-07-13": true });

    expect(heat.columns[0].slice(0, 4)).toEqual([
      "empty",
      "done",
      "missed",
      "missed",
    ]);
  });

  it("should have nothing to draw without a habit", async () => {
    const { result } = await renderHook(() =>
      useHabitHeat(undefined, undefined, 3),
    );

    expect(result.current.columns).toEqual([]);
  });
});

describe("the labels", () => {
  it("should name the column each new month starts on", async () => {
    const heat = await renderHeat(6);

    expect(heat.monthLabels).toEqual([
      { week: 0, label: "Jun" },
      { week: 2, label: "Jul" },
    ]);
  });

  it("should name the months in the app's language", async () => {
    await i18n.changeLanguage("fr");

    const heat = await renderHeat(6);

    expect(heat.monthLabels.map((month) => month.label)).toEqual([
      "juin",
      "juil.",
    ]);
  });

  it("should name every other weekday, so the initials never crowd", async () => {
    const heat = await renderHeat(6);

    expect(heat.weekdayLabels).toEqual(["", "M", "", "W", "", "F", ""]);
  });

  it("should begin the week where the app's language begins it", async () => {
    await i18n.changeLanguage("fr");

    const heat = await renderHeat(6);

    /* A Monday-start week names Tuesday, Thursday and Saturday instead. */
    expect(heat.weekdayLabels).toEqual(["", "M", "", "J", "", "S", ""]);
  });
});
