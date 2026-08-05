import { useSyncExternalStore } from "react";

/* The change is applied while the app is invisible, so no frame shows two
languages at once. */
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

export function switchLanguage(change: () => void): void {
  pending = change;
  visible = false;
  emit();
}

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
