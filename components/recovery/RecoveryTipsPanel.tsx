import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { spacing, typography } from '@/constants/theme';

type SystemKey = 'cognitive' | 'cardiovascular' | 'liver' | 'kidney' | 'respiratory' | 'sleep';

type RecoveryTipsPanelProps = {
  cognitivePct: number;
  cardiovascularPct: number;
  liverPct: number;
  kidneyPct?: number;
  respiratoryPct?: number;
  sleepPct: number;
  substanceName?: string | null;
  drugClass?: string | null;
  categorySlug?: string | null;
};

function weakestSystem(props: RecoveryTipsPanelProps): SystemKey {
  const entries: [SystemKey, number][] = [
    ['cognitive', props.cognitivePct],
    ['cardiovascular', props.cardiovascularPct],
    ['liver', props.liverPct],
    ['kidney', props.kidneyPct ?? 70],
    ['respiratory', props.respiratoryPct ?? 70],
    ['sleep', props.sleepPct],
  ];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}

function buildTip(props: RecoveryTipsPanelProps): {
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  kicker: string;
} {
  const weakest = weakestSystem(props);
  const name = props.substanceName ?? 'your recent intake';
  const cls = (props.drugClass ?? '').toUpperCase();

  if (cls.includes('NSAID') || ['Ibuprofen', 'Aspirin', 'Naproxen'].includes(props.substanceName ?? '')) {
    return {
      kicker: `After ${name}`,
      title: 'Protect your stomach',
      body: 'Avoid alcohol today and take meals with water — NSAIDs can irritate the GI tract while active.',
      icon: 'medical-outline',
    };
  }
  if (cls.includes('OPIOID') || props.substanceName === 'Heroin' || props.substanceName === 'Kratom') {
    return {
      kicker: `After ${name}`,
      title: 'Watch for sedation',
      body: 'Rest and avoid other depressants. Seek help if breathing feels slow or unusually heavy.',
      icon: 'medical-outline',
    };
  }
  if (
    cls.includes('STIMULANT') ||
    cls.includes('EMPATHOGEN') ||
    cls.includes('CATHINONE') ||
    props.categorySlug === 'stimulants'
  ) {
    return {
      kicker: `After ${name}`,
      title: 'Ease off stimulants',
      body: 'Rehydrate, eat something balanced, and skip caffeine or more stimulants for several hours.',
      icon: 'flash-outline',
    };
  }
  if (cls.includes('PSYCHEDELIC') || props.categorySlug === 'psychedelics') {
    return {
      kicker: `After ${name}`,
      title: 'Keep it calm',
      body: 'Low stimulation, hydration, and rest help integration. Avoid driving until fully baseline.',
      icon: 'leaf-outline',
    };
  }
  if (cls.includes('CANNABINOID') || props.categorySlug === 'cannabis') {
    return {
      kicker: `After ${name}`,
      title: 'Effects may linger',
      body: 'Avoid driving and give yourself time before redosing — especially if you took an edible.',
      icon: 'leaf-outline',
    };
  }
  if (
    cls.includes('DEPRESSANT') ||
    cls.includes('BENZODIAZEPINE') ||
    props.categorySlug === 'alcohol' ||
    props.categorySlug === 'sedatives'
  ) {
    return {
      kicker: `After ${name}`,
      title: 'Let it wear off safely',
      body: 'Do not mix with alcohol or other sedatives. Rest and hydrate until you feel fully clear.',
      icon: 'moon-outline',
    };
  }

  const bySystem: Record<SystemKey, { title: string; body: string; icon: keyof typeof Ionicons.glyphMap }> = {
    cognitive: {
      title: 'Rest your mind',
      body: `After ${name}, avoid stacking stimulants or psychedelics. Prioritize sleep and hydration.`,
      icon: 'bulb-outline',
    },
    cardiovascular: {
      title: 'Ease cardiac strain',
      body: `Skip intense exercise while recovering from ${name}. Monitor heart rate if you use a watch.`,
      icon: 'heart-outline',
    },
    liver: {
      title: 'Support liver recovery',
      body: `Avoid alcohol and acetaminophen after ${name}. Drink water and eat light meals.`,
      icon: 'water-outline',
    },
    kidney: {
      title: 'Support kidney recovery',
      body: `Hydrate steadily after ${name} and avoid stacking other renal stressors like NSAIDs if possible.`,
      icon: 'ellipse-outline',
    },
    respiratory: {
      title: 'Protect breathing',
      body: `Avoid alcohol and other sedatives after ${name}. Rest if breathing feels heavy.`,
      icon: 'cloud-outline',
    },
    sleep: {
      title: 'Protect sleep tonight',
      body: `Cut caffeine early after ${name}. Dim screens and wind down on a consistent schedule.`,
      icon: 'moon-outline',
    },
  };

  const tip = bySystem[weakest];
  return { kicker: `After ${name}`, ...tip };
}

export function RecoveryTipsPanel(props: RecoveryTipsPanelProps) {
  const theme = useSpatialTheme();
  const tip = buildTip(props);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
        iconWrap: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${theme.accent}18`,
          alignItems: 'center',
          justifyContent: 'center',
        },
        copy: {
          flex: 1,
          gap: 4,
        },
        kicker: {
          ...typography.small,
          color: theme.accent,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        },
        title: {
          ...typography.body,
          color: theme.text,
          fontWeight: '600',
        },
        body: {
          ...typography.caption,
          color: theme.textSecondary,
          lineHeight: 20,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={tip.icon} size={18} color={theme.accent} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.kicker}>{tip.kicker}</Text>
        <Text style={styles.title}>{tip.title}</Text>
        <Text style={styles.body}>{tip.body}</Text>
      </View>
    </View>
  );
}
