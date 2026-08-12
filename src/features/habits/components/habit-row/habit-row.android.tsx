import { AppSymbol } from "@/components/ui/app-symbol";
import { Text } from "@/components/ui/text";
import { colors } from "@/theme";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { HeatStrip } from "../heat-strip";
import { ROW_PITCH, styles } from "./styles";
import type { DragProps, Props } from "./types";

const SHIFT = { duration: 140 };

function clamp(value: number, last: number) {
  "worklet";
  return Math.min(Math.max(value, 0), last);
}

export function HabitRow({
  habit,
  states,
  streak,
  schedule,
  neutral,
  reordering,
  index,
  count,
  drag,
  onDrop,
  onOpen,
  onEdit,
  onDelete,
}: Props & DragProps) {
  const { t } = useTranslation(["habits", "common"]);
  const [actionsOpen, setActionsOpen] = useState(false);

  /* The gesture is the handle's, not the row's, so nothing competes with the
  scroll while the list is being reordered. */
  const gesture = Gesture.Pan()
    .withTestId(`reorder-${habit.id}`)
    .onBegin(() => drag.start(index))
    .onUpdate((event) => drag.move(event.translationY))
    .onFinalize(() => {
      const target = clamp(index + Math.round(drag.y.value / ROW_PITCH), count - 1);
      if (target !== index) runOnJS(onDrop)(index, target);
      drag.end();
    });

  const lift = useAnimatedStyle(() => {
    if (drag.index.value === index) {
      return { transform: [{ translateY: drag.y.value }], zIndex: 1 };
    }
    if (drag.index.value < 0) return { transform: [{ translateY: 0 }], zIndex: 0 };

    const target = clamp(
      drag.index.value + Math.round(drag.y.value / ROW_PITCH),
      count - 1,
    );
    const opens =
      index > drag.index.value && index <= target
        ? -ROW_PITCH
        : index < drag.index.value && index >= target
          ? ROW_PITCH
          : 0;
    return { transform: [{ translateY: withTiming(opens, SHIFT) }], zIndex: 0 };
  });

  const label =
    streak > 0
      ? t("rowLabelWithStreak", { name: habit.name, schedule, count: streak })
      : t("rowLabel", { name: habit.name, schedule });

  return (
    <Animated.View style={[styles.row, lift]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={t(reordering ? "reorderingHint" : "idleHint")}
        onPress={reordering ? undefined : onOpen}
        onLongPress={reordering ? undefined : () => setActionsOpen((open) => !open)}
        style={styles.content}
      >
        <View style={[styles.icon, { backgroundColor: `${habit.color}26` }]}>
          <AppSymbol name={habit.icon} size={19} tintColor={habit.color} />
        </View>
        <View style={styles.labels}>
          <Text variant="headline" numberOfLines={1}>
            {habit.name}
          </Text>
          <View style={styles.subtitle}>
            {streak > 0 && (
              <AppSymbol name="flame.fill" size={10} tintColor={habit.color} />
            )}
            <Text variant="footnote" secondary>
              {streak > 0
                ? t("streakAndSchedule", { count: streak, schedule })
                : schedule}
            </Text>
          </View>
        </View>
        {reordering ? (
          <GestureDetector gesture={gesture}>
            <View
              accessible
              accessibilityRole="button"
              accessibilityLabel={t("reorder")}
              style={styles.handle}
            >
              <AppSymbol
                name="line.3.horizontal"
                size={20}
                tintColor={colors.tertiaryText}
              />
            </View>
          </GestureDetector>
        ) : (
          <HeatStrip states={states} color={habit.color} neutral={neutral} />
        )}
      </Pressable>

      {actionsOpen && !reordering && (
        <View style={styles.actions}>
          {(
            [
              { key: "open", label: t("open"), symbol: "chart.bar.fill", run: onOpen },
              { key: "edit", label: t("common:edit"), symbol: "pencil", run: onEdit },
              { key: "delete", label: t("common:delete"), symbol: "trash", run: onDelete },
            ] as const
          ).map(({ key, label: text, symbol, run }) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={text}
              onPress={() => {
                setActionsOpen(false);
                run();
              }}
              style={styles.action}
            >
              <AppSymbol
                name={symbol}
                size={15}
                tintColor={key === "delete" ? colors.destructive : colors.text}
              />
              <Text
                variant="subheadline"
                style={key === "delete" ? { color: colors.destructive } : undefined}
              >
                {text}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </Animated.View>
  );
}
