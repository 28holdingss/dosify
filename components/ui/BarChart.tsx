import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

type BarChartProps = {
  data: number[];
  labels: string[];
  height?: number;
  color?: string;
};

export function BarChart({
  data,
  labels,
  height = 160,
  color = colors.primary,
}: BarChartProps) {
  const width = 320;
  const padding = { top: 16, right: 8, bottom: 28, left: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const max = Math.max(...data, 1) * 1.1;
  const barWidth = chartW / data.length - 4;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {data.map((v, i) => {
          const barH = (v / max) * chartH;
          const x = padding.left + i * (barWidth + 4);
          const y = padding.top + chartH - barH;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={3}
              fill={color}
              opacity={0.7 + (i / data.length) * 0.3}
            />
          );
        })}
        {labels.map((label, i) => (
          <SvgText
            key={label}
            x={padding.left + i * (barWidth + 4) + barWidth / 2}
            y={height - 6}
            fill={colors.textMuted}
            fontSize={9}
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
});
