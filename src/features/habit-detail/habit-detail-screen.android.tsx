import { HeatGraph } from "@/components/heat-graph";
import { useHabitHeat } from "@/components/heat-graph/hooks/use-habit-heat";
import { Stat } from "@/components/stat";
import { AppSymbol } from "@/components/ui/app-symbol";
import { Text } from "@/components/ui/text";
import { formatCount, formatPercent } from "@/lib/utils/numbers";
import { foregroundOnColor } from "@/lib/utils/foreground-on-color";
import { accent, colors, tints } from "@/theme";
import { Link, Stack } from "expo-router";
import { PressableScale } from "pressto";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useHabitDetailModel } from "./hooks/use-habit-detail-model";
import { styles } from "./styles";

/** What fits the card without scrolling. */
const DETAIL_WEEKS = 18;

/**
 * The action is in the header rather than a toolbar, and the header carries its
 * own surface: iOS blurs the content passing under a transparent bar and
 * Material 3 asks a pushed screen for a small opaque one.
 */
export function HabitDetailScreen() {
  const { t, i18n } = useTranslation("habitDetail");
  const model = useHabitDetailModel();
  const heat = useHabitHeat(model?.habit, model?.completed, DETAIL_WEEKS);

  if (!model) return null;

  const {
    habit,
    subtitle,
    streaks,
    rate,
    scheduledToday,
    doneToday,
    historyHref,
    toggleToday,
    editHabit,
  } = model;

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: false,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("editHabit")}
              onPress={editHabit}
            >
              <AppSymbol name="pencil" size={22} tintColor={accent} />
            </Pressable>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeIn.duration(260)} style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: `${habit.color}26` }]}>
            <AppSymbol name={habit.icon} size={34} tintColor={habit.color} />
          </View>
          <View style={styles.heroCopy}>
            <Text variant="title" numberOfLines={2}>
              {habit.name}
            </Text>
            <Text variant="subheadline" secondary>
              {subtitle}
            </Text>
          </View>
        </Animated.View>

        {scheduledToday ? (
          <Animated.View entering={FadeInDown.duration(280).delay(40)}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={
                doneToday ? t("undoCheckInLabel") : t("checkInLabel")
              }
              onPress={toggleToday}
              style={[
                styles.todayButton,
                {
                  backgroundColor: doneToday
                    ? colors.fill
                    : habit.color,
                },
              ]}
            >
              <AppSymbol
                name={doneToday ? "arrow.uturn.backward" : "checkmark"}
                size={17}
                tintColor={
                  doneToday ? colors.text : foregroundOnColor(habit.color)
                }
              />
              <Text
                variant="headline"
                style={
                  doneToday ? undefined : { color: foregroundOnColor(habit.color) }
                }
              >
                {doneToday ? t("undoCheckIn") : t("checkIn")}
              </Text>
            </PressableScale>
          </Animated.View>
        ) : (
          <View style={styles.restCard}>
            <View style={styles.restIcon}>
              <AppSymbol
                name="calendar.badge.clock"
                size={19}
                tintColor={colors.secondaryText}
              />
            </View>
            <View style={styles.restCopy}>
              <Text variant="headline">{t("notScheduled")}</Text>
              <Text variant="subheadline" secondary>
                {t("restDay")}
              </Text>
            </View>
          </View>
        )}

        <Animated.View
          entering={FadeInDown.duration(280).delay(80)}
          style={styles.statsCard}
        >
          <View style={styles.featuredStat}>
            <View
              style={[
                styles.featuredStatIcon,
                { backgroundColor: `${habit.color}20` },
              ]}
            >
              <AppSymbol
                name="flame.fill"
                size={22}
                tintColor={
                  streaks.current > 0 ? habit.color : colors.tertiaryText
                }
              />
            </View>
            <Text variant="caption" secondary style={styles.metricEyebrow}>
              {t("currentStreak")}
            </Text>
            <View style={styles.featuredValue}>
              <Text variant="title" style={styles.statNumber}>
                {formatCount(streaks.current, i18n.language)}
              </Text>
              <Text variant="footnote" secondary>
                {t("day", { count: streaks.current })}
              </Text>
            </View>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.secondaryStats}>
            <Stat
              layout="row"
              symbol="trophy.fill"
              color={tints.yellow}
              value={formatCount(streaks.best, i18n.language)}
              label={t("bestStreak")}
            />
            <View style={styles.secondaryDivider} />
            <Stat
              layout="row"
              symbol="chart.bar.fill"
              color={tints.blue}
              value={formatPercent(rate, i18n.language)}
              label={t("monthRate")}
            />
          </View>
        </Animated.View>

        {/* The zoom the iOS card opens with has no Android equivalent, so the
            card is a plain link into the same screen. */}
        <Animated.View entering={FadeInDown.duration(280).delay(120)}>
          <Link href={historyHref} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("historyLabel", { name: habit.name })}
              accessibilityHint={t("historyHint")}
              style={styles.heatCard}
            >
              <View style={styles.heatHeader}>
                <View style={styles.heatTitle}>
                  <Text variant="headline">{t("history")}</Text>
                  <Text variant="footnote" secondary>
                    {t("historyRange")}
                  </Text>
                </View>
                <AppSymbol
                  name="arrow.up.left.and.arrow.down.right"
                  size={13}
                  tintColor={colors.tertiaryText}
                />
              </View>
              <HeatGraph
                columns={heat.columns}
                accent={habit.color}
                cellSize={11}
                gap={3}
              />
            </Pressable>
          </Link>
        </Animated.View>
      </ScrollView>
    </>
  );
}
