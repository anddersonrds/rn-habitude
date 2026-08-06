import { Text } from "@/components/ui/text";
import { accent, success } from "@/theme/colors";
import { GlassView } from "expo-glass-effect";
import { Color } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, useColorScheme, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type Props = {
  /** The colors of the habits completed today, so the moment is personal. */
  colors: string[];
  onFinished: () => void;
};

const SPARK_COUNT = 14;
const DURATION_MS = 2100;

function Spark({ index, color }: { index: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      140 + index * 22,
      withTiming(1, { duration: 880, easing: Easing.out(Easing.cubic) }),
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => {
    const angle = (index / SPARK_COUNT) * Math.PI * 2;
    const distance = 70 + (index % 3) * 26;
    return {
      opacity: 1 - progress.value,
      transform: [
        { translateX: Math.cos(angle) * progress.value * distance },
        { translateY: Math.sin(angle) * progress.value * distance },
        { scale: 1 - progress.value * 0.5 },
      ],
    };
  });

  const size = 7 + (index % 3) * 2;

  return (
    <Animated.View
      style={[
        styles.spark,
        { backgroundColor: color, width: size, height: size },
        style,
      ]}
    />
  );
}

/** A ring that expands past the badge once, like a single quiet pulse. */
function Ring({ color }: { color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      80,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }),
    );
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - progress.value),
    transform: [{ scale: 0.7 + progress.value * 0.9 }],
  }));

  return <Animated.View style={[styles.ring, { borderColor: color }, style]} />;
}

/**
 * A brief, earned moment shown once when every habit scheduled today is
 * complete: a glass badge springs in, one ring pulses out, and sparks carry the
 * habits' own colors.
 */
export function Celebration({ colors, onFinished }: Props) {
  const { t } = useTranslation("today");
  const isDark = useColorScheme() === "dark";
  const reduceMotion = useReducedMotion();
  const badgeScale = useSharedValue(reduceMotion ? 1 : 0.4);
  const sparkColors = colors.length > 0 ? colors : [accent];

  useEffect(() => {
    if (!reduceMotion) {
      badgeScale.value = withSpring(1, { damping: 12, stiffness: 180 });
    }
    const timer = setTimeout(onFinished, DURATION_MS);
    return () => clearTimeout(timer);
  }, [badgeScale, onFinished, reduceMotion]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(280)}
      style={styles.overlay}
      pointerEvents="none"
    >
      {/* Wash out the screen behind the celebration: white in light mode so
          dark text pops, black in dark mode so light text pops. */}
      <View
        style={[
          styles.scrim,
          {
            backgroundColor: isDark
              ? "rgba(0, 0, 0, 0.45)"
              : "rgba(255, 255, 255, 0.6)",
          },
        ]}
      />
      <View style={styles.center}>
        {!reduceMotion && (
          <>
            <Ring color={sparkColors[0]} />
            {Array.from({ length: SPARK_COUNT }, (_, index) => (
              <Spark
                key={index}
                index={index}
                color={sparkColors[index % sparkColors.length]}
              />
            ))}
          </>
        )}
        <Animated.View style={badgeStyle}>
          <GlassView style={styles.badge} glassEffectStyle="regular">
            {/* The same seal, in the same green, as the Today "all done" seal.
                They appear within a second of each other. */}
            <SymbolView
              name="checkmark.seal.fill"
              size={44}
              tintColor={success}
            />
          </GlassView>
        </Animated.View>
        <Animated.View
          entering={FadeIn.delay(250).duration(350)}
          style={styles.textBlock}
        >
          {/* Solid system background so the label always has contrast; glass
              alone can't guarantee that over arbitrary content. */}
          <View style={styles.textCard}>
            <Text variant="title3">{t("celebrationTitle")}</Text>
            <Text variant="subheadline" secondary>
              {t("celebrationBody")}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  spark: {
    position: "absolute",
    borderRadius: 6,
  },
  ring: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    marginTop: 16,
  },
  textCard: {
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 26,
    borderCurve: "continuous",
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
});
