import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { getCategoryIcon } from '@/lib/substance-icons';

type CategoryGridCardProps = {
  name: string;
  slug: string;
  count: number;
  onPress: () => void;
};

export function CategoryGridCard({ name, slug, count, onPress }: CategoryGridCardProps) {
  const { icon, color } = getCategoryIcon(slug);

  return (
    <Pressable style={styles.wrapper} onPress={onPress}>
      <LinearGradient
        colors={[`${color}28`, `${color}08`, 'rgba(20,24,36,0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={[styles.iconGlow, { shadowColor: color, backgroundColor: `${color}22` }]}>
          <Ionicons name={icon} size={26} color={color} />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.count}>
          {count} {count === 1 ? 'item' : 'items'}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '31.5%',
    marginBottom: spacing.md,
  },
  card: {
    minHeight: 118,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'space-between',
  },
  iconGlow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 17,
    minHeight: 34,
  },
  count: {
    ...typography.small,
    color: 'rgba(255,255,255,0.45)',
    marginTop: spacing.xs,
  },
});
