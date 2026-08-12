import { materialSymbolFor } from "@/lib/utils/icons";
import { Icon } from "@expo/ui/jetpack-compose";
import { unstable_getMaterialSymbolSourceAsync } from "expo-symbols";
import { useEffect, useState } from "react";
import type { ColorValue, ImageSourcePropType } from "react-native";
import type { Props } from "./types";

/**
 * Rasterised sources, held for the process. A row scrolling back into view has
 * already paid for its symbol, and resolving again would blank it for a frame.
 * Keyed by everything the image is baked from.
 */
const sources = new Map<string, ImageSourcePropType>();

/*
The work in flight, so a list of rows sharing an icon rasterises it once. The
cache above cannot cover this: it only fills when the first resolve lands, and
by then every row has asked.
*/
const rasterising = new Map<string, Promise<void>>();

function rasterise(
  key: string,
  name: string,
  size: number,
  color: ColorValue,
): Promise<void> {
  const started = rasterising.get(key);
  if (started) return started;

  const work = unstable_getMaterialSymbolSourceAsync(
    materialSymbolFor(name),
    size,
    String(color),
  )
    .then((source) => {
      if (source) sources.set(key, source);
    })
    .catch(() => {
      /* A symbol that will not rasterise draws nothing, like an unmapped one. */
    })
    .finally(() => {
      rasterising.delete(key);
    });

  rasterising.set(key, work);
  return work;
}

/**
 * A symbol for inside a Compose `<Host>`, where `AppSymbol` cannot go: a Compose
 * tree hosts native Compose views, and `SymbolView` is a React Native one. The
 * Compose `Icon` takes an image, so the glyph is rendered to one.
 *
 * This is the only call site of `unstable_getMaterialSymbolSourceAsync`, so the
 * `unstable_` prefix reaches one file.
 */
export function ComposeSymbol({
  name,
  size = 24,
  color,
  contentDescription,
}: Props) {
  const key = `${name}:${size}:${String(color)}`;
  const cached = sources.get(key);
  /* Only a nudge to render again once a resolve lands; the cache holds the value. */
  const [, setResolved] = useState(0);

  useEffect(() => {
    if (sources.has(key)) return;

    let live = true;
    rasterise(key, name, size, color).then(() => {
      if (live) setResolved((count) => count + 1);
    });

    return () => {
      live = false;
    };
  }, [key, name, size, color]);

  /* Nothing rather than a placeholder: a box that appears later shifts the row. */
  if (!cached) return null;

  return (
    <Icon
      source={cached}
      size={size}
      tint={color}
      contentDescription={contentDescription}
    />
  );
}
