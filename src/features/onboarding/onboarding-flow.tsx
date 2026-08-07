import { Text } from "@/components/ui/text";
import { foregroundOnColor } from "@/lib/utils/foreground-on-color";
import { accent } from "@/theme";
import { GlassView } from "expo-glass-effect";
import { Color } from "expo-router";
import { SymbolView } from "expo-symbols";
import { PressableScale } from "pressto";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConsistencyStep } from "./components/consistency-step";
import { ProgressDots } from "./components/progress-dots";
import { RemindersStep } from "./components/reminders-step";
import { StepTransition } from "./components/step-transition";
import { WelcomeStep } from "./components/welcome-step";
import { useOnboardingModel } from "./hooks/use-onboarding-model";
import { styles } from "./styles";

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
        <ProgressDots
          currentIndex={model.currentIndex}
          stepCount={model.stepCount}
        />
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
