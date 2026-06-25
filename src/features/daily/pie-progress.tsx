import Svg, { Circle, Path } from 'react-native-svg';

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

/** SVG path for a pie wedge sweeping clockwise from 12 o'clock, covering `fraction` (0-1) of the circle. */
export function describePieSlice(cx: number, cy: number, r: number, fraction: number): string {
  const clamped = Math.min(1, Math.max(0, fraction));
  if (clamped <= 0) return '';
  if (clamped >= 0.9999) {
    const top = polarToCartesian(cx, cy, r, 0);
    const bottom = polarToCartesian(cx, cy, r, 180);
    return `M ${top.x} ${top.y} A ${r} ${r} 0 1 1 ${bottom.x} ${bottom.y} A ${r} ${r} 0 1 1 ${top.x} ${top.y} Z`;
  }
  const angle = clamped * 360;
  const start = polarToCartesian(cx, cy, r, 0);
  const end = polarToCartesian(cx, cy, r, angle);
  const largeArc = angle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

/** A circular "pie" progress indicator: a wedge sweeping from 12 o'clock to cover `fraction` of the circle. */
export function PieProgress({
  size,
  fraction,
  color,
  trackColor,
}: {
  size: number;
  fraction: number;
  color: string;
  trackColor: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - Math.max(2, size * 0.03);

  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={radius} fill={trackColor} />
      {fraction > 0 && <Path d={describePieSlice(cx, cy, radius, fraction)} fill={color} />}
    </Svg>
  );
}
