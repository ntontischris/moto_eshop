/**
 * Pure helpers for scroll-driven hero animation.
 *
 * frameIndexForProgress maps a normalized scroll progress (0..1) to a
 * concrete frame index (0..frameCount-1), clamping out-of-range inputs.
 *
 * opacityForRange returns a smooth 0..1 opacity for a value that should
 * fade in across [start, end].
 */

export function frameIndexForProgress(
  progress: number,
  frameCount: number,
): number {
  const clamped = Math.min(1, Math.max(0, progress));
  const lastIndex = frameCount - 1;
  return Math.round(clamped * lastIndex);
}

export function opacityForRange(
  value: number,
  start: number,
  end: number,
): number {
  if (value <= start) return 0;
  if (value >= end) return 1;
  return (value - start) / (end - start);
}
