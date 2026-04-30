import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../lib/LanguageContext';
import { colors, spacing, radius, shadow } from '../lib/theme';

type AssetStatus = 'upcoming' | 'confirmed' | 'delivered';

const ASSETS = [
  {
    id: '1',
    name: 'After Hours: Modern Art',
    venue: 'Tate Modern, London',
    date: 'Sat 12 Apr 2026 · 19:00',
    status: 'upcoming' as AssetStatus,
    price: '€45.00',
    icon: 'color-palette-outline',
  },
  {
    id: '2',
    name: 'Jazz Night Live',
    venue: "Ronnie Scott's, London",
    date: 'Fri 18 Apr 2026 · 21:30',
    status: 'confirmed' as AssetStatus,
    price: '€35.00',
    icon: 'musical-notes-outline',
  },
  {
    id: '3',
    name: 'Premium Sourdough Starter Kit',
    venue: 'Artisan Bakery Co.',
    date: 'Delivered 28 Mar 2026',
    status: 'delivered' as AssetStatus,
    price: '€24.50',
    icon: 'cafe-outline',
  },
];

const STATUS_COLORS: Record<AssetStatus, string> = {
  upcoming: colors.warning,
  confirmed: colors.success,
  delivered: colors.gray500,
};

export default function VaultScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filtered = ASSETS.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Balance card */}
      <LinearGradient colors={['#0A0A1E', '#1a0533']} style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t('total_balance')}</Text>
        <Text style={styles.balanceAmount}>€1,284.50</Text>
        <View style={styles.pointsRow}>
          <Ionicons name="flash" size={14} color={colors.primary} />
          <Text style={styles.pointsText}>2,450 {t('blitz_points')}</Text>
        </View>
        <View style={styles.balanceActions}>
          <TouchableOpacity style={styles.balanceAction}>
            <Ionicons name="add-circle-outline" size={20} color={colors.white} />
            <Text style={styles.balanceActionText}>{t('add_funds')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.balanceAction}>
            <Ionicons name="arrow-up-circle-outline" size={20} color={colors.white} />
            <Text style={styles.balanceActionText}>{t('send_invoice')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.balanceAction}>
            <Ionicons name="time-outline" size={20} color={colors.white} />
            <Text style={styles.balanceActionText}>{t('recent_activity')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Collection */}
      <View style={styles.collectionHeader}>
        <Text style={styles.collectionTitle}>{t('your_collection')}</Text>
        <Text style={styles.collectionSubtitle}>{t('manage_assets')}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={16} color={colors.gray500} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_assets')}
          placeholderTextColor={colors.gray500}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 90 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {filtered.map((asset) => (
          <View key={asset.id} style={styles.assetCard}>
            <View style={styles.assetLeft}>
              <View style={styles.assetIcon}>
                <Ionicons name={asset.icon as React.ComponentProps<typeof Ionicons>['name']} size={22} color={colors.secondary} />
              </View>
              <View style={styles.assetInfo}>
                <Text style={styles.assetName} numberOfLines={1}>{asset.name}</Text>
                <Text style={styles.assetVenue}>{asset.venue}</Text>
                <Text style={styles.assetDate}>{asset.date}</Text>
              </View>
            </View>
            <View style={styles.assetRight}>
              <Text style={styles.assetPrice}>{asset.price}</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[asset.status]}20` }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[asset.status] }]}>
                  {t(asset.status as 'upcoming' | 'confirmed' | 'delivered')}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={colors.gray300} />
            <Text style={styles.emptyTitle}>{t('purchased_new')}</Text>
            <Text style={styles.emptyDesc}>{t('auto_appear')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  balanceCard: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  balanceAmount: { fontSize: 36, fontWeight: '800', color: colors.white, letterSpacing: -1, marginBottom: 6 },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.md,
  },
  pointsText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  balanceActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  balanceAction: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  balanceActionText: { fontSize: 11, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  collectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  collectionTitle: { fontSize: 17, fontWeight: '700', color: colors.onSurface },
  collectionSubtitle: { fontSize: 13, color: colors.gray600, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.onSurface },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
    ...shadow.sm,
  },
  assetLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.sm },
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: `${colors.secondary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetInfo: { flex: 1 },
  assetName: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  assetVenue: { fontSize: 12, color: colors.gray600, marginTop: 1 },
  assetDate: { fontSize: 11, color: colors.gray500, marginTop: 1 },
  assetRight: { alignItems: 'flex-end', gap: 4 },
  assetPrice: { fontSize: 15, fontWeight: '700', color: colors.onSurface },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.gray600, marginTop: spacing.md },
  emptyDesc: { fontSize: 13, color: colors.gray500, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
