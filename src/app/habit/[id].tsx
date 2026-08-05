import { HeatMap } from "@/components/HeatMap";
import { Text } from "@/components/ui/Text";
import { layout } from "@/constants/layout";
import { formatTime, todayKey, weekdayOf } from "@/lib/dates";
import { scheduleLabel } from "@/lib/habits";
import { haptic } from "@/lib/haptics";
import { toggleCompletion, useAppState } from "@/lib/store";
import { completionRate, computeStreaks } from "@/lib/streaks";
import { isScheduledOn } from "@/lib/types";
import { foregroundOnColor } from "@/theme/colors";
import { Color, Link, router, Stack, useLocalSearchParams } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { PressableScale } from "pressto";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

function SecondaryStat({
  symbol,
  color,
  value,
  label,
}: {
  symbol: SFSymbol;
  color: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.secondaryStat}>
      <SymbolView name={symbol} size={16} tintColor={color} />
      <Text variant="subheadline" secondary style={styles.secondaryStatLabel}>
        {label}
      </Text>
      <Text variant="headline" style={styles.statNumber}>
        {value}
      </Text>
    </View>
  );
}

export default function HabitDetailScreen() {
  const { t } = useTranslation("schedule");
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useAppState();
  const habit = state.habits.find((candidate) => candidate.id === id);

  useEffect(() => {
    if (!habit && router.canGoBack()) router.back();
  }, [habit]);

  if (!habit) return null;

  const today = todayKey();
  const completed = state.completions[habit.id];
  const streaks = computeStreaks(habit, completed, today);
  const rate = completionRate(habit, completed, 30, today);
  const scheduledToday = isScheduledOn(habit, weekdayOf(today));
  const doneToday = completed?.[today] === true;

  const subtitle = [
    scheduleLabel(habit, t),
    habit.reminderTime ? formatTime(habit.reminderTime) : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const toggleToday = () => {
    const nowDone = toggleCompletion(habit.id, today);
    if (nowDone) void haptic.checkIn();
    else haptic.tap();
  };

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="pencil"
          accessibilityLabel="Edit habit"
          onPress={() => router.push(`/habit-form?id=${habit.id}`)}
        />
      </Stack.Toolbar>

      <ScrollView
        style={styles.container}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <Animated.View entering={FadeIn.duration(260)} style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: `${habit.color}26` }]}>
            <SymbolView
              name={habit.icon as SFSymbol}
              size={34}
              tintColor={habit.color}
            />
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
                doneToday ? "Undo today's check-in" : "Check in today"
              }
              onPress={toggleToday}
              style={[
                styles.todayButton,
                {
                  backgroundColor: doneToday
                    ? Color.ios.tertiarySystemFill
                    : habit.color,
                },
              ]}
            >
              <SymbolView
                name={doneToday ? "arrow.uturn.backward" : "checkmark"}
                size={17}
                tintColor={
                  doneToday ? Color.ios.label : foregroundOnColor(habit.color)
                }
              />
              <Text
                variant="headline"
                style={
                  doneToday ? undefined : { color: foregroundOnColor(habit.color) }
                }
              >
                {doneToday ? "Undo check-in" : "Check in"}
              </Text>
            </PressableScale>
          </Animated.View>
        ) : (
          <View style={styles.restCard}>
            <View style={styles.restIcon}>
              <SymbolView
                name="calendar.badge.clock"
                size={19}
                tintColor={Color.ios.secondaryLabel}
              />
            </View>
            <View style={styles.restCopy}>
              <Text variant="headline">Not scheduled today</Text>
              <Text variant="subheadline" secondary>
                Your streak is safe on rest days.
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
              <SymbolView
                name="flame.fill"
                size={22}
                tintColor={
                  streaks.current > 0 ? habit.color : Color.ios.tertiaryLabel
                }
              />
            </View>
            <Text variant="caption" secondary style={styles.metricEyebrow}>
              CURRENT STREAK
            </Text>
            <View style={styles.featuredValue}>
              <Text variant="title" style={styles.statNumber}>
                {streaks.current}
              </Text>
              <Text variant="footnote" secondary>
                {streaks.current === 1 ? "day" : "days"}
              </Text>
            </View>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.secondaryStats}>
            <SecondaryStat
              symbol="trophy.fill"
              color="#FFCC00"
              value={`${streaks.best}`}
              label="Best streak"
            />
            <View style={styles.secondaryDivider} />
            <SecondaryStat
              symbol="chart.bar.fill"
              color="#007AFF"
              value={`${Math.round(rate * 100)}%`}
              label="30-day rate"
            />
          </View>
        </Animated.View>

        {/* The heat card is the zoom source: tapping it expands the same grid
            into the full-history screen instead of sliding a new card in. */}
        <Animated.View entering={FadeInDown.duration(280).delay(120)}>
          <Link href={`/habit-history?id=${habit.id}`} asChild>
            <Link.Trigger withAppleZoom>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${habit.name} history`}
                accessibilityHint="Opens the full consistency history"
                style={styles.heatCard}
              >
                <View style={styles.heatHeader}>
                  <View style={styles.heatTitle}>
                    <Text variant="headline">History</Text>
                    <Text variant="footnote" secondary>
                      Last 18 weeks
                    </Text>
                  </View>
                  <SymbolView
                    name="arrow.up.left.and.arrow.down.right"
                    size={13}
                    tintColor={Color.ios.tertiaryLabel}
                  />
                </View>
                <HeatMap
                  habit={habit}
                  completed={completed}
                  weeks={18}
                  cellSize={11}
                  gap={3}
                />
              </Pressable>
            </Link.Trigger>
          </Link>
        </Animated.View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.ios.systemGroupedBackground,
  },
  content: {
    padding: layout.screenPadding,
    paddingBottom: layout.bottomPadding,
    gap: 20,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 8,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  todayButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: layout.ctaRadius,
    borderCurve: "continuous",
  },
  restCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
  },
  restIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Color.ios.tertiarySystemFill,
  },
  restCopy: {
    flex: 1,
    gap: 2,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  featuredStat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 16,
    gap: 6,
  },
  featuredStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  metricEyebrow: {
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  featuredValue: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
  },
  statNumber: {
    fontVariant: ["tabular-nums"],
  },
  statsDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Color.ios.separator,
    marginVertical: 12,
  },
  secondaryStats: {
    flex: 1.15,
    justifyContent: "center",
    paddingVertical: 6,
  },
  secondaryStat: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  secondaryStatLabel: {
    flex: 1,
  },
  secondaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Color.ios.separator,
    marginLeft: 38,
  },
  heatCard: {
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    padding: 16,
  },
  heatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heatTitle: {
    gap: 2,
  },
});
