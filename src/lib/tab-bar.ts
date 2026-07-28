import { useSyncExternalStore } from "react";

let hidden = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  return hidden;
}

/** Hides the native tab bar while a screen owns the full viewport (edit mode). */
export function setTabBarHidden(nextHidden: boolean): void {
  if (hidden === nextHidden) return;
  hidden = nextHidden;
  listeners.forEach((listener) => listener());
}

export function useTabBarHidden(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
