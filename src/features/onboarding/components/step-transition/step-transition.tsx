import { View } from "react-native";
import { EaseView } from "react-native-ease";
import { styles } from "./styles";
import type { Props } from "./types";

const STEP_TRANSITION = { type: "timing" as const, duration: 170 };

export function StepTransition({
  reduceMotion,
  visible,
  onTransitionEnd,
  children,
}: Props) {
  if (reduceMotion) return <View style={styles.stepLayer}>{children}</View>;

  return (
    <EaseView
      animate={{ opacity: visible ? 1 : 0, translateY: visible ? 0 : 6 }}
      transition={STEP_TRANSITION}
      onTransitionEnd={onTransitionEnd}
      style={styles.stepLayer}
    >
      {children}
    </EaseView>
  );
}
