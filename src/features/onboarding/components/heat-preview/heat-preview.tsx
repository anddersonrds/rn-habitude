import { accent } from "@/theme/colors";
import { Color } from "expo-router";
import { View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { styles } from "./styles";

/** A miniature heat grid, so the core idea is visible before any data exists. */
export function HeatPreview() {
  const reduceMotion = useReducedMotion();
  const columns = Array.from({ length: 9 }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      /* A fixed, human-looking pattern: dense recently, patchier further back. */
      const seed = (week * 7 + weekday * 3) % 11;
      return seed > 3 - Math.floor(week / 3);
    }),
  );

  return (
    <View style={styles.heatGrid}>
      {columns.map((column, week) => (
        <View key={week} style={styles.heatColumn}>
          {column.map((filled, weekday) => (
            <Animated.View
              key={weekday}
              entering={
                reduceMotion
                  ? undefined
                  : FadeIn.duration(240).delay(week * 45 + weekday * 12)
              }
              style={[
                styles.heatCell,
                {
                  backgroundColor: filled
                    ? accent
                    : (Color.ios.tertiarySystemFill as string),
                },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
