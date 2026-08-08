import { WEEKDAY_KEYS } from "@/constants/habit-options";
import { isDaily, type Habit } from "@/lib/domain/types";
import type { TFunction } from "i18next";

/**
 * "Every day", "Mon, Wed, Fri", or "No days" - a habit's schedule in words.
 * Takes `t` rather than reaching for the active language, so this module stays
 * pure and the caller decides which language it is answering in.
 */
export function scheduleLabel(habit: Habit, t: TFunction<"schedule">): string {
  if (isDaily(habit)) return t("everyDay");
  if (habit.weekdays.length === 0) return t("noDays");
  return habit.weekdays.map((day) => t(WEEKDAY_KEYS[day].short)).join(", ");
}
