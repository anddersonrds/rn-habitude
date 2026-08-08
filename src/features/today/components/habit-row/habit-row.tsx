import { accent, success, tints } from "@/theme";
import {
  Button,
  HStack,
  Image,
  Spacer,
  SwipeActions,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  animation,
  Animation,
  background,
  contentShape,
  contentTransition,
  deleteDisabled,
  font,
  frame,
  onTapGesture,
  opacity,
  scaleEffect,
  shapes,
  strikethrough,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useTranslation } from "react-i18next";
import type { Props } from "./types";

const STATUS_ANIMATION = Animation.spring({ duration: 0.32, bounce: 0.18 });

export function HabitRow({
  item,
  onToggle,
  onEdit,
  onHistory,
  onDelete,
}: Props) {
  const { t } = useTranslation(["today", "common"]);
  const { habit, done, subtitle } = item;

  return (
    <SwipeActions modifiers={[tag(habit.id), deleteDisabled()]}>
      <HStack
        spacing={12}
        modifiers={[contentShape(shapes.rectangle()), onTapGesture(onToggle)]}
      >
        <Image
          systemName={habit.icon as never}
          color={habit.color}
          size={18}
          modifiers={[
            frame({ width: 38, height: 38 }),
            background(
              `${habit.color}26`,
              shapes.roundedRectangle({ cornerRadius: 10 }),
            ),
          ]}
        />
        <VStack alignment="leading" spacing={2}>
          <Text
            modifiers={[
              font({ design: "rounded", textStyle: "headline" }),
              strikethrough({ isActive: done, pattern: "solid" }),
              opacity(done ? 0.45 : 1),
            ]}
          >
            {habit.name}
          </Text>
          {subtitle !== null && (
            <Text
              modifiers={[
                font({ design: "rounded", textStyle: "footnote" }),
                opacity(0.55),
              ]}
            >
              {subtitle}
            </Text>
          )}
        </VStack>
        <Spacer />
        <Image
          systemName={done ? "checkmark.circle.fill" : "circle"}
          color={done ? habit.color : tints.gray}
          size={26}
          modifiers={[
            opacity(done ? 1 : 0.5),
            scaleEffect(done ? 1 : 0.94),
            contentTransition("opacity"),
            animation(STATUS_ANIMATION, done),
          ]}
        />
      </HStack>

      {/* Full swipe from the leading edge checks in, like Mail's mark-as-read. */}
      <SwipeActions.Actions edge="leading">
        <Button
          label={done ? t("undo") : t("checkIn")}
          systemImage={done ? "arrow.uturn.backward" : "checkmark"}
          onPress={onToggle}
          modifiers={[tint(done ? accent : success)]}
        />
      </SwipeActions.Actions>

      <SwipeActions.Actions edge="trailing" allowsFullSwipe={false}>
        <Button
          role="destructive"
          label={t("common:delete")}
          systemImage="trash.fill"
          onPress={onDelete}
        />
        <Button
          label={t("common:edit")}
          systemImage="pencil"
          onPress={onEdit}
          modifiers={[tint(tints.gray)]}
        />
        <Button
          label={t("history")}
          systemImage="chart.bar.fill"
          onPress={onHistory}
          modifiers={[tint(tints.blue)]}
        />
      </SwipeActions.Actions>
    </SwipeActions>
  );
}
