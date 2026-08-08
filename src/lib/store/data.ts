import type { TFunction } from "i18next";
import { db } from "../db";
import { cancelAllReminders, cancelReminders } from "../notifications";
import { seedSampleData } from "../sample-data";
import { refreshReminders } from "./habits";
import { emit, getAppState } from "./state";

export async function deleteAllData(): Promise<void> {
  await cancelAllReminders();
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM completions");
    db.runSync("DELETE FROM habits");
  });
  emit();
}

export function loadSampleData(t: TFunction<"sampleData">): void {
  const previousReminderIds = getAppState()
    .habits.filter((habit) => habit.id.startsWith("sample-"))
    .flatMap((habit) => habit.notificationIds);
  if (previousReminderIds.length > 0) {
    void cancelReminders(previousReminderIds);
  }
  const habitsWithReminders = seedSampleData(t);
  emit();
  for (const habit of habitsWithReminders) {
    void refreshReminders(habit);
  }
}
