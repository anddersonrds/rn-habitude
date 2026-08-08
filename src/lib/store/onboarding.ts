import { setSetting } from "../db";
import { emit } from "./state";

export function setOnboarded(): void {
  setSetting("onboarded", "1");
  emit();
}

export function resetOnboarding(): void {
  setSetting("onboarded", "0");
  emit();
}
