import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/constants/theme';

const BARCODE_TYPES = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'code93',
  'qr',
] as const;

export default function BarcodeScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const locked = useRef(false);

  const openManual = () => {
    router.replace('/product-lookup' as never);
  };

  const handleBarcode = useCallback(
    (result: BarcodeScanningResult) => {
      if (locked.current) return;
      const code = result.data?.trim();
      if (!code) return;

      locked.current = true;
      setScannedCode(code);
      router.replace({
        pathname: '/product-lookup',
        params: { barcode: code },
      } as never);
    },
    [router]
  );

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="barcode-outline" size={48} color={colors.textMuted} />
        <Text style={styles.title}>Camera scan is available on iOS & Android</Text>
        <Text style={styles.body}>
          On web, enter the barcode manually or open Product lookup.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={openManual}>
          <Text style={styles.primaryBtnText}>Enter barcode manually</Text>
        </Pressable>
        <Pressable style={styles.ghostBtn} onPress={() => router.back()}>
          <Text style={styles.ghostBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.body}>
          Dosify needs the camera to scan package barcodes for product lookup.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => void requestPermission()}>
          <Text style={styles.primaryBtnText}>Allow camera</Text>
        </Pressable>
        <Pressable style={styles.ghostBtn} onPress={openManual}>
          <Text style={styles.ghostBtnText}>Enter code manually instead</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
        onBarcodeScanned={scannedCode ? undefined : handleBarcode}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          accessibilityLabel="Close scanner"
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.topTitle}>Scan barcode</Text>
        <Pressable
          onPress={() => setTorch((v) => !v)}
          style={styles.iconBtn}
          accessibilityLabel={torch ? 'Turn torch off' : 'Turn torch on'}
        >
          <Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <Text style={styles.hint}>
          {scannedCode ? `Found ${scannedCode}` : 'Align the barcode inside the frame'}
        </Text>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Pressable style={styles.manualBtn} onPress={openManual}>
          <Ionicons name="keypad-outline" size={18} color="#FFFFFF" />
          <Text style={styles.manualBtnText}>Enter code manually</Text>
        </Pressable>
      </View>
    </View>
  );
}

const FRAME = 260;
const CORNER = 28;
const STROKE = 3;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  primaryBtnText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  ghostBtn: {
    paddingVertical: spacing.md,
  },
  ghostBtnText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
  topTitle: {
    ...typography.h3,
    color: '#FFFFFF',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: FRAME,
    height: FRAME * 0.55,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#FFFFFF',
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: STROKE,
    borderLeftWidth: STROKE,
    borderTopLeftRadius: 8,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: STROKE,
    borderRightWidth: STROKE,
    borderTopRightRadius: 8,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: STROKE,
    borderLeftWidth: STROKE,
    borderBottomLeftRadius: 8,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: STROKE,
    borderRightWidth: STROKE,
    borderBottomRightRadius: 8,
  },
  hint: {
    ...typography.caption,
    color: '#FFFFFF',
    marginTop: spacing.xl,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingTop: spacing.lg,
    zIndex: 2,
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  manualBtnText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
