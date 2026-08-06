/** Numbers a screen shows on their own, formatted for the app's language. */

export function formatCount(value: number, language: string): string {
  return new Intl.NumberFormat(language).format(value);
}

/** Takes the fraction, not the percentage: `0.83` becomes "83%". */
export function formatPercent(fraction: number, language: string): string {
  return new Intl.NumberFormat(language, { style: "percent" }).format(fraction);
}
