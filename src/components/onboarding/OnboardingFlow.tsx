import { appFontFamily, Text } from "@/components/ui/Text";
import { layout } from "@/constants/layout";
import { haptic } from "@/lib/haptics";
import {
  ensureNotificationPermission,
  getNotificationPermission,
} from "@/lib/notifications";
import { setOnboarded } from "@/lib/store";
import { accent, foregroundOnColor } from "@/theme/colors";
import { GlassView } from "expo-glass-effect";
import type * as Notifications from "expo-notifications";
import { Color } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { PressableScale } from "pressto";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease";
import Animated, {
  FadeIn,
  FadeInUp,
  LinearTransition,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STEP_TRANSITION = { type: "timing" as const, duration: 170 };
const DOT_LAYOUT_MS = 180;

type StepId = "welcome" | "consistency" | "reminders";

const STEPS: {
  id: StepId;
  title: string;
  description: string;
  cta: string;
}[] = [
  {
    id: "welcome",
    title: "habitude",
    description:
      "A habit is a small thing done often. Track a few, and watch them add up.",
    cta: "Continue",
  },
  {
    id: "consistency",
    title: "See your consistency",
    description:
      "Every check-in fills a square. Streaks and history make the pattern obvious.",
    cta: "Continue",
  },
  {
    id: "reminders",
    title: "A nudge at the right time",
    description:
      "Give a habit a reminder time and habitude will tap you on the shoulder.",
    cta: "Allow notifications",
  },
];

/** A miniature heat grid, so the core idea is visible before any data exists. */
function HeatPreview() {
  const reduceMotion = useReducedMotion();
  const columns = Array.from({ length: 9 }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      // A fixed, human-looking pattern: dense recently, patchier further back.
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

function FeatureRow({
  symbol,
  title,
  description,
  index,
}: {
  symbol: SFSymbol;
  title: string;
  description: string;
  index: number;
}) {
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

function WelcomeStep() {
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

function ConsistencyStep() {
  return (
    <View style={styles.featureList}>
      <FeatureRow
        index={0}
        symbol="square.grid.3x3.fill"
        title="A square per day"
        description="Filled in your habit's own color when you check in."
      />
      <FeatureRow
        index={1}
        symbol="flame.fill"
        title="Streaks that are fair"
        description="Rest days never break a streak, only scheduled days count."
      />
      <FeatureRow
        index={2}
        symbol="rectangle.3.group.fill"
        title="On your home screen"
        description="Add the widget to see the same grid without opening the app."
      />
    </View>
  );
}

function RemindersStep({
  permission,
}: {
  permission: Notifications.NotificationPermissionsStatus | null;
}) {
  const reduceMotion = useReducedMotion();
  const allowed = permission?.granted === true;

  return (
    <View style={styles.body}>
      <Animated.View
        entering={reduceMotion ? undefined : FadeInUp.duration(320)}
        style={[styles.notificationArtwork, { backgroundColor: `${accent}12` }]}
      >
        <View style={[styles.bellCircle, { backgroundColor: accent }]}>
          <SymbolView
            name={allowed ? "checkmark" : "bell.fill"}
            size={36}
            tintColor={foregroundOnColor(accent)}
            animationSpec={{
              effect: { type: allowed ? "bounce" : "pulse", direction: "up" },
            }}
          />
        </View>
        <View style={styles.notificationCard}>
          <View style={styles.notificationHeader}>
            <View style={[styles.miniAppIcon, { backgroundColor: accent }]}>
              <SymbolView
                name="checklist"
                size={13}
                tintColor={foregroundOnColor(accent)}
              />
            </View>
            <Text variant="caption" secondary>
              HABITUDE · NOW
            </Text>
          </View>
          <Text variant="headline">Walk outside</Text>
          <Text variant="subheadline" secondary>
            Ready for a small step?
          </Text>
        </View>
      </Animated.View>

      <View style={styles.points}>
        <View style={styles.point}>
          <SymbolView name="slider.horizontal.3" size={18} tintColor={accent} />
          <Text variant="subheadline" secondary style={styles.pointCopy}>
            Reminders are optional and set per habit.
          </Text>
        </View>
        <View style={styles.point}>
          <SymbolView name="hand.tap.fill" size={18} tintColor={accent} />
          <Text variant="subheadline" secondary style={styles.pointCopy}>
            Check in straight from the notification.
          </Text>
        </View>
      </View>

      {allowed && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInUp.duration(220)}
          style={styles.allowedBadge}
        >
          <SymbolView name="checkmark.circle.fill" size={20} tintColor="#34C759" />
          <Text variant="subheadline">Notifications are allowed</Text>
        </Animated.View>
      )}
    </View>
  );
}

function ProgressDots({ currentIndex }: { currentIndex: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <View style={styles.progressDots}>
      {STEPS.map((step, index) => (
        <Animated.View
          key={step.id}
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

function StepTransition({
  reduceMotion,
  visible,
  onTransitionEnd,
  children,
}: {
  reduceMotion: boolean;
  visible: boolean;
  onTransitionEnd: () => void;
  children: ReactNode;
}) {
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

/** Three screens: what the app is, how consistency reads, and reminders. */
export function OnboardingFlow() {
  const { top, bottom } = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [permission, setPermission] =
    useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [requesting, setRequesting] = useState(false);
  const pendingIndex = useRef<number | null>(null);

  const currentStep = STEPS[currentIndex];
  const isLast = currentIndex === STEPS.length - 1;
  const cannotAsk =
    permission != null && !permission.granted && !permission.canAskAgain;
  const ctaLabel = !isLast
    ? currentStep.cta
    : permission?.granted
      ? "Start tracking"
      : cannotAsk
        ? "Maybe later"
        : requesting
          ? "Requesting…"
          : currentStep.cta;

  useEffect(() => {
    if (currentStep.id === "reminders") {
      void getNotificationPermission().then(setPermission);
    }
  }, [currentStep.id]);

  const navigateToStep = (index: number) => {
    if (index < 0 || index >= STEPS.length || index === currentIndex) return;
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

  const advance = async () => {
    if (requesting) return;

    if (!isLast) {
      haptic.tap();
      navigateToStep(currentIndex + 1);
      return;
    }

    // Last step: ask once, then finish either way.
    if (!permission?.granted && !cannotAsk) {
      setRequesting(true);
      try {
        const granted = await ensureNotificationPermission();
        setPermission(await getNotificationPermission());
        if (granted) {
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

  return (
    <View style={[styles.container, { paddingTop: top + 8 }]}>
      <View style={styles.header}>
        <View style={styles.headerAction}>
          {currentIndex > 0 && (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Previous step"
              onPress={() => navigateToStep(currentIndex - 1)}
              style={styles.backButton}
            >
              <SymbolView
                name="chevron.left"
                size={18}
                weight="semibold"
                tintColor={Color.ios.label}
              />
            </PressableScale>
          )}
        </View>
        <ProgressDots currentIndex={currentIndex} />
        <View style={styles.headerAction}>
          <Text variant="footnote" tertiary style={styles.stepCount}>
            {currentIndex + 1}/{STEPS.length}
          </Text>
        </View>
      </View>

      <StepTransition
        reduceMotion={!!reduceMotion}
        visible={visible}
        onTransitionEnd={handleTransitionEnd}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottom + 130 },
          ]}
        >
          <View style={styles.titleBlock}>
            <Text variant="largeTitle" style={styles.titleText}>
              {currentStep.title}
            </Text>
            <Text variant="title3" secondary style={styles.stepDescription}>
              {currentStep.description}
            </Text>
          </View>

          {currentStep.id === "welcome" && <WelcomeStep />}
          {currentStep.id === "consistency" && <ConsistencyStep />}
          {currentStep.id === "reminders" && (
            <RemindersStep permission={permission} />
          )}
        </ScrollView>
      </StepTransition>

      <View pointerEvents="box-none" style={styles.ctaLayer}>
        <View style={[styles.ctaContent, { paddingBottom: Math.max(bottom, 12) }]}>
          <GlassView
            isInteractive
            glassEffectStyle="regular"
            tintColor={accent}
            style={styles.ctaGlass}
          >
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={ctaLabel}
              accessibilityState={{ disabled: requesting }}
              onPress={() => void advance()}
              style={[
                styles.cta,
                { backgroundColor: accent },
                requesting && styles.ctaDisabled,
              ]}
            >
              <Text
                variant="headline"
                style={{ color: foregroundOnColor(accent) }}
              >
                {ctaLabel}
              </Text>
              {!requesting && (
                <SymbolView
                  name={isLast ? "checkmark" : "arrow.right"}
                  size={17}
                  weight="semibold"
                  tintColor={foregroundOnColor(accent)}
                />
              )}
            </PressableScale>
          </GlassView>
          {isLast && !permission?.granted && (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Skip notifications"
              onPress={() => {
                haptic.tap();
                setOnboarded();
              }}
              style={styles.skip}
            >
              <Text variant="footnote" tertiary>
                You can change this later in Settings.
              </Text>
            </PressableScale>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.ios.systemBackground,
  },
  header: {
    height: 24,
    paddingHorizontal: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerAction: {
    width: 24,
    alignItems: "center",
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 99,
  },
  progressDots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  progressDot: {
    height: 7,
    borderRadius: 4,
  },
  stepCount: {
    color: Color.ios.systemGray,
    fontVariant: ["tabular-nums"],
  },
  stepLayer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.heroPadding,
  },
  titleBlock: {
    alignItems: "center",
    paddingTop: 24,
  },
  titleText: {
    letterSpacing: -0.64,
    fontWeight: "700",
    textAlign: "center",
  },
  stepDescription: {
    textAlign: "center",
    marginTop: 12,
  },
  body: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
    paddingTop: 28,
  },
  card: {
    borderRadius: 22,
    borderCurve: "continuous",
    padding: 16,
    gap: 20,
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    boxShadow: "0 18px 44px rgba(0, 0, 0, 0.10)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  cardCopy: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: appFontFamily,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: Color.ios.label,
  },
  cardSubtitle: {
    fontFamily: appFontFamily,
    fontSize: 15,
    fontWeight: "600",
    color: Color.ios.secondaryLabel,
  },
  cardCheck: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  heatGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 5,
  },
  heatColumn: {
    flex: 1,
    gap: 5,
  },
  heatCell: {
    height: 18,
    borderRadius: 5,
    borderCurve: "continuous",
  },
  featureList: {
    gap: 4,
    paddingTop: 34,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 12,
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: {
    flex: 1,
    gap: 2,
  },
  featureDescription: {
    lineHeight: 19,
  },
  notificationArtwork: {
    borderRadius: 30,
    borderCurve: "continuous",
    padding: 22,
    alignItems: "center",
    gap: 18,
  },
  bellCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.16)",
  },
  notificationCard: {
    alignSelf: "stretch",
    gap: 4,
    padding: 16,
    borderRadius: 22,
    borderCurve: "continuous",
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingBottom: 4,
  },
  miniAppIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  points: {
    gap: 12,
  },
  point: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pointCopy: {
    flexShrink: 1,
  },
  allowedBadge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Color.ios.tertiarySystemFill,
  },
  ctaLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  ctaContent: {
    paddingHorizontal: layout.heroPadding,
    paddingTop: 18,
  },
  ctaGlass: {
    borderRadius: layout.ctaRadius,
  },
  cta: {
    minHeight: 58,
    borderRadius: layout.ctaRadius,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 22,
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  skip: {
    alignItems: "center",
    paddingTop: 12,
  },
});
