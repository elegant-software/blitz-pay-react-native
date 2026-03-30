import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../lib/LanguageContext';
import { colors, spacing, radius, shadow } from '../lib/theme';

type Step = 'recipients' | 'items' | 'sent';

const CONTACTS = [
  { id: '1', name: 'Anna Schmidt', email: 'anna@example.com' },
  { id: '2', name: 'Luca Müller', email: 'luca@example.com' },
  { id: '3', name: 'Sophie Weber', email: 'sophie@example.com' },
  { id: '4', name: 'Team Berlin', email: 'team@berlin.example.com', isGroup: true, count: 5 },
];

interface InvoiceItem {
  id: string;
  desc: string;
  amount: string;
}

export default function SendInvoiceScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('recipients');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', desc: '', amount: '' }]);
  const [sending, setSending] = useState(false);

  const toggleContact = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { id: Date.now().toString(), desc: '', amount: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: 'desc' | 'amount', value: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setStep('sent');
    }, 1500);
  };

  if (step === 'sent') {
    return (
      <View style={[styles.container, styles.centeredContainer, { paddingTop: insets.top }]}>
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>{t('invoice_sent')}</Text>
          <Text style={styles.successDesc}>
            {t('invoice_sent_msg', { amount: `€${total.toFixed(2)}`, count: selectedIds.length })}
          </Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step === 'items' ? setStep('recipients') : navigation.goBack())} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('send_invoice')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, styles.stepDotActive]} />
        <View style={[styles.stepLine, step === 'items' && styles.stepLineActive]} />
        <View style={[styles.stepDot, step === 'items' && styles.stepDotActive]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {step === 'recipients' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t('select_recipients')}</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_contacts')}
              placeholderTextColor={colors.gray500}
            />
            <Text style={styles.subLabel}>{t('contacts')}</Text>
            {CONTACTS.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={[styles.contactRow, selectedIds.includes(contact.id) && styles.contactRowSelected]}
                onPress={() => toggleContact(contact.id)}
                activeOpacity={0.85}
              >
                <View style={styles.contactIcon}>
                  <Ionicons
                    name={contact.isGroup ? 'people-outline' : 'person-outline'}
                    size={18}
                    color={selectedIds.includes(contact.id) ? colors.primary : colors.gray600}
                  />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactEmail}>
                    {contact.isGroup ? `${contact.count} ${t('members')}` : contact.email}
                  </Text>
                </View>
                <View style={[styles.checkbox, selectedIds.includes(contact.id) && styles.checkboxSelected]}>
                  {selectedIds.includes(contact.id) && (
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 'items' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t('invoice_items')}</Text>
            {items.map((item, idx) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemLabel}>Item {idx + 1}</Text>
                  {items.length > 1 && (
                    <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={styles.itemInput}
                  placeholder={t('service_product')}
                  placeholderTextColor={colors.gray400}
                  value={item.desc}
                  onChangeText={(v) => updateItem(item.id, 'desc', v)}
                />
                <TextInput
                  style={styles.itemInput}
                  placeholder={`${t('amount')} (€)`}
                  placeholderTextColor={colors.gray400}
                  value={item.amount}
                  onChangeText={(v) => updateItem(item.id, 'amount', v)}
                  keyboardType="decimal-pad"
                />
              </View>
            ))}

            <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.addItemText}>{t('add_item')}</Text>
            </TouchableOpacity>

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>{t('total_amount')}</Text>
              <Text style={styles.totalValue}>€{total.toFixed(2)}</Text>
              <Text style={styles.totalSub}>
                {t('subtotal_per_person')}: €{(total / Math.max(selectedIds.length, 1)).toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {step === 'recipients' ? (
          <TouchableOpacity
            style={[styles.ctaBtn, selectedIds.length === 0 && styles.ctaBtnDisabled]}
            onPress={() => setStep('items')}
            disabled={selectedIds.length === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>
              {t('continue_with', { count: selectedIds.length })}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.black} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.ctaBtn, (total <= 0 || sending) && styles.ctaBtnDisabled]}
            onPress={handleSend}
            disabled={total <= 0 || sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator color={colors.black} size="small" />
            ) : (
              <>
                <Ionicons name="send" size={16} color={colors.black} />
                <Text style={styles.ctaBtnText}>
                  {t('send_to', { count: selectedIds.length })}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centeredContainer: { justifyContent: 'center', alignItems: 'center' },
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 0,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gray300,
  },
  stepDotActive: { backgroundColor: colors.primary },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.gray200,
  },
  stepLineActive: { backgroundColor: colors.primary },
  stepContent: { padding: spacing.md },
  stepTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginBottom: spacing.md },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  subLabel: { fontSize: 13, fontWeight: '600', color: colors.gray600, marginBottom: 8 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    marginBottom: 8,
  },
  contactRowSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  contactEmail: { fontSize: 12, color: colors.gray600, marginTop: 1 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLabel: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  itemInput: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: `${colors.primary}40`,
    borderStyle: 'dashed',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  addItemText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  totalCard: {
    backgroundColor: colors.onSurface,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
  },
  totalLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  totalValue: { fontSize: 32, fontWeight: '800', color: colors.white },
  totalSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: colors.black },
  successSection: { alignItems: 'center', padding: spacing.xl },
  successIcon: { marginBottom: spacing.md },
  successTitle: { fontSize: 22, fontWeight: '800', color: colors.onSurface, marginBottom: 8 },
  successDesc: { fontSize: 14, color: colors.gray600, textAlign: 'center', lineHeight: 20, marginBottom: spacing.xl },
  doneBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: colors.black },
});
