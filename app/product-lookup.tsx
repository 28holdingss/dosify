import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { GradientButton } from '@/components/ui/GradientButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useProductSearch } from '@/hooks/useApi';
import { api, ApiError } from '@/lib/api';
import { getSubstanceIcon } from '@/lib/substance-icons';
import type { Product, Substance } from '@/types/api';

export default function ProductLookupScreen() {
  const router = useRouter();
  const { barcode: barcodeParam } = useLocalSearchParams<{ barcode?: string }>();
  const [barcode, setBarcode] = useState(barcodeParam?.trim() ?? '');
  const [query, setQuery] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const autoLookupDone = useRef(false);

  const { data: search, loading: searching } = useProductSearch(query, query.trim().length >= 2);

  const handleBarcodeLookup = async (codeOverride?: string) => {
    const code = (codeOverride ?? barcode).trim();
    if (!code) {
      Alert.alert('Enter a barcode', 'Type the UPC/EAN from the package, or scan it with the camera.');
      return;
    }
    setBarcode(code);
    setLookupBusy(true);
    setLookupError(null);
    setProduct(null);
    try {
      const result = await api.getProductByBarcode(code);
      setProduct(result);
      if (!result.substanceId && result.name) {
        const hint =
          result.brand?.split(/[\s,]/)[0] ||
          result.name.split(/\s+/).find((w) => w.length > 3) ||
          result.name;
        if (hint && query.trim().length < 2) setQuery(hint);
      }
    } catch (e) {
      if (e instanceof ApiError && (e.needsManualEntry || e.status === 404)) {
        setLookupError(
          e.message ||
            'No product found for that barcode online. Try searching by medication name below.'
        );
      } else {
        setLookupError(e instanceof Error ? e.message : 'Lookup failed');
      }
    } finally {
      setLookupBusy(false);
    }
  };

  useEffect(() => {
    const code = barcodeParam?.trim();
    if (!code || autoLookupDone.current) return;
    autoLookupDone.current = true;
    void handleBarcodeLookup(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot from scan route
  }, [barcodeParam]);

  const openCabinet = (substanceId: string, displayName?: string | null) => {
    router.push({
      pathname: '/cabinet-edit',
      params: {
        substanceId,
        ...(displayName ? { displayName } : {}),
      },
    } as never);
  };

  /** Public hit without a library link — still let them add with name prefilled. */
  const openCabinetFromProduct = (item: Product) => {
    if (item.substanceId) {
      openCabinet(item.substanceId, item.name);
      return;
    }
    router.push({
      pathname: '/cabinet-edit',
      params: { displayName: item.name },
    } as never);
  };

  const openMedicineInfo = (substanceId: string) => {
    router.push({ pathname: '/medicine-info', params: { substanceId } } as never);
  };

  const isPublic = (item: Product) =>
    item.catalogSource === 'public' || Boolean(item.externalId);

  const renderProduct = (item: Product) => (
    <Card key={item.id} style={styles.resultCard}>
      <View style={styles.titleRow}>
        <Text style={[styles.resultTitle, styles.flex]}>{item.name}</Text>
        {isPublic(item) ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Public</Text>
          </View>
        ) : null}
      </View>
      {(item.brand || item.dosageForm) && (
        <Text style={styles.resultMeta}>
          {[item.brand, item.dosageForm].filter(Boolean).join(' · ')}
        </Text>
      )}
      {item.description ? <Text style={styles.resultBody}>{item.description}</Text> : null}
      {item.substance ? (
        <Text style={styles.linked}>
          Matched in Dosify library: {item.substance.name}
        </Text>
      ) : null}
      <View style={styles.actions}>
        {item.substanceId ? (
          <>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => openMedicineInfo(item.substanceId!)}
            >
              <Text style={styles.secondaryBtnText}>Medicine info</Text>
            </Pressable>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => openCabinetFromProduct(item)}
            >
              <Text style={styles.primaryBtnText}>Save to Cabinet</Text>
            </Pressable>
          </>
        ) : (
          <View style={{ gap: spacing.sm, flex: 1 }}>
            <Text style={styles.hint}>
              Found online. Pick the closest substance in your library when you save it to the
              cabinet.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={() => openCabinetFromProduct(item)}>
              <Text style={styles.primaryBtnText}>Add to Cabinet</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Card>
  );

  const renderSubstance = (s: Substance) => {
    const icon = getSubstanceIcon(s.name, s.category?.slug);
    return (
      <Pressable
        key={s.id}
        style={styles.substanceRow}
        onPress={() => openMedicineInfo(s.id)}
      >
        <View style={[styles.icon, { backgroundColor: `${icon.color}22` }]}>
          <Ionicons name={icon.icon} size={20} color={icon.color} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.resultTitle}>{s.name}</Text>
          <Text style={styles.resultMeta}>{s.category?.name ?? 'Substance'}</Text>
        </View>
        <Pressable onPress={() => openCabinet(s.id, s.name)} hitSlop={8}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <Screen>
      <ScreenHeader title="Find medication" showBack onBack={() => router.back()} />

      <Text style={styles.intro}>
        Search public medication catalogs online by barcode or name. If Dosify already knows the
        substance, we’ll link it so you can add it to your cabinet.
      </Text>

      <Pressable
        style={styles.scanBanner}
        onPress={() => router.push('/barcode-scan' as never)}
      >
        <View style={styles.scanBannerIcon}>
          <Ionicons name="barcode-outline" size={22} color="#FFFFFF" />
        </View>
        <View style={styles.scanBannerCopy}>
          <Text style={styles.scanBannerTitle}>Scan package barcode</Text>
          <Text style={styles.scanBannerSub}>Looks up UPC / EAN in public product catalogs</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Text style={styles.label}>Barcode</Text>
      <TextInput
        style={styles.input}
        value={barcode}
        onChangeText={setBarcode}
        placeholder="UPC / EAN code"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        autoCapitalize="none"
      />
      <GradientButton
        title={lookupBusy ? 'Searching catalogs…' : 'Look up barcode'}
        onPress={() => void handleBarcodeLookup()}
        style={{ marginBottom: spacing.lg }}
      />

      {lookupError && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{lookupError}</Text>
        </Card>
      )}

      {product && (
        <>
          <Text style={styles.label}>Barcode match</Text>
          {renderProduct(product)}
        </>
      )}

      <Text style={styles.label}>Search by name</Text>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Advil, ibuprofen, Vitamin D…"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />

      {searching && (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
      )}

      {search && search.products.length > 0 && (
        <>
          <Text style={styles.section}>Products</Text>
          <Text style={styles.sectionHint}>
            Public catalogs (openFDA, Open Food Facts) plus any saved Dosify products
          </Text>
          {search.products.map(renderProduct)}
        </>
      )}

      {search && search.substances.length > 0 && (
        <>
          <Text style={styles.section}>Dosify library</Text>
          <Text style={styles.sectionHint}>
            Substances already in Dosify — fastest path to cabinet + medicine info
          </Text>
          <Card>{search.substances.map(renderSubstance)}</Card>
        </>
      )}

      {query.trim().length >= 2 &&
        !searching &&
        search &&
        search.products.length === 0 &&
        search.substances.length === 0 && (
          <Text style={styles.hint}>No matches online or in the library. Try another spelling.</Text>
        )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  scanBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBannerCopy: { flex: 1 },
  scanBannerTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  scanBannerSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  section: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  errorCard: {
    borderColor: colors.warning,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.warning,
  },
  resultCard: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: `${colors.primary}22`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  resultTitle: {
    ...typography.h3,
    color: colors.text,
  },
  resultMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  resultBody: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  linked: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  primaryBtnText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  secondaryBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  substanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
