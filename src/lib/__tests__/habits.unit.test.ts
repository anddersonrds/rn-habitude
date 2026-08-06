import i18n from "@/i18n/i18next";
import { scheduleLabel } from "@/lib/habits";
import type { Habit } from "@/lib/types";
import { makeHabit } from "@/test-utils/factories";

function habit(weekdays: number[]): Habit {
  return makeHabit({ weekdays });
}

/* Fixed rather than active: the function takes the language it answers in, so
each case says which one it means instead of inheriting one. */
const en = i18n.getFixedT("en", "schedule");
const ptBR = i18n.getFixedT("pt-BR", "schedule");

describe("scheduleLabel", () => {
  it("should say a habit on all seven days runs every day", () => {
    expect(scheduleLabel(habit([0, 1, 2, 3, 4, 5, 6]), en)).toBe("Every day");
  });

  it("should abbreviate the days a habit runs on, in the order it holds them", () => {
    expect(scheduleLabel(habit([1, 3, 5]), en)).toBe("Mon, Wed, Fri");
  });

  it("should name a single day on its own", () => {
    expect(scheduleLabel(habit([0]), en)).toBe("Sun");
  });

  it("should say a habit on no days at all runs on none", () => {
    expect(scheduleLabel(habit([]), en)).toBe("No days");
  });

  it("should answer in the language it was given rather than in English", () => {
    expect(scheduleLabel(habit([0, 1, 2, 3, 4, 5, 6]), ptBR)).toBe("Todo dia");
    expect(scheduleLabel(habit([1, 3, 5]), ptBR)).toBe("Seg, Qua, Sex");
    expect(scheduleLabel(habit([]), ptBR)).toBe("Nenhum dia");
  });
});

/* The abbreviation is a key of its own rather than the name cut to three
characters. Nothing here can prove that: every Portuguese abbreviation happens
to equal its own first three letters, so an assertion against these two
catalogs would pass either way. The languages that make the difference visible
arrive with the Korean and Japanese catalogs, and it is asserted there. */
