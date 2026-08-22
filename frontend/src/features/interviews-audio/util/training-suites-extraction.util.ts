import type { SuiteCounts } from "../../surveys/surveys.util";

/**
 * Converts the Worker's structured training_suites extraction
 * ([{ size, count }, ...]) into the Record<size, count> shape the
 * TrainingSuitePicker/suiteCounts state already uses. Unknown/invalid
 * entries are skipped rather than thrown, so a slightly malformed
 * extraction never blocks opening the review dialog.
 */
export function extractedTrainingSuitesToCounts(
  entries: { size: string; count: number }[] | null | undefined,
): SuiteCounts {
  const counts: SuiteCounts = {};
  if (!entries) return counts;

  for (const entry of entries) {
    const size = entry?.size;
    const count = entry?.count;
    if (!size || !Number.isFinite(count) || count <= 0) continue;
    counts[size] = (counts[size] ?? 0) + count;
  }

  return counts;
}
