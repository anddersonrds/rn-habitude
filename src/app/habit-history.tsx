import { HeatMap } from "@/components/heat-map";
import { Text } from "@/components/ui/text";
import { layout } from "@/constants/layout";
import { todayKey } from "@/lib/dates";
import { useAppState } from "@/lib/store";
import { formatCount, formatPercent } from "@/lib/numbers";
import { completionRate, computeStreaks } from "@/lib/streaks";
import { Color, router, Stack, useLocalSearchParams } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

const HISTORY_WEEKS = 52;

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text variant="caption" secondary>
        {label}
      </Text>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="title2" style={styles.statNumber}>
        {value}
      </Text>
      <Text variant="footnote" secondary>
        {label}
      </Text>
    </View>
  );
}

/** Full-year consistency, reached with a zoom transition from the habit card. */
export default function HabitHistoryScreen() {
  const { t, i18n } = useTranslation("history");
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
  const totalDone = Object.keys(completed ?? {}).length;
  const yearRate = completionRate(habit, completed, 365, today);

  return (
    <>
      <Stack.Screen options={{ title: habit.name }} />
      <ScrollView
        style={styles.container}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.icon, { backgroundColor: `${habit.color}26` }]}>
              <SymbolView
                name={habit.icon as SFSymbol}
                size={18}
                tintColor={habit.color}
              />
            </View>
            <View style={styles.cardTitle}>
              <Text variant="headline">{t("consistency")}</Text>
              <Text variant="footnote" secondary>
                {t("range")}
              </Text>
            </View>
          </View>

          <HeatMap
            habit={habit}
            completed={completed}
            weeks={HISTORY_WEEKS}
            cellSize={12}
            gap={3}
            labels
            scrollable
          />

          <View style={styles.legend}>
            <LegendSwatch color={habit.color} label={t("legendDone")} />
            <LegendSwatch
              color={Color.ios.tertiarySystemFill as string}
              label={t("legendMissed")}
            />
            <LegendSwatch
              color={Color.ios.quaternarySystemFill as string}
              label={t("legendRest")}
            />
          </View>
        </View>

        <View style={styles.statsCard}>
          <Stat
            value={formatCount(totalDone, i18n.language)}
            label={t("totalCheckIns")}
          />
          <View style={styles.statDivider} />
          <Stat
            value={formatCount(streaks.best, i18n.language)}
            label={t("bestStreak")}
          />
          <View style={styles.statDivider} />
          <Stat
            value={formatPercent(yearRate, i18n.language)}
            label={t("yearRate")}
          />
        </View>
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
    gap: 16,
  },
  card: {
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    gap: 2,
  },
  legend: {
    flexDirection: "row",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 11,
    height: 11,
    borderRadius: 3,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    paddingVertical: 16,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statNumber: {
    fontVariant: ["tabular-nums"],
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Color.ios.separator,
  },
});
