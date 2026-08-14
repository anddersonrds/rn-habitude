import type { TFunction } from "i18next";

/** What a confirmation asks, and what it runs when the answer is yes. */
export type ConfirmRequest = {
  title: string;
  body: string;
  confirmLabel: string;
  /** Absent on a message with nothing to decide, which offers one answer. */
  cancelLabel?: string;
  /** Marked as destructive, which is the whole difference on Android. */
  destructive?: boolean;
  onConfirm?: () => void;
};

export type Confirm = (request: ConfirmRequest) => void;

/** The delete confirmation three screens raise, so its copy stays one place. */
export function deleteHabitRequest(
  name: string,
  t: TFunction<"common">,
  onConfirm: () => void,
): ConfirmRequest {
  return {
    title: t("deleteHabitTitle", { name }),
    body: t("deleteHabitBody"),
    confirmLabel: t("delete"),
    cancelLabel: t("cancel"),
    destructive: true,
    onConfirm,
  };
}
