import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../lib/LanguageContext';
import { colors, spacing, radius, shadow } from '../lib/theme';
import type { RootStackNav, RootStackParamList } from '../types';

type PaymentMethod = 'bank' | 'card' | 'paypal';

export default function CheckoutScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation<RootStackNav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Checkout'>>();
  const insets = useSafeAreaInsets();

  const amount = route.params?.amount ?? 24.5;
  const merchantName = route.params?.merchantName ?? 'Merchant';

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('bank');
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConfirm = async () => {
    setProcessing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Simulate processing delay
    setTimeout(() => {
      setProcessing(false);
      setShowSuccess(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1800);
  };

  const handleContinue = () => {
    setShowSuccess(false);
    navigation.navigate('Main');
  };

  const methods = [
    {
      key: 'bank' as PaymentMethod,
      icon: 'business-outline',
      label: t('bank_account_direct'),
      sub: t('ach_transfer'),
    },
    {
      key: 'card' as PaymentMethod,
      icon: 'card-outline',
      label: t('credit_debit_card'),
      sub: t('visa_mastercard'),
    },
    {
      key: 'paypal' as PaymentMethod,
      icon: 'logo-paypal',
      label: t('paypal'),
      sub: t('express_checkout'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('secure_checkout')}</Text>
        <View style={styles.secureIcon}>
          <Ionicons name="lock-closed" size={14} color={colors.success} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Amount summary */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{t('total_due')}</Text>
          <Text style={styles.amountValue}>€{amount.toFixed(2)}</Text>
          <Text style={styles.amountMerchant}>{merchantName}</Text>
        </View>

        {/* Payment methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('payment_method')}</Text>
          {methods.map((method) => (
            <TouchableOpacity
              key={method.key}
              style={[styles.methodRow, selectedMethod === method.key && styles.methodRowSelected]}
              onPress={() => setSelectedMethod(method.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.methodIcon, selectedMethod === method.key && styles.methodIconSelected]}>
                <Ionicons
                  name={method.icon as React.ComponentProps<typeof Ionicons>['name']}
                  size={20}
                  color={selectedMethod === method.key ? colors.primary : colors.gray600}
                />
              </View>
              <View style={styles.methodInfo}>
                <Text style={[styles.methodLabel, selectedMethod === method.key && styles.methodLabelSelected]}>
                  {method.label}
                </Text>
                <Text style={styles.methodSub}>{method.sub}</Text>
              </View>
              <View style={[styles.radio, selectedMethod === method.key && styles.radioSelected]}>
                {selectedMethod === method.key && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Security note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
          <View style={styles.securityTextBox}>
            <Text style={styles.securityTitle}>{t('encrypted_transaction')}</Text>
            <Text style={styles.securityDesc}>{t('secure_msg')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.authorizedBy}>{t('authorized_by')}</Text>
        <TouchableOpacity
          style={[styles.confirmBtn, processing && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={processing}
          activeOpacity={0.85}
        >
          {processing ? (
            <ActivityIndicator color={colors.black} size="small" />
          ) : (
            <>
              <Ionicons name="flash" size={18} color={colors.black} />
              <Text style={styles.confirmBtnText}>{t('confirm_payment')} · €{amount.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Success modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>{t('payment_successful')}</Text>
            <Text style={styles.successDesc}>
              {t('reward_msg')}
            </Text>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{t('points_earned', { amount: '250' })}</Text>
            </View>
            <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
              <Text style={styles.continueBtnText}>{t('continue_to_vault')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.onSurface },
  secureIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.success}15`,
    borderRadius: radius.full,
    padding: 6,
  },
  amountCard: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.onSurface,
    alignItems: 'center',
  },
  amountLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  amountValue: { fontSize: 40, fontWeight: '800', color: colors.white, letterSpacing: -1 },
  amountMerchant: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.onSurface, marginBottom: spacing.sm },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    marginBottom: 8,
    gap: spacing.sm,
  },
  methodRowSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodIconSelected: {
    backgroundColor: `${colors.primary}15`,
  },
  methodInfo: { flex: 1 },
  methodLabel: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  methodLabelSelected: { color: colors.primary },
  methodSub: { fontSize: 12, color: colors.gray600, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  securityNote: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    backgroundColor: `${colors.success}08`,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.success}20`,
  },
  securityTextBox: { flex: 1 },
  securityTitle: { fontSize: 13, fontWeight: '600', color: colors.onSurface, marginBottom: 2 },
  securityDesc: { fontSize: 12, color: colors.gray600, lineHeight: 16 },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  authorizedBy: {
    fontSize: 11,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmBtnDisabled: { opacity: 0.7 },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: colors.black },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  successCard: {
    backgroundColor: colors.background,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  successIcon: { marginBottom: spacing.md },
  successTitle: { fontSize: 22, fontWeight: '800', color: colors.onSurface, marginBottom: 8 },
  successDesc: { fontSize: 14, color: colors.gray600, textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },
  pointsBadge: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginBottom: spacing.lg,
  },
  pointsText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  continueBtn: {
    backgroundColor: colors.onSurface,
    borderRadius: radius.full,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  continueBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
});
