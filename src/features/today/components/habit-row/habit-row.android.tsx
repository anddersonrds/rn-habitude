import { ComposeSymbol } from "@/components/ui/compose-symbol";
import { useSystemColors } from "@/theme";
import {
  Box,
  Card,
  Column,
  Row,
  Text,
  TextButton,
} from "@expo/ui/jetpack-compose";
import {
  alpha,
  background,
  clip,
  combinedClickable,
  fillMaxWidth,
  padding,
  Shapes,
  size,
  weight,
} from "@expo/ui/jetpack-compose/modifiers";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Props } from "./types";

/**
 * iOS keeps edit, history and delete behind a swipe. Compose has no swipe
 * actions, so a long press reveals them as buttons: the actions move from
 * hidden to visible, which is the substitution this milestone chose rather than
 * an unfinished port. Checking in stays the tap, as it is on iOS.
 */
export function HabitRow({
  item,
  onToggle,
  onEdit,
  onHistory,
  onDelete,
}: Props) {
  const { t } = useTranslation(["today", "common"]);
  const colors = useSystemColors();
  const [showingActions, setShowingActions] = useState(false);
  const { habit, done, subtitle } = item;

  return (
    <Card
      modifiers={[
        fillMaxWidth(),
        clip(Shapes.RoundedCorner(20)),
        combinedClickable({
          onClick: onToggle,
          onLongClick: () => setShowingActions((showing) => !showing),
        }),
      ]}
    >
      <Column
        modifiers={[padding(14, 12, 14, 12)]}
        verticalArrangement={{ spacedBy: 8 }}
      >
        <Row
          verticalAlignment="center"
          horizontalArrangement={{ spacedBy: 12 }}
        >
          <Box
            contentAlignment="center"
            modifiers={[
              size(38, 38),
              clip(Shapes.RoundedCorner(10)),
              background(`${habit.color}26`),
            ]}
          >
            <ComposeSymbol name={habit.icon} size={18} color={habit.color} />
          </Box>

          <Column
            modifiers={[weight(1)]}
            verticalArrangement={{ spacedBy: 2 }}
          >
            <Text
              style={{
                typography: "titleMedium",
                textDecoration: done ? "lineThrough" : "none",
              }}
              modifiers={[alpha(done ? 0.45 : 1)]}
            >
              {habit.name}
            </Text>
            {/* A Compose colour is a string; `tsc` reads the palette's iOS type. */}
            {subtitle !== null && (
              <Text
                style={{ typography: "bodySmall" }}
                color={String(colors.secondaryText)}
              >
                {subtitle}
              </Text>
            )}
          </Column>

          <ComposeSymbol
            name={done ? "checkmark.circle.fill" : "circle"}
            size={26}
            color={done ? habit.color : colors.mutedText}
          />
        </Row>

        {showingActions && (
          <Row horizontalArrangement={{ spacedBy: 4 }}>
            <TextButton onClick={onEdit}>
              <Text>{t("common:edit")}</Text>
            </TextButton>
            <TextButton onClick={onHistory}>
              <Text>{t("history")}</Text>
            </TextButton>
            <TextButton onClick={onDelete}>
              <Text color={String(colors.destructive)}>{t("common:delete")}</Text>
            </TextButton>
          </Row>
        )}
      </Column>
    </Card>
  );
}
