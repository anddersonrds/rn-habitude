import { Text } from "@/components/ui/text";
import { SymbolView } from "expo-symbols";
import { View } from "react-native";
import { styles } from "./styles";
import type { Props } from "./types";

/** A metric with its label, in whichever of the two arrangements is asked for. */
export function Stat(props: Props) {
  const { value, label } = props;

  if (props.layout === "row") {
    return (
      <View style={styles.row}>
        <SymbolView name={props.symbol} size={16} tintColor={props.color} />
        <Text variant="subheadline" secondary style={styles.rowLabel}>
          {label}
        </Text>
        <Text variant="headline" style={styles.value}>
          {value}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.column}>
      <Text variant="title2" style={styles.value}>
        {value}
      </Text>
      <Text variant="footnote" secondary>
        {label}
      </Text>
    </View>
  );
}
