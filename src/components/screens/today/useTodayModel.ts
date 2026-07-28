import { formatTime, todayKey, weekdayOf } from "@/lib/dates";
import { haptic } from "@/lib/haptics";
import { deleteHabit, toggleCompletion, useAppState } from "@/lib/store";
import { computeStreaks } from "@/lib/streaks";
import { isScheduledOn, type Habit } from "@/lib/types";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

export type TodayItem = {
  habit: Habit;
  done: boolean;
  streak: number;
  /** "3-day streak · 7:30 AM", or null when there's nothing to show. */
  subtitle: string | null;
};

/**
 * View model for the Today screen: all data shaping and actions live here so
 * the SwiftUI view stays a thin render layer.
 */
export function useTodayModel() {
  const state = useAppState();
  const [celebrating, setCelebrating] = useState(false);

  const today = todayKey();
  const weekday = weekdayOf(today);
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const todayHabits = state.habits.filter(
    (habit) => isScheduledOn(habit, weekday) && habit.createdAt <= today,
  );

  const items: TodayItem[] = todayHabits.map((habit) => {
    const done = state.completions[habit.id]?.[today] === true;
    const streak = computeStreaks(habit, state.completions[habit.id], today)
      .current;
    const subtitle = [
      streak > 0 ? `${streak}-day streak` : null,
      habit.reminderTime ? formatTime(habit.reminderTime) : null,
    ]
      .filter(Boolean)
      .join("  ·  ");
    return { habit, done, streak, subtitle: subtitle.length > 0 ? subtitle : null };
  });

  const doneCount = items.filter((item) => item.done).length;
  const allDone = items.length > 0 && doneCount === items.length;
  const progress = items.length === 0 ? 1 : doneCount / items.length;

  // Celebrate the transition into a fully complete day, once per transition.
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
    // The celebration owns the haptic for the last check-in of the day, so a
    // single tap never fires two overlapping patterns.
    const isFinalCheckIn =
      nowDone && doneCount + 1 === items.length && items.length > 0;
    if (isFinalCheckIn) return;
    if (nowDone) void haptic.checkIn();
    else haptic.tap();
  };

  const addHabit = () => {
    haptic.tap();
    router.push("/habit-form");
  };

  const editHabit = (habit: Habit) => router.push(`/habit-form?id=${habit.id}`);

  const showHistory = (habit: Habit) => router.push(`/habit/${habit.id}`);

  const confirmDelete = (habit: Habit) => {
    haptic.warning();
    Alert.alert(
      `Delete "${habit.name}"?`,
      "This permanently deletes the habit and its history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteHabit(habit.id),
        },
      ],
    );
  };

  return {
    dateLabel,
    items,
    hasHabits: state.habits.length > 0,
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
