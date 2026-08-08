import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { todayKey } from "../dates";
import { MARK_DONE_ACTION, registerNotificationCategories } from "./notifications";
import { completeHabit } from "../data/store";

/** Handles the "Check in" action on a reminder notification. */
function handleResponse(
  response: Notifications.NotificationResponse | null,
): void {
  if (response?.actionIdentifier !== MARK_DONE_ACTION) return;
  const habitId = response.notification.request.content.data?.habitId;
  if (typeof habitId !== "string") return;
  completeHabit(habitId, todayKey());
}

/**
 * Registers the reminder notification category and reacts to its action button.
 * Handles both a running app (listener) and a cold start triggered by the
 * action (last response). `completeHabit` is idempotent, so seeing the same
 * response through both paths is harmless.
 */
export function useNotificationActions(): void {
  useEffect(() => {
    void registerNotificationCategories();

    handleResponse(Notifications.getLastNotificationResponse() ?? null);
    Notifications.clearLastNotificationResponse();

    const subscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, []);
}
