import { Text } from "@/components/ui/text";
import { accent, foregroundOnColor } from "@/theme/colors";
import { GlassView } from "expo-glass-effect";
import { Color } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { PressableScale } from "pressto";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { EaseView } from "react-native-ease";
import Animated, {
  FadeIn,
  FadeInUp,
  LinearTransition,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { STEP_COUNT, useOnboardingModel } from "./hooks/use-onboarding-model";
import { styles } from "./styles";

const STEP_TRANSITION = { type: "timing" as const, duration: 170 };
const DOT_LAYOUT_MS = 180;

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
  const { t } = useTranslation("onboarding");

  return (
    <View style={styles.featureList}>
      <FeatureRow
        index={0}
        symbol="square.grid.3x3.fill"
        title={t("squareTitle")}
        description={t("squareDescription")}
      />
      <FeatureRow
        index={1}
        symbol="flame.fill"
        title={t("streakTitle")}
        description={t("streakDescription")}
      />
      <FeatureRow
        index={2}
        symbol="rectangle.3.group.fill"
        title={t("widgetTitle")}
        description={t("widgetDescription")}
      />
    </View>
  );
}

function RemindersStep({ allowed }: { allowed: boolean }) {
  const { t } = useTranslation("onboarding");
  const reduceMotion = useReducedMotion();

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
              {t("notificationHeader")}
            </Text>
          </View>
          <Text variant="headline">{t("notificationHabit")}</Text>
          <Text variant="subheadline" secondary>
            {t("notificationBody")}
          </Text>
        </View>
      </Animated.View>

      <View style={styles.points}>
        <View style={styles.point}>
          <SymbolView name="slider.horizontal.3" size={18} tintColor={accent} />
          <Text variant="subheadline" secondary style={styles.pointCopy}>
            {t("pointReminders")}
          </Text>
        </View>
        <View style={styles.point}>
          <SymbolView name="hand.tap.fill" size={18} tintColor={accent} />
          <Text variant="subheadline" secondary style={styles.pointCopy}>
            {t("pointCheckIn")}
          </Text>
        </View>
      </View>

      {allowed && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInUp.duration(220)}
          style={styles.allowedBadge}
        >
          <SymbolView name="checkmark.circle.fill" size={20} tintColor="#34C759" />
          <Text variant="subheadline">{t("permissionAllowed")}</Text>
        </Animated.View>
      )}
    </View>
  );
}

function ProgressDots({ currentIndex }: { currentIndex: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <View style={styles.progressDots}>
      {Array.from({ length: STEP_COUNT }, (_, index) => (
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
  const { t } = useTranslation("onboarding");
  const { top, bottom } = useSafeAreaInsets();
  const model = useOnboardingModel();

  return (
    <View style={[styles.container, { paddingTop: top + 8 }]}>
      <View style={styles.header}>
        <View style={styles.headerAction}>
          {model.canGoBack && (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={t("previousStep")}
              onPress={model.goBack}
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
        <ProgressDots currentIndex={model.currentIndex} />
        <View style={styles.headerAction}>
          <Text variant="footnote" tertiary style={styles.stepCount}>
            {model.stepNumber}/{model.stepCount}
          </Text>
        </View>
      </View>

      <StepTransition
        reduceMotion={model.reduceMotion}
        visible={model.visible}
        onTransitionEnd={model.handleTransitionEnd}
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
              {model.step.title}
            </Text>
            <Text variant="title3" secondary style={styles.stepDescription}>
              {model.step.description}
            </Text>
          </View>

          {model.step.id === "welcome" && <WelcomeStep />}
          {model.step.id === "consistency" && <ConsistencyStep />}
          {model.step.id === "reminders" && (
            <RemindersStep allowed={model.permissionGranted} />
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
              accessibilityLabel={model.ctaLabel}
              accessibilityState={{ disabled: model.requesting }}
              onPress={() => void model.advance()}
              style={[
                styles.cta,
                { backgroundColor: accent },
                model.requesting && styles.ctaDisabled,
              ]}
            >
              <Text
                variant="headline"
                style={{ color: foregroundOnColor(accent) }}
              >
                {model.ctaLabel}
              </Text>
              {!model.requesting && (
                <SymbolView
                  name={model.isLast ? "checkmark" : "arrow.right"}
                  size={17}
                  weight="semibold"
                  tintColor={foregroundOnColor(accent)}
                />
              )}
            </PressableScale>
          </GlassView>
          {model.canSkip && (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={t("skipNotifications")}
              onPress={model.skip}
              style={styles.skip}
            >
              <Text variant="footnote" tertiary>
                {t("skipCopy")}
              </Text>
            </PressableScale>
          )}
        </View>
      </View>
    </View>
  );
}
