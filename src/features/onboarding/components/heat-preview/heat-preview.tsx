import { HeatGraph } from "@/components/heat-graph";
import type { HeatStatus } from "@/lib/heat";
import { accent } from "@/theme";

const WEEKS = 9;
const DAYS = 7;

/* A fixed, human-looking pattern: dense recently, patchier further back. */
const COLUMNS: HeatStatus[][] = Array.from({ length: WEEKS }, (_, week) =>
  Array.from({ length: DAYS }, (_, weekday) => {
    const seed = (week * DAYS + weekday * 3) % 11;
    return seed > 3 - Math.floor(week / 3) ? "done" : "missed";
  }),
);

/** A miniature heat grid, so the core idea is visible before any data exists. */
export function HeatPreview() {
  return (
    <HeatGraph
      columns={COLUMNS}
      accent={accent}
      cellHeight={18}
      gap={5}
      radius={5}
      entering={{ duration: 240, columnDelay: 45, cellDelay: 12 }}
    />
  );
}
