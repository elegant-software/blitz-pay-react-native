import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../lib/LanguageContext';
import { colors, spacing, radius, shadow } from '../lib/theme';

type NotifIcon = React.ComponentProps<typeof Ionicons>['name'];

interface Notification {
  id: string;
  icon: NotifIcon;
  iconColor: string;
  title: string;
  messageKey: string;
  timeKey: string;
  actionKey?: string;
}

const NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    icon: 'document-text-outline',
    iconColor: colors.warning,
    title: 'invoice_reminder',
    messageKey: 'invoice_reminder_msg',
    timeKey: 'two_h_ago',
    actionKey: 'view_invoice',
  },
  {
    id: '2',
    icon: 'shield-outline',
    iconColor: colors.error,
    title: 'new_login_detected',
    messageKey: 'new_login_msg',
    timeKey: 'five_h_ago',
    actionKey: 'review_security',
  },
  {
    id: '3',
    icon: 'checkmark-circle-outline',
    iconColor: colors.success,
    title: 'payment_successful',
    messageKey: 'payment_successful_msg',
    timeKey: 'yesterday',
    actionKey: 'view_receipt',
  },
  {
    id: '4',
    icon: 'warning-outline',
    iconColor: colors.warning,
    title: 'low_balance_alert',
    messageKey: 'low_balance_msg',
    timeKey: 'two_days_ago',
    actionKey: 'add_funds',
  },
];

export default function NotificationsScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = NOTIFICATIONS.filter((n) => !dismissed.includes(n.id));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notifications')}</Text>
        {visible.length > 0 ? (
          <TouchableOpacity onPress={() => setDismissed(NOTIFICATIONS.map((n) => n.id))}>
            <Text style={styles.clearAll}>{t('clear_all')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Info header */}
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>{t('updates_alerts')}</Text>
          <Text style={styles.infoSub}>{t('stay_updated')}</Text>
        </View>

        {visible.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={56} color={colors.gray300} />
            <Text style={styles.emptyTitle}>{t('all_caught_up')}</Text>
            <Text style={styles.emptyDesc}>{t('notify_important')}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>{t('recent_activity_notif')}</Text>
            {visible.map((notif) => (
              <View key={notif.id} style={styles.notifCard}>
                <View style={[styles.notifIcon, { backgroundColor: `${notif.iconColor}15` }]}>
                  <Ionicons name={notif.icon} size={20} color={notif.iconColor} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Text style={styles.notifTitle}>{t(notif.title as 'invoice_reminder')}</Text>
                    <Text style={styles.notifTime}>{t(notif.timeKey as 'two_h_ago')}</Text>
                  </View>
                  <Text style={styles.notifMessage} numberOfLines={2}>
                    {t(notif.messageKey as 'invoice_reminder_msg')}
                  </Text>
                  <View style={styles.notifActions}>
                    {notif.actionKey && (
                      <TouchableOpacity style={styles.notifActionBtn}>
                        <Text style={styles.notifActionText}>{t(notif.actionKey as 'view_invoice')}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.dismissBtn}
                      onPress={() => setDismissed((prev) => [...prev, notif.id])}
                    >
                      <Ionicons name="close" size={14} color={colors.gray500} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
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
  clearAll: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  infoHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  infoTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  infoSub: { fontSize: 13, color: colors.gray600, marginTop: 2 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray600,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    marginBottom: spacing.sm,
  },
  notifCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.sm,
    ...shadow.sm,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  notifTitle: { fontSize: 14, fontWeight: '700', color: colors.onSurface, flex: 1 },
  notifTime: { fontSize: 11, color: colors.gray500, marginLeft: 4, flexShrink: 0 },
  notifMessage: { fontSize: 13, color: colors.gray600, lineHeight: 18, marginBottom: 8 },
  notifActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifActionBtn: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  notifActionText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  dismissBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.gray600, marginTop: spacing.md },
  emptyDesc: { fontSize: 14, color: colors.gray500, textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
