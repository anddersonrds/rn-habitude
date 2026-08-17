import { ComposeSymbol } from "@/components/ui/compose-symbol";
import type { ConfirmRequest } from "@/lib/utils/confirmations";
import {
  AlertDialog,
  Host,
  Text,
  TextButton,
  useMaterialColors,
} from "@expo/ui/jetpack-compose";
import { useCallback, useState } from "react";
import type { Confirmation } from "./types";

/* What marks a destructive action, since Material 3 has no destructive button. */
const WARNING = "exclamationmark.triangle.fill";

type DialogProps = {
  request: ConfirmRequest;
  onDismiss: () => void;
  onAnswer: () => void;
};

/**
 * Inside the host rather than around it, because `useMaterialColors()` reads the
 * palette the host is themed with and that only exists below it.
 */
function Dialog({ request, onDismiss, onAnswer }: DialogProps) {
  const material = useMaterialColors();
  const destructive = request.destructive === true;

  return (
    <AlertDialog
      onDismissRequest={onDismiss}
      colors={
        destructive
          ? {
              iconContentColor: material.error,
              titleContentColor: material.error,
            }
          : undefined
      }
    >
      {destructive && (
        <AlertDialog.Icon>
          <ComposeSymbol name={WARNING} color={material.error} />
        </AlertDialog.Icon>
      )}
      <AlertDialog.Title>
        <Text>{request.title}</Text>
      </AlertDialog.Title>
      <AlertDialog.Text>
        <Text>{request.body}</Text>
      </AlertDialog.Text>
      <AlertDialog.ConfirmButton>
        <TextButton onClick={onAnswer}>
          <Text color={destructive ? material.error : undefined}>
            {request.confirmLabel}
          </Text>
        </TextButton>
      </AlertDialog.ConfirmButton>
      {request.cancelLabel != null && (
        <AlertDialog.DismissButton>
          <TextButton onClick={onDismiss}>
            <Text>{request.cancelLabel}</Text>
          </TextButton>
        </AlertDialog.DismissButton>
      )}
    </AlertDialog>
  );
}

export function useConfirm(): Confirmation {
  const [asked, setAsked] = useState<ConfirmRequest | null>(null);

  const confirm = useCallback((request: ConfirmRequest) => {
    setAsked(request);
  }, []);

  const dismiss = () => setAsked(null);

  const answer = () => {
    setAsked(null);
    asked?.onConfirm?.();
  };

  const dialog = asked ? (
    <Host matchContents>
      <Dialog request={asked} onDismiss={dismiss} onAnswer={answer} />
    </Host>
  ) : null;

  return { confirm, dialog };
}
