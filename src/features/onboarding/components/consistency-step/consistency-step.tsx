import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { FeatureRow } from "../feature-row";
import { styles } from "./styles";

export function ConsistencyStep() {
  const { t } = useTranslation("onboarding");

  return (
    <View style={styles.featureList}>
      <FeatureRow
        index={0}
        symbol="square.grid.3x3.fill"
        title={t("squareTitle")}
        description={t("squareDescription")}
      />
      <FeatureRow
        index={1}
        symbol="flame.fill"
        title={t("streakTitle")}
        description={t("streakDescription")}
      />
      <FeatureRow
        index={2}
        symbol="rectangle.3.group.fill"
        title={t("widgetTitle")}
        description={t("widgetDescription")}
      />
    </View>
  );
}
