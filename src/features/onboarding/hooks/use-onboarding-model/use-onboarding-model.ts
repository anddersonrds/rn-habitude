import { haptic } from "@/lib/haptics";
import {
  ensureNotificationPermission,
  getNotificationPermission,
} from "@/lib/notifications";
import { setOnboarded } from "@/lib/data/store";
import type * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "react-native-reanimated";
import type { OnboardingStep } from "./types";

/**
 * The steps as keys rather than as copy. The strings are looked up per render:
 * a module-scope constant would freeze whatever language was active at import
 * and never follow a switch.
 */
export const STEP_KEYS = [
  {
    id: "welcome",
    title: "welcomeTitle",
    description: "welcomeDescription",
    cta: "welcomeCta",
  },
  {
    id: "consistency",
    title: "consistencyTitle",
    description: "consistencyDescription",
    cta: "consistencyCta",
  },
  {
    id: "reminders",
    title: "remindersTitle",
    description: "remindersDescription",
    cta: "remindersCta",
  },
] as const;

export const STEP_COUNT = STEP_KEYS.length;

/**
 * View model for the onboarding flow: the step it is on, the permission it asks
 * for at the end, and the transition between the two, so the flow itself only
 * renders.
 */
export function useOnboardingModel() {
  const { t } = useTranslation("onboarding");
  const reduceMotion = !!useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [permission, setPermission] =
    useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [requesting, setRequesting] = useState(false);
  const pendingIndex = useRef<number | null>(null);

  const keys = STEP_KEYS[currentIndex];
  const step: OnboardingStep = {
    id: keys.id,
    title: t(keys.title),
    description: t(keys.description),
    cta: t(keys.cta),
  };
  const isLast = currentIndex === STEP_COUNT - 1;
  const granted = permission?.granted === true;
  const cannotAsk =
    permission != null && !permission.granted && !permission.canAskAgain;
  const ctaLabel = !isLast
    ? step.cta
    : granted
      ? t("startTracking")
      : cannotAsk
        ? t("maybeLater")
        : requesting
          ? t("requesting")
          : step.cta;

  useEffect(() => {
    if (step.id === "reminders") {
      void getNotificationPermission().then(setPermission);
    }
  }, [step.id]);

  const navigateToStep = (index: number) => {
    if (index < 0 || index >= STEP_COUNT || index === currentIndex) return;
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

    /* Asks once, and finishes either way. */
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
    stepCount: STEP_COUNT,
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
