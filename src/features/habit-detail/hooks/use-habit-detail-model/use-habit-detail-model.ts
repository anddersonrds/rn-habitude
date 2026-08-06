import { formatTime, todayKey, weekdayOf } from "@/lib/dates";
import { scheduleLabel } from "@/lib/habits";
import { haptic } from "@/lib/haptics";
import { toggleCompletion, useAppState } from "@/lib/store";
import { completionRate, computeStreaks } from "@/lib/streaks";
import { isScheduledOn } from "@/lib/types";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * View model for the habit detail screen. Returns null once the habit it was
 * showing is gone, which is also when it sends the screen back.
 */
export function useHabitDetailModel() {
  const { i18n } = useTranslation();
  const { t: tSchedule } = useTranslation("schedule");
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useAppState();
  const habit = state.habits.find((candidate) => candidate.id === id);

  useEffect(() => {
    if (!habit && router.canGoBack()) router.back();
  }, [habit]);

  if (!habit) return null;

  const today = todayKey();
  const completed = state.completions[habit.id];
  const streaks = computeStreaks(habit, completed, today);
  /* Typed as `Href` so the destination is still checked once it leaves the
  template literal the router would otherwise narrow itself. */
  const historyHref: Href = `/habit-history?id=${habit.id}`;

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
    historyHref,
    toggleToday: () => {
      const nowDone = toggleCompletion(habit.id, today);
      if (nowDone) void haptic.checkIn();
      else haptic.tap();
    },
    editHabit: () => router.push(`/habit-form?id=${habit.id}`),
  };
}
