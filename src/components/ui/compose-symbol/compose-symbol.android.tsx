import { materialSymbolFor } from "@/lib/utils/icons";
import { Icon } from "@expo/ui/jetpack-compose";
import { unstable_getMaterialSymbolSourceAsync } from "expo-symbols";
import { useEffect, useState } from "react";
import type { ColorValue, ImageSourcePropType } from "react-native";
import type { Props } from "./types";

/* Held for the process, keyed by everything the image is baked from. */
const sources = new Map<string, ImageSourcePropType>();

/* A Compose host draws its children once, so an icon mounted after the glyph
lands never appears. The view is there from the start and only its source
changes; this is what it carries until then. */
const BLANK: ImageSourcePropType = {
  uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
};

/*
The cache only fills when the first resolve lands, and by then every row of a
list sharing an icon has asked for its own. So the work in flight is shared too.
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
 * tree hosts Compose views, and `SymbolView` is a React Native one. The Compose
 * `Icon` takes an image, so the glyph is rasterised to one, and this file is the
 * only call site of the `unstable_` function that does it.
 */
export function ComposeSymbol({
  name,
  size = 24,
  color,
  contentDescription,
}: Props) {
  const key = `${name}:${size}:${String(color)}`;
  const cached = sources.get(key);
  /* A nudge to render again; the cache holds the value. */
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

  return (
    <Icon
      source={cached ?? BLANK}
      size={size}
      tint={color}
      contentDescription={contentDescription}
    />
  );
}
