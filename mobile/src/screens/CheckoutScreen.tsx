import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../lib/LanguageContext';
import { colors, spacing, radius, shadow } from '../lib/theme';
import type { RootStackNav, RootStackParamList } from '../types';
import { useAuth } from '../lib/auth';
import {
  buildTrueLayerRedirectUri,
  clearActiveTrueLayerPayment,
  consumePendingTrueLayerReturnUrl,
  createTrueLayerPayment,
  getActiveTrueLayerPayment,
  isTrueLayerRedirectUrl,
  saveActiveTrueLayerPayment,
  type TrueLayerPaymentContext,
} from '../lib/truelayer';

type PaymentMethod = 'bank' | 'card' | 'paypal';

type ProcessorResultLike = {
  type?: string;
  step?: string;
  reason?: string;
  failure?: string;
  status?: string;
};

type TrueLayerSdkModule = {
  TrueLayerPaymentsSDKWrapper: {
    configure: (environment: unknown) => Promise<void>;
    processPayment: (
      context: {
        paymentId: string;
        resourceToken: string;
        redirectUri: string;
      },
      preferences?: {
        shouldPresentResultScreen?: boolean;
        preferredCountryCode?: string;
      },
    ) => Promise<ProcessorResultLike>;
    paymentStatus: (context: {
      paymentId: string;
      resourceToken: string;
    }) => Promise<ProcessorResultLike>;
  };
  Environment: {
    Sandbox: unknown;
    Production: unknown;
  };
  ResultType: {
    Success: string;
    Failure: string;
  };
};

const trueLayerSdk: TrueLayerSdkModule | null = Platform.OS === 'web'
  ? null
  : require('rn-truelayer-payments-sdk') as TrueLayerSdkModule;

let configuredSdkEnvironment: 'sandbox' | 'production' | null = null;

async function configureTrueLayerSdk(environment: 'sandbox' | 'production'): Promise<void> {
  if (!trueLayerSdk) {
    throw new Error('TrueLayer payments are not available on this platform.');
  }

  if (configuredSdkEnvironment === environment) {
    return;
  }

  const targetEnvironment = environment === 'production'
    ? trueLayerSdk.Environment.Production
    : trueLayerSdk.Environment.Sandbox;

  await trueLayerSdk.TrueLayerPaymentsSDKWrapper.configure(targetEnvironment);
  configuredSdkEnvironment = environment;
}

export default function CheckoutScreen() {
  const { t } = useLanguage();
  const { token } = useAuth();
  const navigation = useNavigation<RootStackNav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Checkout'>>();
  const insets = useSafeAreaInsets();

  const amount = route.params?.amount ?? 24.5;
  const merchantName = route.params?.merchantName ?? 'Merchant';
  const invoiceId = route.params?.invoiceId;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('bank');
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activePaymentRef = useRef<TrueLayerPaymentContext | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const resumeFromPendingRedirect = async () => {
      const pendingRedirectUrl = await consumePendingTrueLayerReturnUrl();
      if (pendingRedirectUrl && isTrueLayerRedirectUrl(pendingRedirectUrl)) {
        await resumeTrueLayerPayment(pendingRedirectUrl);
      }
    };

    void resumeFromPendingRedirect();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (isTrueLayerRedirectUrl(url)) {
        void resumeTrueLayerPayment(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const methods = [
    {
      key: 'bank' as PaymentMethod,
      icon: 'business-outline',
      label: t('pay_with_truelayer'),
      sub: t('instant_bank_payment'),
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

  const setFailureState = (message: string) => {
    if (!isMountedRef.current) return;
    setProcessing(false);
    setStatusMessage(null);
    setErrorMessage(message);
  };

  const completeSuccess = async () => {
    await clearActiveTrueLayerPayment();
    activePaymentRef.current = null;

    if (!isMountedRef.current) return;

    setProcessing(false);
    setStatusMessage(null);
    setErrorMessage(null);
    setShowSuccess(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const extractFailureMessage = (result: ProcessorResultLike | null | undefined): string => {
    const reason = String(result?.reason ?? result?.failure ?? '').trim();

    if (reason === 'UserAborted' || reason === 'UserCanceledAtProvider') {
      return t('truelayer_cancelled');
    }

    if (!reason) {
      return t('truelayer_failed');
    }

    return `${t('truelayer_failed')} (${reason})`;
  };

  const settleTrueLayerPayment = async (context: TrueLayerPaymentContext): Promise<void> => {
    if (!trueLayerSdk) {
      throw new Error(t('truelayer_unavailable'));
    }

    const statusResult = await trueLayerSdk.TrueLayerPaymentsSDKWrapper.paymentStatus({
      paymentId: context.paymentId,
      resourceToken: context.resourceToken,
    }).catch(() => null);

    const successType = trueLayerSdk.ResultType.Success;
    const paymentStatus = String(statusResult?.status ?? '');

    if (
      statusResult?.type === successType
      && ['Authorized', 'Executed', 'Settled'].includes(paymentStatus)
    ) {
      await completeSuccess();
      return;
    }

    if (paymentStatus === 'Failed') {
      await clearActiveTrueLayerPayment();
      activePaymentRef.current = null;
      setFailureState(extractFailureMessage(statusResult));
      return;
    }

    await completeSuccess();
  };

  const processTrueLayerContext = async (context: TrueLayerPaymentContext): Promise<void> => {
    if (!trueLayerSdk) {
      throw new Error(t('truelayer_unavailable'));
    }

    await configureTrueLayerSdk(context.environment);

    const result = await trueLayerSdk.TrueLayerPaymentsSDKWrapper.processPayment(
      {
        paymentId: context.paymentId,
        resourceToken: context.resourceToken,
        redirectUri: context.redirectUri,
      },
      {
        shouldPresentResultScreen: true,
        ...(context.preferredCountryCode ? { preferredCountryCode: context.preferredCountryCode } : {}),
      },
    );

    if (result.type === trueLayerSdk.ResultType.Failure) {
      await clearActiveTrueLayerPayment();
      activePaymentRef.current = null;
      setFailureState(extractFailureMessage(result));
      return;
    }

    const step = String(result.step ?? '');

    if (step === 'Redirect' || step === 'Wait') {
      if (isMountedRef.current) {
        setStatusMessage(t('truelayer_continue_bank'));
      }
      return;
    }

    await settleTrueLayerPayment(context);
  };

  async function resumeTrueLayerPayment(url: string): Promise<void> {
    if (!isTrueLayerRedirectUrl(url)) {
      return;
    }

    const activePayment = activePaymentRef.current ?? await getActiveTrueLayerPayment();
    if (!activePayment) {
      return;
    }

    activePaymentRef.current = activePayment;

    if (isMountedRef.current) {
      setProcessing(true);
      setErrorMessage(null);
      setStatusMessage(t('truelayer_resuming'));
    }

    try {
      await processTrueLayerContext(activePayment);
    } catch (error) {
      await clearActiveTrueLayerPayment();
      activePaymentRef.current = null;
      setFailureState(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t('truelayer_failed'),
      );
    }
  }

  const handlePrototypePayment = async () => {
    setProcessing(true);
    setErrorMessage(null);
    setStatusMessage(null);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      if (!isMountedRef.current) return;
      setProcessing(false);
      setShowSuccess(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1200);
  };

  const handleTrueLayerPayment = async () => {
    if (!trueLayerSdk) {
      setFailureState(t('truelayer_unavailable'));
      return;
    }

    setProcessing(true);
    setErrorMessage(null);
    setStatusMessage(t('truelayer_preparing'));

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const paymentContext = await createTrueLayerPayment({
        accessToken: token,
        amount,
        merchantName,
        invoiceId,
        redirectUri: buildTrueLayerRedirectUri(),
      });

      activePaymentRef.current = paymentContext;
      await saveActiveTrueLayerPayment(paymentContext);
      await processTrueLayerContext(paymentContext);
    } catch (error) {
      await clearActiveTrueLayerPayment();
      activePaymentRef.current = null;
      setFailureState(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t('truelayer_failed'),
      );
    }
  };

  const handleConfirm = async () => {
    if (processing) {
      return;
    }

    if (selectedMethod === 'bank') {
      await handleTrueLayerPayment();
      return;
    }

    await handlePrototypePayment();
  };

  const handleContinue = () => {
    setShowSuccess(false);
    navigation.navigate('Main');
  };

  return (
    <View style={styles.container}>
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
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{t('total_due')}</Text>
          <Text style={styles.amountValue}>€{amount.toFixed(2)}</Text>
          <Text style={styles.amountMerchant}>{merchantName}</Text>
        </View>

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

        {(errorMessage || statusMessage) && (
          <View style={[styles.messageCard, errorMessage ? styles.errorCard : styles.infoCard]}>
            <Ionicons
              name={errorMessage ? 'alert-circle-outline' : 'information-circle-outline'}
              size={18}
              color={errorMessage ? colors.error : colors.primary}
            />
            <Text style={[styles.messageText, errorMessage ? styles.errorText : styles.infoText]}>
              {errorMessage ?? statusMessage}
            </Text>
          </View>
        )}

        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
          <View style={styles.securityTextBox}>
            <Text style={styles.securityTitle}>{t('encrypted_transaction')}</Text>
            <Text style={styles.securityDesc}>{t('secure_msg')}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.authorizedBy}>{t('authorized_by')}</Text>
        <TouchableOpacity
          style={[styles.confirmBtn, processing && styles.confirmBtnDisabled]}
          onPress={() => {
            void handleConfirm();
          }}
          disabled={processing}
          activeOpacity={0.85}
        >
          {processing ? (
            <ActivityIndicator color={colors.black} size="small" />
          ) : (
            <>
              <Ionicons name="flash" size={18} color={colors.black} />
              <Text style={styles.confirmBtnText}>
                {selectedMethod === 'bank' ? t('pay_with_truelayer') : t('confirm_payment')} · €{amount.toFixed(2)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>{t('payment_successful')}</Text>
            <Text style={styles.successDesc}>{t('reward_msg')}</Text>
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
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodIconSelected: {
    backgroundColor: `${colors.primary}15`,
  },
  methodInfo: { flex: 1 },
  methodLabel: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  methodLabelSelected: { color: colors.primary },
  methodSub: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  messageCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  infoCard: {
    backgroundColor: `${colors.primary}10`,
    borderColor: `${colors.primary}20`,
  },
  errorCard: {
    backgroundColor: `${colors.error}10`,
    borderColor: `${colors.error}20`,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  infoText: { color: colors.onSurface },
  errorText: { color: colors.error },
  securityNote: {
    marginHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: `${colors.success}08`,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.success}18`,
  },
  securityTextBox: { flex: 1 },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 2,
  },
  securityDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.gray600,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  authorizedBy: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...shadow.md,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.black,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  successCard: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  successIcon: { marginBottom: spacing.md },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray600,
    textAlign: 'center',
  },
  pointsBadge: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: `${colors.primary}14`,
    borderRadius: radius.full,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  continueBtn: {
    width: '100%',
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.onSurface,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});
