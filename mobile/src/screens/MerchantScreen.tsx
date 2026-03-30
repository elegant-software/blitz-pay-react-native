import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useLanguage } from '../lib/LanguageContext';
import { colors, spacing, radius, shadow } from '../lib/theme';
import type { RootStackNav, RootStackParamList } from '../types';

const PRODUCTS = [
  { id: '1', name: 'Premium Sourdough Starter Kit', price: '€24.50', desc: 'Everything you need to start your sourdough journey', featured: true },
  { id: '2', name: 'Artisan Rye Flour 1kg', price: '€4.90', desc: 'Stone-ground organic rye', featured: false },
  { id: '3', name: 'Banneton Proofing Basket', price: '€18.00', desc: 'Traditional wicker proofing basket', featured: false },
];

export default function MerchantScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation<RootStackNav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Merchant'>>();
  const insets = useSafeAreaInsets();
  const merchantName = route.params?.merchantName ?? 'Artisan Bakery Co.';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{merchantName}</Text>
        <TouchableOpacity style={styles.shareBtn} hitSlop={12}>
          <Ionicons name="share-outline" size={22} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Merchant banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="storefront" size={40} color={colors.secondary} />
          </View>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerName}>{merchantName}</Text>
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              <Text style={styles.verifiedText}>{t('blitz_verified')}</Text>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#FF9500" />
              <Text style={styles.ratingText}>4.8 · Food & Drink · 0.3 km</Text>
            </View>
          </View>
        </View>

        {/* Featured product */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('featured_craft')}</Text>
          <View style={styles.featuredCard}>
            <View style={styles.featuredImagePlaceholder}>
              <Ionicons name="cafe-outline" size={48} color={colors.secondary} />
            </View>
            <View style={styles.featuredInfo}>
              <Text style={styles.featuredName}>{PRODUCTS[0].name}</Text>
              <Text style={styles.featuredDesc}>{PRODUCTS[0].desc}</Text>
              <View style={styles.featuredBottom}>
                <Text style={styles.featuredPrice}>{PRODUCTS[0].price}</Text>
                <View style={styles.featuredActions}>
                  <TouchableOpacity style={styles.reserveBtn}>
                    <Text style={styles.reserveBtnText}>{t('reserve')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.payNowBtn}
                    onPress={() => navigation.navigate('Checkout', { amount: 24.5, merchantName })}
                  >
                    <Text style={styles.payNowBtnText}>{t('pay_now')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* AI Price Intelligence */}
        <View style={[styles.section, styles.aiCard]}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIconBox}>
              <Ionicons name="flash" size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.aiTitle}>{t('blitz_assistant')}</Text>
              <Text style={styles.aiSubtitle}>{t('price_intelligence')}</Text>
            </View>
          </View>
          <Text style={styles.aiMessage}>{t('cheaper_elsewhere')}</Text>
          <TouchableOpacity style={styles.comparePricesBtn}>
            <Text style={styles.comparePricesBtnText}>{t('compare_prices')}</Text>
          </TouchableOpacity>
        </View>

        {/* More products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('more_from_merchant')}</Text>
          {PRODUCTS.slice(1).map((product) => (
            <TouchableOpacity key={product.id} style={styles.productRow} activeOpacity={0.8}>
              <View style={styles.productIcon}>
                <Ionicons name="cube-outline" size={20} color={colors.gray600} />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDesc}>{product.desc}</Text>
              </View>
              <Text style={styles.productPrice}>{product.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.payNowLargeBtn}
          onPress={() => navigation.navigate('Checkout', { amount: 24.5, merchantName })}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={18} color={colors.black} />
          <Text style={styles.payNowLargeBtnText}>{t('pay_now')}</Text>
        </TouchableOpacity>
      </View>
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
  backBtn: {},
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  shareBtn: {},
  banner: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  bannerIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: `${colors.secondary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  bannerInfo: { flex: 1, justifyContent: 'center' },
  bannerName: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginBottom: 4 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  verifiedText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: colors.gray600 },
  section: { padding: spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.onSurface, marginBottom: spacing.sm },
  featuredCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray200,
    ...shadow.sm,
  },
  featuredImagePlaceholder: {
    height: 140,
    backgroundColor: `${colors.secondary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredInfo: { padding: spacing.md },
  featuredName: { fontSize: 16, fontWeight: '700', color: colors.onSurface, marginBottom: 4 },
  featuredDesc: { fontSize: 13, color: colors.gray600, marginBottom: spacing.sm },
  featuredBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featuredPrice: { fontSize: 20, fontWeight: '800', color: colors.onSurface },
  featuredActions: { flexDirection: 'row', gap: 8 },
  reserveBtn: {
    borderWidth: 1.5,
    borderColor: colors.onSurface,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  reserveBtnText: { fontSize: 13, fontWeight: '600', color: colors.onSurface },
  payNowBtn: {
    backgroundColor: colors.onSurface,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  payNowBtnText: { fontSize: 13, fontWeight: '600', color: colors.white },
  aiCard: {
    backgroundColor: `${colors.primary}08`,
    margin: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.sm },
  aiIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiTitle: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  aiSubtitle: { fontSize: 12, color: colors.gray600 },
  aiMessage: { fontSize: 14, color: colors.gray700, lineHeight: 20, marginBottom: spacing.sm },
  comparePricesBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 10,
    alignItems: 'center',
  },
  comparePricesBtnText: { fontSize: 14, fontWeight: '700', color: colors.black },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    gap: spacing.sm,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  productDesc: { fontSize: 12, color: colors.gray600, marginTop: 1 },
  productPrice: { fontSize: 15, fontWeight: '700', color: colors.onSurface },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  payNowLargeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  payNowLargeBtnText: { fontSize: 16, fontWeight: '700', color: colors.black },
});
