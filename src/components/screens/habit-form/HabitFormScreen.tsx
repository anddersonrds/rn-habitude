import { useHabitFormModel } from "@/components/screens/habit-form/useHabitFormModel";
import { appFontFamily, Text } from "@/components/ui/Text";
import {
  HABIT_COLORS,
  HABIT_ICONS,
  WEEKDAY_KEYS,
} from "@/constants/habit-options";
import { layout } from "@/constants/layout";
import { foregroundOnColor } from "@/theme/colors";
import {
  DatePicker,
  Host,
  Picker,
  Button as SwiftUIButton,
  Text as SwiftUIText,
} from "@expo/ui/swift-ui";
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  font,
  labelStyle,
  pickerStyle,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { Color, Stack } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { PressableScale } from "pressto";
import { useTranslation } from "react-i18next";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";

const CONDITIONAL_LAYOUT = LinearTransition.duration(200);
const CONDITIONAL_ENTER = FadeInDown.duration(180);
const CONDITIONAL_EXIT = FadeOutUp.duration(140);

/** Swatch diameter in the color grid. */
const COLOR_RING = 42;
/** Smallest acceptable gap; this is what decides how many fit per row. */
const COLOR_GAP_MIN = 6;
/** Horizontal padding inside the color card. Shared by the style and the math. */
const COLOR_CARD_PADDING = 12;

/**
 * How many swatches fit per row, and the gap that makes a full row span the
 * card exactly. Applying that same gap to a partial row is the whole point:
 * `justifyContent: "space-between"` spreads a partial row across the full
 * width, which is what pushed two leftover swatches to opposite edges.
 */
function colorGridMetrics(windowWidth: number) {
  const width = windowWidth - layout.screenPadding * 2 - COLOR_CARD_PADDING * 2;
  const columns = Math.max(
    1,
    Math.floor((width + COLOR_GAP_MIN) / (COLOR_RING + COLOR_GAP_MIN)),
  );
  const gap =
    columns > 1 ? (width - columns * COLOR_RING) / (columns - 1) : COLOR_GAP_MIN;

  return { columns, gap };
}

export function HabitFormScreen() {
  const { t: tSchedule } = useTranslation("schedule");
  const { width: windowWidth } = useWindowDimensions();
  const {
    isEditing,
    name,
    setName,
    icon,
    color,
    daily,
    frequency,
    weekdays,
    reminderOn,
    reminderDate,
    canSave,
    toggleWeekday,
    chooseFrequency,
    selectIcon,
    selectColor,
    toggleReminder,
    pickReminderTime,
    save,
    cancel,
    confirmDelete,
  } = useHabitFormModel();

  // Explicit rows rather than `flexWrap`: the derived gap makes a full row
  // exactly the container width, and whether flexbox wraps at exact equality
  // is a floating point coin flip.
  const { columns: colorColumns, gap: colorGap } = colorGridMetrics(windowWidth);
  const colorRows = Array.from(
    { length: Math.ceil(HABIT_COLORS.length / colorColumns) },
    (_, row) => HABIT_COLORS.slice(row * colorColumns, (row + 1) * colorColumns),
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? "Edit Habit" : "New Habit",
          headerShown: true,
        }}
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button variant="plain" onPress={cancel}>
          Cancel
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          variant="prominent"
          tintColor={color}
          disabled={!canSave}
          onPress={save}
        >
          {isEditing ? "Save" : "Add"}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <View style={styles.container}>
        <KeyboardAwareScrollView
          bottomOffset={64}
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.nameCard}>
            <View style={[styles.namePreviewIcon, { backgroundColor: `${color}26` }]}>
              <SymbolView name={icon as SFSymbol} size={22} tintColor={color} />
            </View>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="What do you want to do?"
              placeholderTextColor={Color.ios.tertiaryLabel as never}
              accessibilityLabel="Habit name"
              autoFocus={!isEditing}
              clearButtonMode="while-editing"
              enablesReturnKeyAutomatically
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              maxLength={40}
              style={styles.nameInput}
            />
          </View>

          <Text variant="footnote" secondary style={styles.sectionLabel}>
            SCHEDULE
          </Text>
          <Animated.View layout={CONDITIONAL_LAYOUT} style={styles.card}>
            <View style={styles.schedulePicker}>
              <Text variant="subheadline" secondary>
                Frequency
              </Text>
              <Host style={styles.pickerHost}>
                <Picker
                  label="Frequency"
                  selection={frequency}
                  onSelectionChange={chooseFrequency}
                  modifiers={[pickerStyle("segmented"), tint(color)]}
                >
                  <SwiftUIText modifiers={[font({ design: "rounded" }), tag("daily")]}>
                    Daily
                  </SwiftUIText>
                  <SwiftUIText
                    modifiers={[font({ design: "rounded" }), tag("specific")]}
                  >
                    Days
                  </SwiftUIText>
                </Picker>
              </Host>
            </View>
            {!daily && (
              <Animated.View
                entering={CONDITIONAL_ENTER}
                exiting={CONDITIONAL_EXIT}
                style={styles.conditionalBlock}
              >
                <View style={styles.separator} />
                <View style={styles.weekdayRow}>
                  {WEEKDAY_KEYS.map((keys, day) => {
                    const selected = weekdays.includes(day);
                    return (
                      <Pressable
                        key={day}
                        accessibilityRole="button"
                        accessibilityLabel={tSchedule(keys.name)}
                        accessibilityState={{ selected }}
                        onPress={() => toggleWeekday(day)}
                        style={[
                          styles.weekdayDot,
                          {
                            backgroundColor: selected
                              ? color
                              : Color.ios.tertiarySystemFill,
                          },
                        ]}
                      >
                        <Text
                          variant="subheadline"
                          style={{
                            color: selected
                              ? foregroundOnColor(color)
                              : (Color.ios.secondaryLabel as never),
                            fontWeight: "600",
                          }}
                        >
                          {tSchedule(keys.initial)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {weekdays.length === 0 && (
                  <Text variant="caption" style={styles.validationText}>
                    Choose at least one day.
                  </Text>
                )}
              </Animated.View>
            )}
          </Animated.View>

          <Text variant="footnote" secondary style={styles.sectionLabel}>
            REMINDER
          </Text>
          <Animated.View layout={CONDITIONAL_LAYOUT} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.rowLabel}>
                <SymbolView name="bell.fill" size={18} tintColor={color} />
                <Text variant="body">Remind me</Text>
              </View>
              <Switch
                value={reminderOn}
                onValueChange={(enabled) => void toggleReminder(enabled)}
                trackColor={{ true: color }}
              />
            </View>
            {reminderOn && (
              <Animated.View entering={CONDITIONAL_ENTER} exiting={CONDITIONAL_EXIT}>
                <View style={styles.separator} />
                <View style={styles.cardRow}>
                  <Text variant="body">Time</Text>
                  <Host matchContents>
                    <DatePicker
                      selection={reminderDate}
                      displayedComponents={["hourAndMinute"]}
                      onDateChange={pickReminderTime}
                      modifiers={[tint(color)]}
                    />
                  </Host>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          <Text variant="footnote" secondary style={styles.sectionLabel}>
            ICON
          </Text>
          <View style={styles.iconCard}>
            <View style={styles.iconGrid}>
              {HABIT_ICONS.map((symbol) => {
                const selected = symbol === icon;
                return (
                  <Pressable
                    key={symbol}
                    accessibilityRole="button"
                    accessibilityLabel={`Icon ${symbol}`}
                    accessibilityState={{ selected }}
                    onPress={() => selectIcon(symbol)}
                    style={[
                      styles.iconCell,
                      {
                        backgroundColor: selected
                          ? color
                          : Color.ios.tertiarySystemFill,
                      },
                    ]}
                  >
                    <SymbolView
                      name={symbol}
                      size={21}
                      tintColor={
                        selected ? foregroundOnColor(color) : Color.ios.secondaryLabel
                      }
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text variant="footnote" secondary style={styles.sectionLabel}>
            COLOR
          </Text>
          <View style={styles.colorCard}>
            <View style={styles.colorGrid}>
              {colorRows.map((rowColors, row) => (
                <View key={row} style={[styles.colorRow, { gap: colorGap }]}>
                  {rowColors.map((optionColor) => {
                    const selected = optionColor === color;
                    return (
                      <Pressable
                        key={optionColor}
                        accessibilityRole="button"
                        accessibilityLabel={`Color ${optionColor}`}
                        accessibilityState={{ selected }}
                        onPress={() => selectColor(optionColor)}
                        style={[
                          styles.colorRing,
                          selected && { borderColor: optionColor },
                        ]}
                      >
                        <View
                          style={[
                            styles.colorDot,
                            { backgroundColor: optionColor },
                          ]}
                        >
                          {selected && (
                            <SymbolView
                              name="checkmark"
                              size={13}
                              weight="bold"
                              tintColor={foregroundOnColor(optionColor)}
                            />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {isEditing && (
            <PressableScale onPress={confirmDelete} style={styles.deleteButton}>
              <Text variant="headline" style={{ color: Color.ios.systemRed }}>
                Delete habit
              </Text>
            </PressableScale>
          )}
        </KeyboardAwareScrollView>

        <KeyboardStickyView
          offset={{ closed: 56 }}
          pointerEvents="box-none"
          style={styles.keyboardAccessory}
        >
          <View pointerEvents="box-none" style={styles.keyboardAccessoryRow}>
            <Host matchContents>
              <SwiftUIButton
                label="Dismiss keyboard"
                systemImage="keyboard.chevron.compact.down"
                modifiers={[
                  buttonStyle("glass"),
                  buttonBorderShape("circle"),
                  controlSize("large"),
                  labelStyle("iconOnly"),
                ]}
                onPress={Keyboard.dismiss}
              />
            </Host>
            {canSave && (
              <Host matchContents>
                <SwiftUIButton
                  label={isEditing ? "Save habit" : "Create habit"}
                  systemImage="checkmark"
                  modifiers={[
                    buttonStyle("glassProminent"),
                    buttonBorderShape("circle"),
                    controlSize("large"),
                    labelStyle("iconOnly"),
                    tint(color),
                  ]}
                  onPress={save}
                />
              </Host>
            )}
          </View>
        </KeyboardStickyView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.bottomPadding,
  },
  nameCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  namePreviewIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  nameInput: {
    flex: 1,
    fontFamily: appFontFamily,
    fontSize: 17,
    color: Color.ios.label,
    paddingVertical: 7,
  },
  sectionLabel: {
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: "600",
  },
  card: {
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  schedulePicker: {
    gap: 9,
    paddingVertical: 14,
  },
  pickerHost: {
    height: 34,
  },
  conditionalBlock: {
    paddingBottom: 14,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Color.ios.separator,
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 14,
  },
  weekdayDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  validationText: {
    color: Color.ios.systemRed,
    paddingTop: 10,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    minHeight: 52,
  },
  rowLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  iconCard: {
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    padding: 14,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  iconCell: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  colorCard: {
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    padding: COLOR_CARD_PADDING,
  },
  colorGrid: {
    gap: COLOR_GAP_MIN,
  },
  colorRow: {
    flexDirection: "row",
  },
  colorRing: {
    width: COLOR_RING,
    height: COLOR_RING,
    borderRadius: COLOR_RING / 2,
    borderWidth: 2.5,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    marginTop: 28,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
  },
  keyboardAccessory: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    height: 48,
    justifyContent: "center",
  },
  keyboardAccessoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
});
