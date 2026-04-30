import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useLanguage } from '../lib/LanguageContext';
import { colors, spacing, radius, shadow } from '../lib/theme';
import type { RootStackParamList, OrderStatus } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'OrderDetail'>;

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: colors.warning,
  processing: colors.primary,
  completed: colors.success,
  cancelled: colors.error,
  refunded: colors.gray500,
};

function formatCurrency(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
}

export default function OrderDetailScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { orderId, orderNumber, amount, currency, customerName, status: initialStatus } = route.params;

  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'complete' | 'cancel' | null>(null);

  const handleAction = (action: 'complete' | 'cancel') => {
    setPendingAction(action);
    setShowConfirmModal(true);
  };

  const confirmAction = () => {
    if (pendingAction === 'complete') setStatus('completed');
    else if (pendingAction === 'cancel') setStatus('cancelled');
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('order_detail')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Order summary card */}
        <View style={[styles.summaryCard, shadow.md]}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.orderNum}>{t('order_number')}{orderNumber}</Text>
              <Text style={styles.orderId}>ID: {orderId}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLORS[status]}15` }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[status] }]}>
                {t(`status_${status}` as Parameters<typeof t>[0])}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('customer')}</Text>
            <Text style={styles.detailValue}>{customerName ?? '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('order_total')}</Text>
            <Text style={[styles.detailValue, styles.amountText]}>
              {formatCurrency(amount, currency)}
            </Text>
          </View>
        </View>

        {/* Items placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('order_items')}</Text>
          <View style={[styles.emptyItems, shadow.sm]}>
            <Ionicons name="cube-outline" size={32} color={colors.gray300} />
            <Text style={styles.emptyItemsText}>Item details loaded from API</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action buttons */}
      {(status === 'pending' || status === 'processing') && (
        <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => handleAction('cancel')}
            activeOpacity={0.85}
          >
            <Text style={styles.cancelBtnText}>{t('cancel_order')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => handleAction('complete')}
            activeOpacity={0.85}
          >
            <Text style={styles.completeBtnText}>{t('mark_completed')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Confirm modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('confirm')}</Text>
            <Text style={styles.modalDesc}>
              {pendingAction === 'complete' ? t('mark_completed') : t('cancel_order')}?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, pendingAction === 'cancel' && styles.modalConfirmDanger]}
                onPress={confirmAction}
              >
                <Text style={styles.modalConfirmText}>{t('confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray200,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.onSurface },
  summaryCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    margin: spacing.md, padding: spacing.lg,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNum: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  orderId: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  statusPill: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.gray200, marginVertical: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  detailLabel: { fontSize: 14, color: colors.gray600 },
  detailValue: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  amountText: { fontSize: 18, fontWeight: '800' },
  section: { paddingHorizontal: spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.onSurface, marginBottom: spacing.sm },
  emptyItems: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.xl, alignItems: 'center', gap: spacing.sm,
  },
  emptyItemsText: { fontSize: 13, color: colors.gray500 },
  actions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingTop: spacing.md,
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray200,
  },
  cancelBtn: {
    flex: 1, padding: spacing.md, borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.error, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.error },
  completeBtn: {
    flex: 2, padding: spacing.md, borderRadius: radius.full,
    backgroundColor: colors.success, alignItems: 'center',
  },
  completeBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
  modalOverlay: {
    flex: 1, backgroundColor: colors.overlayDark,
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.white, borderRadius: radius.xxl,
    padding: spacing.xl, width: '100%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginBottom: 8 },
  modalDesc: { fontSize: 14, color: colors.gray600, marginBottom: spacing.lg },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalCancel: {
    flex: 1, padding: spacing.md, borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.gray300, alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  modalConfirm: {
    flex: 1, padding: spacing.md, borderRadius: radius.full,
    backgroundColor: colors.success, alignItems: 'center',
  },
  modalConfirmDanger: { backgroundColor: colors.error },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: colors.white },
});