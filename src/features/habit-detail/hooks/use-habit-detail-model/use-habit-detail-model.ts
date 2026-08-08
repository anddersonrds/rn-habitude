import { formatTime, todayKey, weekdayOf } from "@/lib/dates";
import { scheduleLabel } from "@/lib/domain/habits";
import { haptic } from "@/lib/native/haptics";
import { useHabitFromRoute } from "@/lib/hooks/use-habit-from-route";
import { toggleCompletion, useAppState } from "@/lib/data/store";
import { completionRate, computeStreaks } from "@/lib/domain/streaks";
import { isScheduledOn } from "@/lib/domain/types";
import { routes } from "@/lib/utils/routes";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

/** Null once the habit is gone, which is also when it sends the screen back. */
export function useHabitDetailModel() {
  const { i18n } = useTranslation();
  const { t: tSchedule } = useTranslation("schedule");
  const habits = useAppState((state) => state.habits);
  const completions = useAppState((state) => state.completions);
  const habit = useHabitFromRoute(habits);

  if (!habit) return null;

  const today = todayKey();
  const completed = completions[habit.id];
  const streaks = computeStreaks(habit, completed, today);

  const subtitle = [
    scheduleLabel(habit, tSchedule),
    habit.reminderTime ? formatTime(habit.reminderTime, i18n.language) : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return {
    habit,
    completed,
    subtitle,
    streaks,
    rate: completionRate(habit, completed, 30, today),
    scheduledToday: isScheduledOn(habit, weekdayOf(today)),
    doneToday: completed?.[today] === true,
    historyHref: routes.habitHistory(habit.id),
    toggleToday: () => {
      const nowDone = toggleCompletion(habit.id, today);
      if (nowDone) void haptic.checkIn();
      else haptic.tap();
    },
    editHabit: () => router.push(routes.habitForm(habit.id)),
  };
}
