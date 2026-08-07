import type { STEP_KEYS } from "./use-onboarding-model";

export type OnboardingStep = {
  id: (typeof STEP_KEYS)[number]["id"];
  title: string;
  description: string;
  cta: string;
};
