import HabitudeWidget, {
  WIDGET_DAYS,
  type HabitudeWidgetProps,
  type WidgetHabitRow,
} from "../../../widgets/HabitudeWidget";
import { todayKey, weekdayOf } from "../dates";
import { computeStreaks, trailingDayStates } from "../domain/streaks";
import { isScheduledOn, type AppState } from "../domain/types";

/**
 * Builds without `HABITUDE_WIDGET=1` ship no widget extension, so the sync is
 * expected to fail. Report it once instead of on every store mutation.
 */
let warnedAboutSync = false;

/**
 * Pushes the current heat data to the home screen widget. Called after every
 * store mutation so the widget always mirrors real data.
 */
export function syncWidgetFromState(state: AppState): void {
  try {
    const today = todayKey();
    const weekday = weekdayOf(today);

    const rows: WidgetHabitRow[] = state.habits.slice(0, 4).map((habit) => {
      const done = state.completions[habit.id];
      return {
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        days: trailingDayStates(habit, done, WIDGET_DAYS, today),
        streak: computeStreaks(habit, done, today).current,
      };
    });

    const dueHabits = state.habits.filter(
      (habit) => isScheduledOn(habit, weekday) && habit.createdAt <= today,
    );

    const props: HabitudeWidgetProps = {
      rows,
      totalHabits: state.habits.length,
      doneToday: dueHabits.filter(
        (habit) => state.completions[habit.id]?.[today] === true,
      ).length,
      dueToday: dueHabits.length,
      date: today,
    };
    HabitudeWidget.updateSnapshot(props);
  } catch (error) {
    /* Swallowed rather than rethrown: a widget that cannot update must not
    take a check-in down with it. */
    if (!warnedAboutSync) {
      warnedAboutSync = true;
      console.warn("Widget sync unavailable:", error);
    }
  }
}
