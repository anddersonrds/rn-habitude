import { Text } from "@/components/ui/text";
import { foregroundOnColor } from "@/lib/utils/foreground-on-color";
import { accent } from "@/theme";
import { SymbolView } from "expo-symbols";
import { PressableScale } from "pressto";
import { View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { styles } from "./styles";
import type { Props } from "./types";

/**
 * Every empty state in the app: a symbol, a title, a one-line description, and
 * a call to action when there is something to do.
 */
export function EmptyState({
  symbol,
  title,
  description,
  actionLabel,
  onAction,
  tint = accent,
}: Props) {
  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeIn.duration(320)}
        style={[styles.symbolSurface, { backgroundColor: `${tint}1F` }]}
      >
        <SymbolView name={symbol} size={34} tintColor={tint} />
      </Animated.View>
      <Animated.View
        entering={FadeInUp.duration(300).delay(60)}
        style={styles.copy}
      >
        <Text variant="title3" style={styles.centered}>
          {title}
        </Text>
        <Text variant="subheadline" secondary style={styles.description}>
          {description}
        </Text>
      </Animated.View>
      {actionLabel && onAction && (
        <Animated.View entering={FadeInUp.duration(300).delay(140)}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            onPress={onAction}
            style={[styles.button, { backgroundColor: tint }]}
          >
            <Text variant="headline" style={{ color: foregroundOnColor(tint) }}>
              {actionLabel}
            </Text>
          </PressableScale>
        </Animated.View>
      )}
    </View>
  );
}
