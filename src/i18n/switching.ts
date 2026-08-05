import { useSyncExternalStore } from "react";

/*
The cross-fade the root layout plays while the language changes. The settings
row asks for it and hands over what to apply; the root runs the fade and applies
the change while the app is invisible, so no frame ever shows two languages at
once. Nothing is keyed on the language, so the tree is not remounted and the
navigation stack survives the switch.
*/
let visible = true;
let pending: (() => void) | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  return visible;
}

/** Fades the app out, holding `change` until the fade reports back. */
export function switchLanguage(change: () => void): void {
  pending = change;
  visible = false;
  emit();
}

/** Applies whatever the fade was waiting on, then fades back in. */
function applyPending(): void {
  if (pending === null) return;
  const change = pending;
  pending = null;
  visible = true;
  change();
  emit();
}

export function useLanguageSwitch(): {
  visible: boolean;
  onTransitionEnd: () => void;
} {
  return {
    visible: useSyncExternalStore(subscribe, getSnapshot, getSnapshot),
    onTransitionEnd: applyPending,
  };
}
