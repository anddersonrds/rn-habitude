import { Text } from "@/components/ui/text";
import { layout } from "@/constants/layout";
import { accent, foregroundOnColor } from "@/theme/colors";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { PressableScale } from "pressto";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

type Props = {
  symbol: SFSymbol;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Overrides the app accent, so a habit-scoped empty state can use its color. */
  tint?: string;
};

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 48,
    gap: 8,
  },
  symbolSurface: {
    width: 76,
    height: 76,
    borderRadius: 24,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  centered: {
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  button: {
    minHeight: 50,
    marginTop: 16,
    paddingHorizontal: 24,
    justifyContent: "center",
    borderRadius: layout.ctaRadius,
    borderCurve: "continuous",
  },
});
