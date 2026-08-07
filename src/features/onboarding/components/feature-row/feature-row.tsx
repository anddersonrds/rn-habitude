import { Text } from "@/components/ui/text";
import { accent } from "@/theme/colors";
import { SymbolView } from "expo-symbols";
import { View } from "react-native";
import Animated, { FadeInUp, useReducedMotion } from "react-native-reanimated";
import { styles } from "./styles";
import type { Props } from "./types";

export function FeatureRow({ symbol, title, description, index }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View
      entering={
        reduceMotion ? undefined : FadeInUp.duration(260).delay(80 + index * 70)
      }
      style={styles.featureRow}
    >
      <View style={[styles.featureIcon, { backgroundColor: `${accent}22` }]}>
        <SymbolView name={symbol} size={24} weight="semibold" tintColor={accent} />
      </View>
      <View style={styles.featureCopy}>
        <Text variant="headline">{title}</Text>
        <Text variant="subheadline" secondary style={styles.featureDescription}>
          {description}
        </Text>
      </View>
    </Animated.View>
  );
}
