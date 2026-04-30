import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../lib/LanguageContext';
import { colors, spacing, radius, shadow } from '../lib/theme';
import type { RootStackNav, Product } from '../types';

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Espresso', description: 'Single shot espresso', unitPrice: 2.5, categoryName: 'Drinks', sku: 'ESPR-001', stock: 999, active: true },
  { id: '2', name: 'Cappuccino', description: 'Espresso with steamed milk foam', unitPrice: 3.8, categoryName: 'Drinks', sku: 'CAPP-001', stock: 999, active: true },
  { id: '3', name: 'Croissant', description: 'Butter croissant, freshly baked', unitPrice: 2.2, categoryName: 'Food', sku: 'CROI-001', stock: 24, active: true },
  { id: '4', name: 'Blueberry Muffin', description: 'Homemade muffin', unitPrice: 2.8, categoryName: 'Food', sku: 'MUFF-002', stock: 0, active: false },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

export default function ProductsScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation<RootStackNav>();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState(MOCK_PRODUCTS);

  const toggleActive = (id: string) => {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, active: !p.active } : p));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('products')}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('ProductEdit', { mode: 'create' })}
        >
          <Ionicons name="add" size={20} color={colors.black} />
          <Text style={styles.addBtnText}>{t('add_product')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 90 + insets.bottom, paddingTop: spacing.sm }} showsVerticalScrollIndicator={false}>
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={[styles.productCard, shadow.sm, !product.active && styles.productCardInactive]}
            onPress={() => navigation.navigate('ProductEdit', { productId: product.id, mode: 'edit' })}
            activeOpacity={0.7}
          >
            <View style={styles.productLeft}>
              <View style={[styles.productIcon, { backgroundColor: product.active ? `${colors.primary}15` : colors.surface }]}>
                <Ionicons name="cube-outline" size={22} color={product.active ? colors.primary : colors.gray400} />
              </View>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, !product.active && styles.textMuted]}>{product.name}</Text>
                <Text style={styles.productCategory}>{product.categoryName ?? '—'}</Text>
                {product.sku ? <Text style={styles.productSku}>SKU: {product.sku}</Text> : null}
              </View>
            </View>
            <View style={styles.productRight}>
              <Text style={[styles.productPrice, !product.active && styles.textMuted]}>
                {formatCurrency(product.unitPrice)}
              </Text>
              {product.stock !== undefined && (
                <Text style={[styles.productStock, product.stock === 0 && styles.stockOut]}>
                  {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                </Text>
              )}
              <Switch
                value={product.active}
                onValueChange={() => toggleActive(product.id)}
                trackColor={{ false: colors.gray300, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray200,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.onSurface },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: colors.black },
  productCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  productCardInactive: { opacity: 0.65 },
  productLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  productIcon: { width: 44, height: 44, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', color: colors.onSurface },
  productCategory: { fontSize: 12, color: colors.gray500, marginTop: 1 },
  productSku: { fontSize: 11, color: colors.gray400, marginTop: 1 },
  textMuted: { color: colors.gray400 },
  productRight: { alignItems: 'flex-end', gap: 2 },
  productPrice: { fontSize: 15, fontWeight: '700', color: colors.onSurface },
  productStock: { fontSize: 11, color: colors.success },
  stockOut: { color: colors.error },
});