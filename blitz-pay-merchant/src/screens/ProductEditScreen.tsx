import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useLanguage } from '../lib/LanguageContext';
import { colors, spacing, radius, shadow } from '../lib/theme';
import type { RootStackParamList } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'ProductEdit'>;

export default function ProductEditScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const isEdit = route.params.mode === 'edit';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('');
  const [active, setActive] = useState(true);

  const canSave = name.trim() && price.trim() && !isNaN(Number(price));

  const handleSave = () => {
    // TODO: wire to API
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={22} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? t('edit_product') : t('add_product')}</Text>
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Text style={styles.saveBtnText}>{t('save')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, shadow.sm]}>
          <Field label={t('product_name')} required>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Espresso" placeholderTextColor={colors.gray400} />
          </Field>
          <Field label={t('product_description')}>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description} onChangeText={setDescription}
              placeholder="Short description..." placeholderTextColor={colors.gray400}
              multiline numberOfLines={3}
            />
          </Field>
          <Field label={`${t('product_price')} (EUR)`} required>
            <TextInput
              style={styles.input} value={price} onChangeText={setPrice}
              placeholder="0.00" placeholderTextColor={colors.gray400}
              keyboardType="decimal-pad"
            />
          </Field>
        </View>

        <View style={[styles.card, shadow.sm]}>
          <Field label={t('product_sku')}>
            <TextInput style={styles.input} value={sku} onChangeText={setSku} placeholder="SKU-001" placeholderTextColor={colors.gray400} autoCapitalize="characters" />
          </Field>
          <Field label={t('product_stock')}>
            <TextInput style={styles.input} value={stock} onChangeText={setStock} placeholder="Unlimited" placeholderTextColor={colors.gray400} keyboardType="number-pad" />
          </Field>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('product_active')}</Text>
            <Switch value={active} onValueChange={setActive} trackColor={{ false: colors.gray300, true: colors.primary }} thumbColor={colors.white} />
          </View>
        </View>

        {isEdit && (
          <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.85}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={styles.deleteBtnText}>{t('delete')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={fieldStyles.container}>
      <Text style={fieldStyles.label}>{label}{required ? ' *' : ''}</Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray600, marginBottom: 6 },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray200,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.onSurface },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 6,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: colors.black },
  scroll: { padding: spacing.md },
  card: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: 15, color: colors.onSurface,
    borderWidth: 1, borderColor: colors.gray200,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  switchLabel: { fontSize: 15, color: colors.onSurface, fontWeight: '500' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: `${colors.error}40`,
    borderRadius: radius.xl, padding: spacing.md,
    backgroundColor: `${colors.error}08`,
  },
  deleteBtnText: { fontSize: 15, fontWeight: '600', color: colors.error },
});