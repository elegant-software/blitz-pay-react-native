import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../lib/LanguageContext';
import { colors, spacing, radius, shadow } from '../lib/theme';
import type { RootStackNav, Order, OrderStatus } from '../types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: colors.warning,
  processing: colors.primary,
  completed: colors.success,
  cancelled: colors.error,
  refunded: colors.gray500,
};

const MOCK_ORDERS: Order[] = [
  { id: '1', orderNumber: '1042', customerName: 'Anna Müller', amount: 89.9, currency: 'EUR', status: 'pending', createdAt: new Date().toISOString(), items: [] },
  { id: '2', orderNumber: '1041', customerName: 'Thomas Weber', amount: 245.0, currency: 'EUR', status: 'completed', createdAt: new Date(Date.now() - 3600000).toISOString(), items: [] },
  { id: '3', orderNumber: '1040', customerName: 'Sarah Klein', amount: 55.5, currency: 'EUR', status: 'processing', createdAt: new Date(Date.now() - 7200000).toISOString(), items: [] },
  { id: '4', orderNumber: '1039', customerName: 'Marco Rossi', amount: 312.0, currency: 'EUR', status: 'completed', createdAt: new Date(Date.now() - 86400000).toISOString(), items: [] },
  { id: '5', orderNumber: '1038', customerName: 'Julia Braun', amount: 78.0, currency: 'EUR', status: 'cancelled', createdAt: new Date(Date.now() - 172800000).toISOString(), items: [] },
];

const FILTER_TABS: Array<{ key: OrderStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'completed', label: 'Completed' },
];

function formatCurrency(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function OrdersScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation<RootStackNav>();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');

  const filtered = MOCK_ORDERS.filter((o) => {
    const matchesFilter = activeFilter === 'all' || o.status === activeFilter;
    const matchesSearch = !search || o.orderNumber.includes(search) || o.customerName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('all_orders')}</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.gray500} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order # or customer..."
            placeholderTextColor={colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.gray400} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text style={[styles.filterTabText, activeFilter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Order list */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 90 + insets.bottom, paddingTop: spacing.sm }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>{t('no_data')}</Text>
          </View>
        ) : filtered.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={[styles.orderCard, shadow.sm]}
            onPress={() => navigation.navigate('OrderDetail', {
              orderId: order.id,
              orderNumber: order.orderNumber,
              amount: order.amount,
              currency: order.currency,
              customerName: order.customerName,
              status: order.status,
            })}
            activeOpacity={0.7}
          >
            <View style={styles.orderTop}>
              <View>
                <Text style={styles.orderNum}>{t('order_number')}{order.orderNumber}</Text>
                <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLORS[order.status]}15` }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] }]}>
                  {t(`status_${order.status}` as Parameters<typeof t>[0])}
                </Text>
              </View>
            </View>
            <View style={styles.orderBottom}>
              <View style={styles.customerRow}>
                <Ionicons name="person-outline" size={14} color={colors.gray500} />
                <Text style={styles.customerName}>{order.customerName}</Text>
              </View>
              <Text style={styles.orderAmount}>{formatCurrency(order.amount, order.currency)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray200 },
  title: { fontSize: 24, fontWeight: '800', color: colors.onSurface, marginBottom: spacing.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.onSurface },
  filterRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm, backgroundColor: colors.white },
  filterTab: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.full, backgroundColor: colors.surface,
  },
  filterTabActive: { backgroundColor: colors.primary },
  filterTabText: { fontSize: 13, fontWeight: '600', color: colors.gray600 },
  filterTabTextActive: { color: colors.black },
  orderCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  orderNum: { fontSize: 15, fontWeight: '700', color: colors.onSurface },
  orderDate: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  statusPill: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  customerName: { fontSize: 13, color: colors.gray600 },
  orderAmount: { fontSize: 17, fontWeight: '700', color: colors.onSurface },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { fontSize: 15, color: colors.gray500 },
});