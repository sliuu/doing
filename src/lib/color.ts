/** `#rrggbb` plus an opacity (0–1) → `#rrggbbaa`, for translucent tints of a solid color. */
export function withAlpha(hex: string, opacity: number): string {
  const alpha = Math.round(Math.min(1, Math.max(0, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${alpha}`;
}
