export const TRAINING_SUITE_SIZES = [
  "8M", "10M", "12M", "14M", "16M",
  "8F", "10F", "12F", "14F", "16F",
] as const;

export type SuiteCounts = Record<string, number>;

export function parseTrainingSuites(value: string | null): SuiteCounts {
  const counts: SuiteCounts = {};
  if (!value) return counts;
  for (const part of value.split(",")) {
    const [qty, size] = part.trim().split("X");
    if (qty && size) counts[size] = Number(qty);
  }
  return counts;
}

export function stringifyTrainingSuites(counts: SuiteCounts): string {
  return Object.entries(counts)
    .filter(([, qty]) => qty > 0)
    .map(([size, qty]) => `${qty}X${size}`)
    .join(",");
}