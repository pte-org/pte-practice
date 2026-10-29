/**
 * Which control should take focus when Tab would leave a modal panel, or null to let the browser move on.
 * `activeIndex` is the focused control's place among the panel's controls, or -1 when focus is outside it.
 */
export function trapTarget(input: { activeIndex: number; count: number; shiftKey: boolean }): number | null {
  const { activeIndex, count, shiftKey } = input;
  if (count === 0) return null;
  const last = count - 1;
  if (activeIndex < 0) return shiftKey ? last : 0;
  if (!shiftKey && activeIndex === last) return 0;
  if (shiftKey && activeIndex === 0) return last;
  return null;
}
