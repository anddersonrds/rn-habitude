import type { TFunction } from "i18next";

export type ConfirmRequest = {
  title: string;
  body: string;
  confirmLabel: string;
  /** Absent on a message with nothing to decide, which offers one answer. */
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
};

export type Confirm = (request: ConfirmRequest) => void;

/* Raised by three screens, so its copy stays in one place. */
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
