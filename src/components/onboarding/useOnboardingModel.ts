import { haptic } from "@/lib/haptics";
import {
  ensureNotificationPermission,
  getNotificationPermission,
} from "@/lib/notifications";
import { setOnboarded } from "@/lib/store";
import type * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";

type StepId = "welcome" | "consistency" | "reminders";

export type OnboardingStep = {
  id: StepId;
  title: string;
  description: string;
  cta: string;
};

export const STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "habitude",
    description:
      "A habit is a small thing done often. Track a few, and watch them add up.",
    cta: "Continue",
  },
  {
    id: "consistency",
    title: "See your consistency",
    description:
      "Every check-in fills a square. Streaks and history make the pattern obvious.",
    cta: "Continue",
  },
  {
    id: "reminders",
    title: "A nudge at the right time",
    description:
      "Give a habit a reminder time and habitude will tap you on the shoulder.",
    cta: "Allow notifications",
  },
];

/**
 * View model for the onboarding flow: the step it is on, the permission it asks
 * for at the end, and the transition between the two, so the flow itself only
 * renders.
 */
export function useOnboardingModel() {
  const reduceMotion = !!useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [permission, setPermission] =
    useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [requesting, setRequesting] = useState(false);
  const pendingIndex = useRef<number | null>(null);

  const step = STEPS[currentIndex];
  const isLast = currentIndex === STEPS.length - 1;
  const granted = permission?.granted === true;
  const cannotAsk =
    permission != null && !permission.granted && !permission.canAskAgain;
  const ctaLabel = !isLast
    ? step.cta
    : granted
      ? "Start tracking"
      : cannotAsk
        ? "Maybe later"
        : requesting
          ? "Requesting…"
          : step.cta;

  useEffect(() => {
    if (step.id === "reminders") {
      void getNotificationPermission().then(setPermission);
    }
  }, [step.id]);

  const navigateToStep = (index: number) => {
    if (index < 0 || index >= STEPS.length || index === currentIndex) return;
    if (reduceMotion) {
      pendingIndex.current = null;
      setVisible(true);
      setCurrentIndex(index);
      return;
    }
    pendingIndex.current = index;
    setVisible(false);
  };

  const handleTransitionEnd = () => {
    if (visible || pendingIndex.current === null) return;
    setCurrentIndex(pendingIndex.current);
    pendingIndex.current = null;
    setVisible(true);
  };

  const goBack = () => navigateToStep(currentIndex - 1);

  const advance = async () => {
    if (requesting) return;

    if (!isLast) {
      haptic.tap();
      navigateToStep(currentIndex + 1);
      return;
    }

    // Last step: ask once, then finish either way.
    if (!granted && !cannotAsk) {
      setRequesting(true);
      try {
        const allowed = await ensureNotificationPermission();
        setPermission(await getNotificationPermission());
        if (allowed) {
          haptic.success();
          return;
        }
      } finally {
        setRequesting(false);
      }
    }

    haptic.success();
    setOnboarded();
  };

  const skip = () => {
    haptic.tap();
    setOnboarded();
  };

  return {
    step,
    stepNumber: currentIndex + 1,
    stepCount: STEPS.length,
    currentIndex,
    isLast,
    reduceMotion,
    visible,
    requesting,
    permissionGranted: granted,
    ctaLabel,
    canGoBack: currentIndex > 0,
    canSkip: isLast && !granted,
    goBack,
    handleTransitionEnd,
    advance,
    skip,
  };
}
