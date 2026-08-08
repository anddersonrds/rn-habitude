import { Text } from "@/components/ui/text";
import { foregroundOnColor } from "@/lib/utils/foreground-on-color";
import { accent } from "@/theme";
import { SymbolView } from "expo-symbols";
import { View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { HeatPreview } from "../heat-preview";
import { styles } from "./styles";

export function WelcomeStep() {
  const reduceMotion = useReducedMotion();

  return (
    <View style={styles.body}>
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.duration(320)}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: `${accent}26` }]}>
            <SymbolView
              name="figure.walk"
              size={30}
              weight="semibold"
              tintColor={accent}
            />
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>Walk outside</Text>
            <Text style={styles.cardSubtitle}>12-day streak</Text>
          </View>
          <View style={[styles.cardCheck, { backgroundColor: accent }]}>
            <SymbolView
              name="checkmark"
              size={15}
              weight="bold"
              tintColor={foregroundOnColor(accent)}
            />
          </View>
        </View>
        <HeatPreview />
      </Animated.View>
    </View>
  );
}
