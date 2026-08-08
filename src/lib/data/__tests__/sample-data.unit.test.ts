/* eslint-disable @typescript-eslint/no-require-imports --
the database module applies its schema at import, so each case has to reload it
rather than close over one instance.
*/
import i18n from "@/i18n/i18next";
import { addDays, weekdayOf } from "@/lib/utils/dates";
import { resetDatabase } from "@/test-utils/sqlite";
import { freezeClock, restoreClock } from "@/test-utils/time";

/* A Wednesday. */
const TODAY = "2026-07-29";

/** Twelve weeks of history, ending today. */
const HISTORY_STARTS = addDays(TODAY, -(12 * 7 - 1));

/* Fixed rather than active: the seed takes the language it writes in, so each
case says which one it means instead of inheriting one. */
const inEnglish = i18n.getFixedT("en", "sampleData");
const inPortuguese = i18n.getFixedT("pt-BR", "sampleData");

type Loaded = {
  seedSampleData: typeof import("@/lib/data/sample-data").seedSampleData;
  db: typeof import("@/lib/data/db").db;
};

function freshSampleData(): Loaded {
  resetDatabase();
  jest.resetModules();
  return {
    seedSampleData: require("@/lib/data/sample-data").seedSampleData,
    db: require("@/lib/data/db").db,
  };
}

function habitRows(db: Loaded["db"]) {
  return db.getAllSync<{ id: string; created_at: string; weekdays: string }>(
    "SELECT id, created_at, weekdays FROM habits ORDER BY sort_order",
  );
}

function habitNames(db: Loaded["db"]): string[] {
  return db
    .getAllSync<{ name: string }>("SELECT name FROM habits ORDER BY sort_order")
    .map((row) => row.name);
}

function completionDates(db: Loaded["db"], habitId: string): string[] {
  return db
    .getAllSync<{ date: string }>(
      "SELECT date FROM completions WHERE habit_id = ? ORDER BY date",
      [habitId],
    )
    .map((row) => row.date);
}

beforeEach(() => freezeClock(`${TODAY}T12:00:00-03:00`));
afterEach(restoreClock);

describe("seedSampleData", () => {
  it("should insert every sample habit with twelve weeks of history behind it", () => {
    const { seedSampleData, db } = freshSampleData();

    seedSampleData(inEnglish);

    const rows = habitRows(db);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.id.startsWith("sample-"))).toBe(true);
    expect(rows.every((row) => row.created_at === HISTORY_STARTS)).toBe(true);
  });

  it("should name the habits in the language it was given", () => {
    const { seedSampleData, db } = freshSampleData();

    seedSampleData(inPortuguese);

    expect(habitNames(db)).toEqual([
      "Caminhar ao ar livre",
      "Tomar o remédio",
      "Beber água",
      "Ler 20 minutos",
      "Treinar",
    ]);
  });

  it("should leave a seeded name in the language it was seeded in", () => {
    const { seedSampleData, db } = freshSampleData();
    seedSampleData(inPortuguese);

    /* A later switch does not rewrite the rows: from the moment they are
    written they are habits the user owns and may have renamed. */
    void i18n.changeLanguage("en");

    expect(habitNames(db)[0]).toBe("Caminhar ao ar livre");
  });

  it("should give every sample habit completions to draw", () => {
    const { seedSampleData, db } = freshSampleData();

    seedSampleData(inEnglish);

    for (const row of habitRows(db)) {
      expect(completionDates(db, row.id).length).toBeGreaterThan(0);
    }
  });

  it("should return the habits that carry a reminder, and only those", () => {
    const { seedSampleData } = freshSampleData();

    const needingReminders = seedSampleData(inEnglish);

    expect(needingReminders.length).toBeGreaterThan(0);
    expect(
      needingReminders.every((habit) => habit.reminderTime !== null),
    ).toBe(true);
  });

  it("should never complete a day the habit is not scheduled on", () => {
    const { seedSampleData, db } = freshSampleData();

    seedSampleData(inEnglish);

    for (const row of habitRows(db)) {
      const weekdays: number[] = JSON.parse(row.weekdays);
      const offSchedule = completionDates(db, row.id).filter(
        (date) => !weekdays.includes(weekdayOf(date)),
      );
      expect(offSchedule).toEqual([]);
    }
  });

  it("should never complete a day before the history starts or after today", () => {
    const { seedSampleData, db } = freshSampleData();

    seedSampleData(inEnglish);

    for (const row of habitRows(db)) {
      const dates = completionDates(db, row.id);
      expect(dates[0] >= HISTORY_STARTS).toBe(true);
      expect(dates[dates.length - 1] <= TODAY).toBe(true);
    }
  });

  it("should paint the same story every time it runs", () => {
    const first = freshSampleData();
    first.seedSampleData(inEnglish);
    const painted = habitRows(first.db).map((row) => [
      row.id,
      completionDates(first.db, row.id),
    ]);

    const second = freshSampleData();
    second.seedSampleData(inEnglish);

    expect(
      habitRows(second.db).map((row) => [
        row.id,
        completionDates(second.db, row.id),
      ]),
    ).toEqual(painted);
  });

  it("should replace a previous run instead of stacking a second one on it", () => {
    const { seedSampleData, db } = freshSampleData();
    seedSampleData(inEnglish);
    const first = habitRows(db).map((row) => row.id);

    seedSampleData(inEnglish);

    expect(habitRows(db).map((row) => row.id)).toEqual(first);
  });

  it("should leave a habit the user created alone", () => {
    const { seedSampleData, db } = freshSampleData();
    db.runSync(
      `INSERT INTO habits (id, name, icon, color, weekdays, reminder_time, created_at, notification_ids, sort_order)
       VALUES ('mine', 'Mine', 'star', '#32ADE6', '[0,1,2,3,4,5,6]', NULL, ?, '[]', 99)`,
      [TODAY],
    );

    seedSampleData(inEnglish);

    expect(habitRows(db).map((row) => row.id)).toContain("mine");
  });

  it("should leave one habit checked in today, so Today opens with work left", () => {
    const { seedSampleData, db } = freshSampleData();

    seedSampleData(inEnglish);

    const doneToday = habitRows(db).filter((row) =>
      completionDates(db, row.id).includes(TODAY),
    );
    expect(doneToday).toHaveLength(1);
  });
});
