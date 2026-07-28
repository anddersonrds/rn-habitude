import * as Haptics from "expo-haptics";

/**
 * Semantic haptic helpers. A global light haptic fires on every pressable
 * (wired through pressto's PressablesConfig in the root layout); these add
 * stronger, intentional feedback for meaningful moments.
 */
export const haptic = {
  selection: () => {
    void Haptics.selectionAsync();
  },
  tap: () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  impact: () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  rigid: () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
  },
  success: () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning: () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  /** Checking a habit off: a crisp double beat that lands. */
  checkIn: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    await new Promise((resolve) => setTimeout(resolve, 70));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  /** Earned moment: a rising three-beat pattern for completing the day. */
  celebrate: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    await new Promise((resolve) => setTimeout(resolve, 120));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 120));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
};
