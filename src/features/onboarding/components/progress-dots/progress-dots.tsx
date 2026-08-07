import { accent } from "@/theme";
import { Color } from "expo-router";
import { View } from "react-native";
import Animated, {
  LinearTransition,
  useReducedMotion,
} from "react-native-reanimated";
import { styles } from "./styles";
import type { Props } from "./types";

const DOT_LAYOUT_MS = 180;

export function ProgressDots({ currentIndex, stepCount }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <View style={styles.progressDots}>
      {Array.from({ length: stepCount }, (_, index) => (
        <Animated.View
          key={index}
          layout={reduceMotion ? undefined : LinearTransition.duration(DOT_LAYOUT_MS)}
          style={[
            styles.progressDot,
            { width: index === currentIndex ? 24 : 7 },
            index <= currentIndex
              ? { backgroundColor: accent }
              : { backgroundColor: Color.ios.tertiarySystemFill },
          ]}
        />
      ))}
    </View>
  );
}
