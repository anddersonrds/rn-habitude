import { HeatGraph } from "@/components/heat-graph";
import { useHabitHeat } from "@/components/heat-graph/hooks/use-habit-heat";
import { Stat } from "@/components/stat";
import { Text } from "@/components/ui/text";
import { formatCount, formatPercent } from "@/lib/utils/numbers";
import { colors } from "@/theme";
import { Stack } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { LegendSwatch } from "./components/legend-swatch";
import { useHabitHistoryModel } from "./hooks/use-habit-history-model";
import { styles } from "./styles";

const HISTORY_WEEKS = 52;

/** Full-year consistency, reached with a zoom transition from the habit card. */
export function HabitHistoryScreen() {
  const { t, i18n } = useTranslation("history");
  const model = useHabitHistoryModel();
  const heat = useHabitHeat(model?.habit, model?.completed, HISTORY_WEEKS);

  if (!model) return null;

  const { habit, streaks, totalDone, yearRate } = model;

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

          <HeatGraph
            columns={heat.columns}
            accent={habit.color}
            cellSize={12}
            gap={3}
            monthLabels={heat.monthLabels}
            weekdayLabels={heat.weekdayLabels}
            scrollable
          />

          <View style={styles.legend}>
            <LegendSwatch color={habit.color} label={t("legendDone")} />
            <LegendSwatch
              color={colors.fill as string}
              label={t("legendMissed")}
            />
            <LegendSwatch
              color={colors.subtleFill as string}
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
