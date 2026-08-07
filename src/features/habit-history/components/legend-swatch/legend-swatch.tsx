import { Text } from "@/components/ui/text";
import { View } from "react-native";
import { styles } from "./styles";
import type { Props } from "./types";

export function LegendSwatch({ color, label }: Props) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text variant="caption" secondary>
        {label}
      </Text>
    </View>
  );
}
