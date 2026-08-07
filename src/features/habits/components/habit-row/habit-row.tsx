import {
  Button,
  ContextMenu,
  HStack,
  Image,
  Spacer,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  accessibilityHint,
  accessibilityLabel,
  background,
  contentShape,
  font,
  frame,
  moveDisabled,
  onTapGesture,
  opacity,
  shapes,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import { useTranslation } from "react-i18next";
import { HeatStrip } from "../heat-strip";
import type { Props } from "./types";

export function HabitRow({
  habit,
  states,
  streak,
  schedule,
  neutral,
  reordering,
  onOpen,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation(["habits", "common"]);

  const content = (
    <HStack
      spacing={12}
      modifiers={[
        /* `tag` rides on whichever view is the row's root, so it moves here
        when the context menu is gone. */
        ...(reordering ? [tag(habit.id)] : []),
        contentShape(shapes.rectangle()),
        accessibilityLabel(
          streak > 0
            ? t("rowLabelWithStreak", {
                name: habit.name,
                schedule,
                count: streak,
              })
            : t("rowLabel", { name: habit.name, schedule }),
        ),
        accessibilityHint(t(reordering ? "reorderingHint" : "idleHint")),
        ...(reordering ? [] : [onTapGesture(onOpen)]),
      ]}
    >
      <Image
        systemName={habit.icon as never}
        color={habit.color}
        size={19}
        modifiers={[
          frame({ width: 40, height: 40 }),
          background(
            `${habit.color}26`,
            shapes.roundedRectangle({ cornerRadius: 11 }),
          ),
        ]}
      />
      <VStack alignment="leading" spacing={3}>
        <Text modifiers={[font({ design: "rounded", textStyle: "headline" })]}>
          {habit.name}
        </Text>
        <HStack spacing={5}>
          {streak > 0 && (
            <Image systemName="flame.fill" color={habit.color} size={10} />
          )}
          <Text
            modifiers={[
              font({ design: "rounded", textStyle: "footnote" }),
              opacity(0.55),
            ]}
          >
            {streak > 0
              ? t("streakAndSchedule", { count: streak, schedule })
              : schedule}
          </Text>
        </HStack>
      </VStack>
      <Spacer />
      <HeatStrip states={states} color={habit.color} neutral={neutral} />
    </HStack>
  );

  /* A `ContextMenu` row is a container with slots and its drops are discarded;
  a leaf row is what actually reorders. Verified on device both ways. */
  if (reordering) return content;

  /* Without `moveDisabled` the row lifts and always snaps back, which is an
  affordance promising something it cannot do. */
  return (
    <ContextMenu modifiers={[tag(habit.id), moveDisabled()]}>
      <ContextMenu.Items>
        <Button
          label={t("open")}
          systemImage="chart.bar.fill"
          onPress={onOpen}
        />
        <Button
          label={t("common:edit")}
          systemImage="pencil"
          onPress={onEdit}
        />
        <Button
          label={t("common:delete")}
          systemImage="trash"
          role="destructive"
          onPress={onDelete}
        />
      </ContextMenu.Items>
      <ContextMenu.Trigger>{content}</ContextMenu.Trigger>
    </ContextMenu>
  );
}
