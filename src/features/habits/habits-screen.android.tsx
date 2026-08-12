import { EmptyState } from "@/components/empty-state";
import { AppSymbol } from "@/components/ui/app-symbol";
import { Text } from "@/components/ui/text";
import { formatCount } from "@/lib/utils/numbers";
import { accent, tints } from "@/theme";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, useColorScheme, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
/* The file rather than the folder: a single typecheck pass resolves the barrel
to the SwiftUI row, which takes none of the drag props. */
import { HabitRow } from "./components/habit-row/habit-row.android";
import type { Drag } from "./components/habit-row/types";
import { useHabitsModel } from "./hooks/use-habits-model";
import { styles } from "./styles";

/**
 * React Native rather than Compose: a list of rows would otherwise be the
 * Compose case, but `@expo/ui/jetpack-compose` has no drag-to-reorder, and the
 * gesture and the heat graph the rows draw are both React Native already.
 */
export function HabitsScreen() {
  const { t, i18n } = useTranslation(["habits", "common"]);
  const {
    rows,
    hasHabits,
    canReorder,
    countLabel,
    bestStreak,
    totalCheckIns,
    reordering,
    toggleReordering,
    addHabit,
    openHabit,
    editHabit,
    confirmDelete,
    move,
  } = useHabitsModel();
  const neutral = useColorScheme() === "dark" ? tints.white : tints.black;
  const dragIndex = useSharedValue(-1);
  const dragY = useSharedValue(0);

  /* The values are the screen's because every row reads them, and only the
  screen that declared them may write them. */
  const drag: Drag = {
    index: dragIndex,
    y: dragY,
    start: (row) => {
      "worklet";
      dragIndex.value = row;
      dragY.value = 0;
    },
    move: (y) => {
      "worklet";
      dragY.value = y;
    },
    end: () => {
      "worklet";
      dragIndex.value = -1;
      dragY.value = 0;
    },
  };

  /* `move` takes SwiftUI's destination, an index into the array before the row
  is pulled out of it, so a row travelling down lands one further along. */
  const drop = (from: number, to: number) => move([from], to > from ? to + 1 : to);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              {canReorder && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={reordering ? t("reorderDone") : t("reorder")}
                  onPress={toggleReordering}
                  style={styles.headerAction}
                >
                  <Text variant="body" style={{ color: accent }}>
                    {reordering ? t("reorderDone") : t("reorder")}
                  </Text>
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("common:addHabit")}
                onPress={addHabit}
                style={styles.headerAction}
              >
                <AppSymbol name="plus" size={22} tintColor={accent} />
              </Pressable>
            </View>
          ),
        }}
      />

      {!hasHabits ? (
        <View style={styles.empty}>
          <EmptyState
            symbol="square.grid.2x2"
            title={t("common:noHabitsYet")}
            description={t("emptyDescription")}
            actionLabel={t("common:newHabit")}
            onAction={addHabit}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="footnote" secondary style={styles.sectionLabel}>
            {countLabel}
          </Text>
          <View style={styles.totalsCard}>
            <View>
              <Text variant="title2">
                {formatCount(bestStreak, i18n.language)}
              </Text>
              <Text variant="footnote" secondary>
                {t("longestStreak")}
              </Text>
            </View>
            <View style={styles.totalsTrailing}>
              <Text variant="headline">
                {formatCount(totalCheckIns, i18n.language)}
              </Text>
              <Text variant="caption" secondary>
                {t("checkIns")}
              </Text>
            </View>
          </View>

          {rows.map(({ habit, states, streak, schedule }, index) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              states={states}
              streak={streak}
              schedule={schedule}
              neutral={neutral}
              reordering={reordering}
              index={index}
              count={rows.length}
              drag={drag}
              onDrop={drop}
              onOpen={() => openHabit(habit)}
              onEdit={() => editHabit(habit)}
              onDelete={() => confirmDelete(habit)}
            />
          ))}

          <Text variant="footnote" secondary style={styles.footer}>
            {t(reordering ? "reorderingFooter" : "idleFooter")}
          </Text>
        </ScrollView>
      )}
    </>
  );
}
