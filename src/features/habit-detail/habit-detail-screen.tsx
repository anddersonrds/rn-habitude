import { HeatMap } from "@/components/heat-map";
import { Text } from "@/components/ui/text";
import { formatCount, formatPercent } from "@/lib/numbers";
import { foregroundOnColor } from "@/lib/utils/foreground-on-color";
import { Color, Link, Stack } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { PressableScale } from "pressto";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SecondaryStat } from "./components/secondary-stat";
import { useHabitDetailModel } from "./hooks/use-habit-detail-model";
import { styles } from "./styles";

export function HabitDetailScreen() {
  const { t, i18n } = useTranslation("habitDetail");
  const model = useHabitDetailModel();

  if (!model) return null;

  const {
    habit,
    completed,
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
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="pencil"
          accessibilityLabel={t("editHabit")}
          onPress={editHabit}
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
                doneToday ? t("undoCheckInLabel") : t("checkInLabel")
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
                {doneToday ? t("undoCheckIn") : t("checkIn")}
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
              <SymbolView
                name="flame.fill"
                size={22}
                tintColor={
                  streaks.current > 0 ? habit.color : Color.ios.tertiaryLabel
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
            <SecondaryStat
              symbol="trophy.fill"
              color="#FFCC00"
              value={formatCount(streaks.best, i18n.language)}
              label={t("bestStreak")}
            />
            <View style={styles.secondaryDivider} />
            <SecondaryStat
              symbol="chart.bar.fill"
              color="#007AFF"
              value={formatPercent(rate, i18n.language)}
              label={t("monthRate")}
            />
          </View>
        </Animated.View>

        {/* The heat card is the zoom source: tapping it expands the same grid
            into the full-history screen instead of sliding a new card in. */}
        <Animated.View entering={FadeInDown.duration(280).delay(120)}>
          <Link href={historyHref} asChild>
            <Link.Trigger withAppleZoom>
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
