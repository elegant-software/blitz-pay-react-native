import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Pdf from 'react-native-pdf';
import * as Sharing from 'expo-sharing';
import RNBlobUtil from 'react-native-blob-util';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useLanguage } from '../lib/LanguageContext';
import { colors, spacing, radius } from '../lib/theme';
import type { RootStackParamList } from '../types';

type PreviewRoute = RouteProp<RootStackParamList, 'InvoicePdfPreview'>;

export default function InvoicePdfPreviewScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute<PreviewRoute>();
  const insets = useSafeAreaInsets();
  const { localUri, invoiceNumber } = route.params;

  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Clean up temp file when the screen unmounts
  useEffect(() => {
    return () => {
      const path = localUri.replace('file://', '');
      RNBlobUtil.fs.unlink(path).catch(() => {});
    };
  }, [localUri]);

  const handleShare = useCallback(async () => {
    const available = await Sharing.isAvailableAsync();
    if (!available) return;
    setSharing(true);
    try {
      await Sharing.shareAsync(localUri, {
        mimeType: 'application/pdf',
        dialogTitle: invoiceNumber,
        UTI: 'com.adobe.pdf',
      });
    } finally {
      setSharing(false);
    }
  }, [localUri, invoiceNumber]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {invoiceNumber}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* PDF Viewer */}
      {pdfError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="document-outline" size={56} color={colors.gray400} />
          <Text style={styles.errorText}>{t('error_pdf_generation_failed')}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.pdfContainer}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          <Pdf
            source={{ uri: localUri, cache: false }}
            style={styles.pdf}
            onLoadComplete={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setPdfError(true);
            }}
            enablePaging={false}
            trustAllCerts={false}
          />
        </View>
      )}

      {/* Share Button */}
      {!pdfError && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.shareBtn, sharing && styles.shareBtnDisabled]}
            onPress={handleShare}
            disabled={sharing || loading}
            activeOpacity={0.85}
          >
            {sharing ? (
              <ActivityIndicator color={colors.black} size="small" />
            ) : (
              <>
                <Ionicons name="share-outline" size={18} color={colors.black} />
                <Text style={styles.shareBtnText}>{t('share_invoice')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onSurface,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  pdfContainer: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  pdf: { flex: 1, width: '100%' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    fontSize: 15,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 22,
  },
  backBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  backBtnText: { fontSize: 15, fontWeight: '700', color: colors.black },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  shareBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  shareBtnDisabled: { opacity: 0.5 },
  shareBtnText: { fontSize: 16, fontWeight: '700', color: colors.black },
});
