import { setSetting } from "../db";
import { emit } from "./state";

export function setOnboarded(): void {
  setSetting("onboarded", "1");
  emit();
}

/** Flips the onboarded flag off so the root layout shows the flow again. */
export function resetOnboarding(): void {
  setSetting("onboarded", "0");
  emit();
}
