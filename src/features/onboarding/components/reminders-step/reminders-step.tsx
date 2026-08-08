import { Text } from "@/components/ui/text";
import { foregroundOnColor } from "@/lib/utils/foreground-on-color";
import { accent } from "@/theme";
import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { FadeInUp, useReducedMotion } from "react-native-reanimated";
import { styles } from "./styles";
import type { Props } from "./types";

export function RemindersStep({ allowed }: Props) {
  const { t } = useTranslation("onboarding");
  const reduceMotion = useReducedMotion();

  return (
    <View style={styles.body}>
      <Animated.View
        entering={reduceMotion ? undefined : FadeInUp.duration(320)}
        style={[styles.notificationArtwork, { backgroundColor: `${accent}12` }]}
      >
        <View style={[styles.bellCircle, { backgroundColor: accent }]}>
          <SymbolView
            name={allowed ? "checkmark" : "bell.fill"}
            size={36}
            tintColor={foregroundOnColor(accent)}
            animationSpec={{
              effect: { type: allowed ? "bounce" : "pulse", direction: "up" },
            }}
          />
        </View>
        <View style={styles.notificationCard}>
          <View style={styles.notificationHeader}>
            <View style={[styles.miniAppIcon, { backgroundColor: accent }]}>
              <SymbolView
                name="checklist"
                size={13}
                tintColor={foregroundOnColor(accent)}
              />
            </View>
            <Text variant="caption" secondary>
              {t("notificationHeader")}
            </Text>
          </View>
          <Text variant="headline">{t("notificationHabit")}</Text>
          <Text variant="subheadline" secondary>
            {t("notificationBody")}
          </Text>
        </View>
      </Animated.View>

      <View style={styles.points}>
        <View style={styles.point}>
          <SymbolView name="slider.horizontal.3" size={18} tintColor={accent} />
          <Text variant="subheadline" secondary style={styles.pointCopy}>
            {t("pointReminders")}
          </Text>
        </View>
        <View style={styles.point}>
          <SymbolView name="hand.tap.fill" size={18} tintColor={accent} />
          <Text variant="subheadline" secondary style={styles.pointCopy}>
            {t("pointCheckIn")}
          </Text>
        </View>
      </View>

      {allowed && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInUp.duration(220)}
          style={styles.allowedBadge}
        >
          <SymbolView name="checkmark.circle.fill" size={20} tintColor="#34C759" />
          <Text variant="subheadline">{t("permissionAllowed")}</Text>
        </Animated.View>
      )}
    </View>
  );
}
