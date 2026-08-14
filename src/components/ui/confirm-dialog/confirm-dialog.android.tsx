import { ComposeSymbol } from "@/components/ui/compose-symbol";
import { accent, colors } from "@/theme";
import { AlertDialog, Host, Text, TextButton } from "@expo/ui/jetpack-compose";
import { useCallback, useState } from "react";
import { useColorScheme } from "react-native";
import type { Confirmation, ConfirmRequest } from "./types";

/* What marks a destructive action, since Material 3 has no destructive button. */
const WARNING = "exclamationmark.triangle.fill";

/**
 * The Material 3 dialog, which is declarative and needs React state, so the
 * confirmation is a hook returning the element rather than the imperative call
 * `Alert.alert` is on iOS.
 */
export function useConfirm(): Confirmation {
  const scheme = useColorScheme();
  const [asked, setAsked] = useState<ConfirmRequest | null>(null);

  const confirm = useCallback((request: ConfirmRequest) => {
    setAsked(request);
  }, []);

  const dismiss = () => setAsked(null);

  const answer = () => {
    setAsked(null);
    asked?.onConfirm();
  };

  const destructive = asked?.destructive === true;

  const dialog = asked ? (
    <Host matchContents colorScheme={scheme} seedColor={accent}>
      <AlertDialog
        onDismissRequest={dismiss}
        colors={
          destructive
            ? {
                iconContentColor: colors.destructive,
                titleContentColor: colors.destructive,
              }
            : undefined
        }
      >
        {destructive && (
          <AlertDialog.Icon>
            <ComposeSymbol name={WARNING} color={colors.destructive} />
          </AlertDialog.Icon>
        )}
        <AlertDialog.Title>
          <Text>{asked.title}</Text>
        </AlertDialog.Title>
        <AlertDialog.Text>
          <Text>{asked.body}</Text>
        </AlertDialog.Text>
        <AlertDialog.ConfirmButton>
          <TextButton onClick={answer}>
            <Text color={destructive ? String(colors.destructive) : undefined}>
              {asked.confirmLabel}
            </Text>
          </TextButton>
        </AlertDialog.ConfirmButton>
        <AlertDialog.DismissButton>
          <TextButton onClick={dismiss}>
            <Text>{asked.cancelLabel}</Text>
          </TextButton>
        </AlertDialog.DismissButton>
      </AlertDialog>
    </Host>
  ) : null;

  return { confirm, dialog };
}
