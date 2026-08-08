import type { TFunction } from "i18next";
import { addDays, todayKey } from "../utils/dates";
import { db } from "./db";
import { isScheduledOn, type Habit } from "../domain/types";

/** Deterministic PRNG so "Load sample data" always paints the same story. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WEEKS = 12;

type SampleDef = {
  /** A key in the `sampleData` namespace, not the name itself. */
  name: "walk" | "medicine" | "water" | "read" | "workout";
  icon: string;
  color: string;
  weekdays: number[];
  reminderTime: string | null;
  /** Baseline chance of completing a scheduled day. */
  adherence: number;
  /** Complete today too? Most stay pending so Today has work left. */
  doneToday: boolean;
};

const SAMPLES: SampleDef[] = [
  {
    name: "walk",
    icon: "figure.walk",
    color: "#34C759",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: "07:30",
    adherence: 0.87,
    doneToday: true,
  },
  {
    name: "medicine",
    icon: "pills.fill",
    color: "#FF3B30",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: "09:00",
    adherence: 0.95,
    doneToday: false,
  },
  {
    name: "water",
    icon: "drop.fill",
    color: "#007AFF",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: null,
    adherence: 0.72,
    doneToday: false,
  },
  {
    name: "read",
    icon: "book.fill",
    color: "#5856D6",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: "21:00",
    adherence: 0.6,
    doneToday: false,
  },
  {
    name: "workout",
    icon: "dumbbell.fill",
    color: "#FF9500",
    weekdays: [1, 3, 5],
    reminderTime: null,
    adherence: 0.8,
    doneToday: false,
  },
];

/**
 * Seeds sample habits with twelve weeks of realistic history. Idempotent: a
 * previous sample run is replaced. Returns the habits that carry a reminder so
 * the caller can schedule notifications for them.
 *
 * Takes `t` rather than reaching for the active language, so this module stays
 * pure. The names are written into the database, so they keep whichever
 * language was active here: from this point on they are rows the user owns.
 */
export function seedSampleData(t: TFunction<"sampleData">): Habit[] {
  const random = mulberry32(20260728);
  const today = todayKey();
  const start = addDays(today, -(WEEKS * 7 - 1));
  const created: Habit[] = [];

  db.withTransactionSync(() => {
    /* Replace any previous sample run. */
    db.runSync(
      "DELETE FROM completions WHERE habit_id IN (SELECT id FROM habits WHERE id LIKE 'sample-%')",
    );
    db.runSync("DELETE FROM habits WHERE id LIKE 'sample-%'");

    SAMPLES.forEach((def, index) => {
      const habit: Habit = {
        id: `sample-${index}`,
        name: t(def.name),
        icon: def.icon,
        color: def.color,
        weekdays: def.weekdays,
        reminderTime: def.reminderTime,
        createdAt: start,
        notificationIds: [],
      };
      db.runSync(
        `INSERT INTO habits (id, name, icon, color, weekdays, reminder_time, created_at, notification_ids, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, '[]', ?)`,
        [
          habit.id,
          habit.name,
          habit.icon,
          habit.color,
          JSON.stringify(habit.weekdays),
          habit.reminderTime,
          habit.createdAt,
          index,
        ],
      );

      /* Autocorrelated rather than independent: yesterday's outcome shifts
      today's odds, which is what makes the seeded history read human. */
      let didYesterday: boolean = true;
      for (let day = start; day <= today; day = addDays(day, 1)) {
        const weekday = new Date(`${day}T12:00:00`).getDay();
        if (!isScheduledOn(habit, weekday)) continue;
        const isToday = day === today;
        const chance: number = def.adherence + (didYesterday ? 0.1 : -0.18);
        const done: boolean = isToday ? def.doneToday : random() < chance;
        if (done) {
          db.runSync(
            "INSERT OR IGNORE INTO completions (habit_id, date, completed_at) VALUES (?, ?, ?)",
            [habit.id, day, `${day}T12:00:00.000Z`],
          );
        }
        didYesterday = done;
      }

      if (habit.reminderTime) created.push(habit);
    });
  });

  return created;
}
