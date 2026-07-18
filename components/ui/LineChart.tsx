import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';

type LineChartProps = {
  data: number[][];
  labels: string[];
  colors?: string[];
  height?: number;
  showMarker?: boolean;
  markerIndex?: number;
  /** When set, chart uses theme-aware surface instead of default dark card */
  surfaceColor?: string;
  gridColor?: string;
  markerColor?: string;
  labelColor?: string;
  markerLabel?: string;
};

const defaultLineColors = [colors.purple, colors.blue, colors.green, colors.orange];

function sanitizeValues(values: number[]): number[] {
  return values.map((value) => (Number.isFinite(value) ? value : 0));
}

function computeRange(values: number[]): { min: number; max: number } {
  const sanitized = sanitizeValues(values);
  if (sanitized.length === 0) return { min: 0, max: 1 };

  let min = Math.min(...sanitized);
  let max = Math.max(...sanitized);

  if (min === max) {
    const pad = min === 0 ? 1 : Math.max(Math.abs(min) * 0.1, 1);
    min -= pad * 0.2;
    max += pad;
  } else {
    min *= 0.8;
    max *= 1.1;
  }

  return { min, max };
}

function buildPath(
  series: number[],
  toX: (i: number, total: number) => number,
  toY: (v: number) => number
): string | null {
  const points = series.map((value, index) => {
    const x = toX(index, series.length);
    const y = toY(value);
    return Number.isFinite(x) && Number.isFinite(y) ? `${x},${y}` : null;
  });

  if (points.some((point) => point == null)) return null;
  return `M ${points.join(' L ')}`;
}

export function LineChart({
  data,
  labels,
  colors: lineColors = defaultLineColors,
  height = 180,
  showMarker = false,
  markerIndex = 2,
  surfaceColor,
  gridColor,
  markerColor,
  labelColor,
  markerLabel = 'You are here',
}: LineChartProps) {
  const width = 320;
  const resolvedGrid = gridColor ?? colors.border;
  const resolvedMarker = markerColor ?? colors.text;
  const resolvedLabel = labelColor ?? colors.textMuted;
  const resolvedSurface = surfaceColor ?? colors.surface;
  const padding = { top: 20, right: 16, bottom: 28, left: 16 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = data.flat();
  if (allValues.length === 0 || data.length === 0 || data[0].length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: resolvedSurface }]}>
        <Text style={[styles.empty, { color: resolvedLabel }]}>No chart data</Text>
      </View>
    );
  }

  const { min, max } = computeRange(allValues);

  const toX = (i: number, total: number) =>
    total <= 1
      ? padding.left + chartW / 2
      : padding.left + (i / (total - 1)) * chartW;
  const toY = (v: number) =>
    padding.top + chartH - ((sanitizeValues([v])[0] - min) / (max - min)) * chartH;

  const paths = data
    .map((series) => buildPath(series, toX, toY))
    .filter((path): path is string => path != null);

  if (paths.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: resolvedSurface }]}>
        <Text style={[styles.empty, { color: resolvedLabel }]}>No chart data</Text>
      </View>
    );
  }

  const pointCount = data[0]?.length ?? 0;
  const displayLabels =
    labels.length >= pointCount
      ? labels.slice(0, pointCount)
      : [
          ...labels,
          ...Array.from({ length: Math.max(0, pointCount - labels.length) }, (_, i) =>
            String(i + labels.length + 1)
          ),
        ];

  const markerX = toX(
    Math.min(Math.max(markerIndex, 0), Math.max(pointCount - 1, 0)),
    pointCount
  );

  return (
    <View style={[styles.container, { backgroundColor: resolvedSurface }]}>
      <Svg width={width} height={height}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = padding.top + chartH * (1 - pct);
          return (
            <Line
              key={pct}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke={resolvedGrid}
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
          );
        })}
        {paths.map((d, i) => (
          <Path
            key={i}
            d={d}
            stroke={lineColors[i % lineColors.length]}
            strokeWidth={2}
            fill="none"
          />
        ))}
        {showMarker && Number.isFinite(markerX) && (
          <>
            <Line
              x1={markerX}
              y1={padding.top}
              x2={markerX}
              y2={padding.top + chartH}
              stroke={resolvedMarker}
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
            <Circle cx={markerX} cy={padding.top - 4} r={4} fill={resolvedMarker} />
          </>
        )}
        {displayLabels.map((label, i) => {
          const x = toX(i, displayLabels.length);
          const y = height - 6;
          if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

          const prev = i > 0 ? displayLabels[i - 1] : null;
          const text = label === prev ? '' : label;
          if (!text) return null;

          return (
            <SvgText
              key={`${i}-${label}`}
              x={x}
              y={y}
              fill={resolvedLabel}
              fontSize={10}
              textAnchor="middle"
            >
              {text}
            </SvgText>
          );
        })}
      </Svg>
      {showMarker && (
        <Text style={[styles.marker, { color: resolvedLabel }]}>{markerLabel}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  marker: {
    ...typography.small,
    marginTop: spacing.xs,
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
    paddingVertical: spacing.lg,
  },
});
