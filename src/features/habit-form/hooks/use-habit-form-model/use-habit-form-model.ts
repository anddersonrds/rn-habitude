import {
  ALL_WEEKDAYS,
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_ICON,
} from "@/constants/habit-options";
import { alertNotificationsOff, confirmDeleteHabit } from "@/lib/alerts";
import { haptic } from "@/lib/haptics";
import { ensureNotificationPermission } from "@/lib/notifications";
import { createHabit, deleteHabit, updateHabit, useAppState } from "@/lib/data/store";
import { routes } from "@/lib/utils/routes";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";
import type { FrequencyChoice } from "./types";

/** The habit form's two modes, as the screen asks about them. */
const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];
const DEFAULT_REMINDER_TIME = "09:00";

function timeToDate(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function dateToTime(date: Date): string {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * View model for the habit form: the draft habit, what makes it valid, and
 * every action the form can take, so the SwiftUI view stays a thin render layer.
 */
export function useHabitFormModel() {
  const { t } = useTranslation("habitForm");
  const { t: tCommon } = useTranslation("common");
  const { id } = useLocalSearchParams<{ id?: string }>();
  const habits = useAppState((state) => state.habits);
  const editing = id ? habits.find((habit) => habit.id === id) : undefined;

  const [name, setName] = useState(editing?.name ?? "");
  const [icon, setIcon] = useState<string>(editing?.icon ?? DEFAULT_HABIT_ICON);
  const [color, setColor] = useState(editing?.color ?? DEFAULT_HABIT_COLOR);
  const [daily, setDaily] = useState(
    editing ? editing.weekdays.length === 7 : true,
  );
  const [weekdays, setWeekdays] = useState<number[]>(
    editing && editing.weekdays.length < 7 ? editing.weekdays : DEFAULT_WEEKDAYS,
  );
  const [reminderOn, setReminderOn] = useState(editing?.reminderTime != null);
  const [reminderTime, setReminderTime] = useState(
    editing?.reminderTime ?? DEFAULT_REMINDER_TIME,
  );

  const trimmedName = name.trim();
  const effectiveWeekdays = daily
    ? ALL_WEEKDAYS
    : [...weekdays].sort((a, b) => a - b);
  const canSave = trimmedName.length > 0 && effectiveWeekdays.length > 0;

  const toggleWeekday = (day: number) => {
    Keyboard.dismiss();
    haptic.selection();
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((weekday) => weekday !== day)
        : [...current, day],
    );
  };

  const chooseFrequency = (choice: FrequencyChoice) => {
    Keyboard.dismiss();
    if ((choice === "daily") === daily) return;
    haptic.selection();
    setDaily(choice === "daily");
  };

  const selectIcon = (symbol: string) => {
    Keyboard.dismiss();
    haptic.selection();
    setIcon(symbol);
  };

  const selectColor = (optionColor: string) => {
    Keyboard.dismiss();
    haptic.selection();
    setColor(optionColor);
  };

  const leaveForm = () => {
    if (router.canGoBack()) router.back();
    else router.replace(routes.home());
  };

  const cancel = () => {
    Keyboard.dismiss();
    leaveForm();
  };

  const save = () => {
    Keyboard.dismiss();
    if (!canSave) return;
    const input = {
      name: trimmedName,
      icon,
      color,
      weekdays: effectiveWeekdays,
      reminderTime: reminderOn ? reminderTime : null,
    };
    if (editing) updateHabit(editing.id, input);
    else createHabit(input);
    haptic.success();
    leaveForm();
  };

  const toggleReminder = async (enabled: boolean) => {
    Keyboard.dismiss();
    if (!enabled) {
      setReminderOn(false);
      return;
    }

    const granted = await ensureNotificationPermission();
    if (granted) {
      setReminderOn(true);
      haptic.selection();
      return;
    }

    alertNotificationsOff({
      title: t("notificationsOffTitle"),
      body: t("notificationsOffBody"),
      dismiss: t("notNow"),
      openSettings: t("openSettings"),
    });
  };

  const confirmDelete = () => {
    if (!editing) return;
    haptic.warning();
    confirmDeleteHabit(editing.name, tCommon, () => {
      deleteHabit(editing.id);
      leaveForm();
    });
  };

  return {
    isEditing: editing != null,
    name,
    setName,
    icon,
    color,
    daily,
    frequency: (daily ? "daily" : "specific") as FrequencyChoice,
    weekdays,
    reminderOn,
    /** The date picker works in `Date`; the habit stores "HH:mm". */
    reminderDate: timeToDate(reminderTime),
    canSave,
    toggleWeekday,
    chooseFrequency,
    selectIcon,
    selectColor,
    toggleReminder,
    pickReminderTime: (date: Date) => setReminderTime(dateToTime(date)),
    save,
    cancel,
    confirmDelete,
  };
}
