import { confirmDeleteHabit } from "@/lib/native/alerts";
import { formatFullDate, formatTime, todayKey, weekdayOf } from "@/lib/dates";
import { haptic } from "@/lib/native/haptics";
import { routes } from "@/lib/utils/routes";
import { deleteHabit, toggleCompletion, useAppState } from "@/lib/data/store";
import { computeStreaks } from "@/lib/domain/streaks";
import { isScheduledOn, type Habit } from "@/lib/domain/types";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TodayItem } from "./types";

/**
 * View model for the Today screen: all data shaping and actions live here so
 * the SwiftUI view stays a thin render layer.
 */
export function useTodayModel() {
  const { t, i18n } = useTranslation("today");
  const { t: tCommon } = useTranslation("common");
  const habits = useAppState((state) => state.habits);
  const completions = useAppState((state) => state.completions);
  const [celebrating, setCelebrating] = useState(false);

  const today = todayKey();
  const weekday = weekdayOf(today);
  const dateLabel = formatFullDate(today, i18n.language);

  const todayHabits = habits.filter(
    (habit) => isScheduledOn(habit, weekday) && habit.createdAt <= today,
  );

  const items: TodayItem[] = todayHabits.map((habit) => {
    const done = completions[habit.id]?.[today] === true;
    const streak = computeStreaks(habit, completions[habit.id], today)
      .current;
    const subtitle = [
      streak > 0 ? t("streak", { count: streak }) : null,
      habit.reminderTime ? formatTime(habit.reminderTime, i18n.language) : null,
    ]
      .filter(Boolean)
      .join("  ·  ");
    return { habit, done, streak, subtitle: subtitle.length > 0 ? subtitle : null };
  });

  const doneCount = items.filter((item) => item.done).length;
  const allDone = items.length > 0 && doneCount === items.length;
  const progress = items.length === 0 ? 1 : doneCount / items.length;

  /* Once per transition into a complete day, not once per render of one. */
  const wasAllDone = useRef(allDone);
  useEffect(() => {
    if (allDone && !wasAllDone.current) {
      setCelebrating(true);
      void haptic.celebrate();
    }
    wasAllDone.current = allDone;
  }, [allDone]);

  const toggle = (habit: Habit) => {
    const nowDone = toggleCompletion(habit.id, today);
    /* The celebration owns the last check-in's haptic, so one tap never fires
    two patterns. */
    const isFinalCheckIn =
      nowDone && doneCount + 1 === items.length && items.length > 0;
    if (isFinalCheckIn) return;
    if (nowDone) void haptic.checkIn();
    else haptic.tap();
  };

  const addHabit = () => {
    haptic.tap();
    router.push(routes.habitForm());
  };

  const editHabit = (habit: Habit) => router.push(routes.habitForm(habit.id));

  const showHistory = (habit: Habit) => router.push(routes.habitDetail(habit.id));

  const confirmDelete = (habit: Habit) => {
    haptic.warning();
    confirmDeleteHabit(habit.name, tCommon, () => deleteHabit(habit.id));
  };

  return {
    dateLabel,
    items,
    hasHabits: habits.length > 0,
    doneCount,
    allDone,
    progress,
    celebrating,
    celebrationColors: todayHabits.map((habit) => habit.color),
    endCelebration: () => setCelebrating(false),
    toggle,
    addHabit,
    editHabit,
    showHistory,
    confirmDelete,
  };
}
