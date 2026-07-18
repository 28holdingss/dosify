import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';
import { colors, getRecoveryColor, getRiskColor, getRiskLabel, spatialLight, typography } from '@/constants/theme';

type CircularGaugeProps = {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  sublabel?: string;
  showRisk?: boolean;
  /** Color the ring by risk level even when showRisk label is hidden */
  riskRing?: boolean;
  /** risk = higher is worse; recovery = higher is better */
  mode?: 'risk' | 'recovery';
  suffix?: string;
  variant?: 'dark' | 'light';
};

export function CircularGauge({
  value,
  max = 100,
  size = 160,
  label,
  sublabel,
  showRisk = true,
  riskRing = false,
  mode = 'risk',
  suffix = '',
  variant = 'dark',
}: CircularGaugeProps) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(0, Number.isFinite(value) ? value : 0) / max, 1);
  const strokeDashoffset = circumference * (1 - progress);
  const ringColorFn = mode === 'recovery' ? getRecoveryColor : getRiskColor;
  const ringColor = ringColorFn(value);
  const isLight = variant === 'light';
  const trackColor = isLight ? 'rgba(0, 122, 255, 0.12)' : 'rgba(255, 255, 255, 0.08)';
  const valueColor = isLight ? spatialLight.text : colors.text;
  const labelColor = isLight ? spatialLight.textSecondary : colors.textSecondary;
  const mutedColor = isLight ? spatialLight.textMuted : colors.textMuted;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.gradientStart} />
            <Stop offset="1" stopColor={colors.gradientEnd} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={riskRing || showRisk ? ringColor : 'url(#gaugeGrad)'}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[styles.center, { maxWidth: size * 0.62 }]}>
        <Text style={[styles.value, { fontSize: size * 0.26, color: valueColor, lineHeight: size * 0.3 }]}>
          {value}
          {suffix}
        </Text>
        {label && (
          <Text style={[styles.label, { color: labelColor, marginTop: 0 }]}>
            {label}
          </Text>
        )}
        {showRisk && (
          <Text style={[styles.risk, { color: ringColor }]}>
            {getRiskLabel(mode === 'recovery' ? 100 - value : value)} {mode === 'recovery' ? '' : 'Risk'}
          </Text>
        )}
        {sublabel && <Text style={[styles.sublabel, { color: mutedColor }]}>{sublabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
  value: {
    ...typography.h1,
    fontWeight: '700',
  },
  label: {
    ...typography.caption,
    marginTop: 2,
  },
  risk: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  sublabel: {
    ...typography.small,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 120,
  },
});
