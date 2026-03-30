import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/auth';
import { colors, spacing, radius, shadow } from '../lib/theme';
import type { RootStackNav } from '../types';

const MERCHANTS = [
  { id: '1', name: 'Artisan Bakery Co.', category: 'Food & Drink', rating: 4.8, distance: '0.3 km', open_until: '20:00', verified: true },
  { id: '2', name: 'The Vinyl Record Shop', category: 'Music & Entertainment', rating: 4.6, distance: '0.7 km', open_until: '19:00', verified: true },
  { id: '3', name: 'Urban Garden Centre', category: 'Home & Garden', rating: 4.5, distance: '1.2 km', open_until: '18:00', verified: false },
];

const EVENTS = [
  { id: '1', title: 'After Hours: Modern Art', venue: 'Tate Modern', price: '€45', color: '#5856D6' },
  { id: '2', title: 'Jazz Night Live', venue: 'Ronnie Scott\'s', price: '€35', color: '#00C2FF' },
  { id: '3', title: 'Street Food Festival', venue: 'South Bank', price: 'Free', color: '#FF9500' },
];

const QUICK_ACTIONS = [
  { key: 'my_qr', icon: 'qr-code-outline', screen: 'MyQRCode' as const },
  { key: 'scan_qr', icon: 'scan-outline', screen: 'QRScanner' as const },
  { key: 'invoices', icon: 'document-text-outline', screen: 'Invoices' as const },
  { key: 'send_invoice', icon: 'send-outline', screen: 'SendInvoice' as const },
];

export default function ExploreScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigation = useNavigation<RootStackNav>();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {/* Left: avatar + greeting (matches web layout) */}
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?img=47' }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.greeting}>{t('happening_now')}</Text>
            <Text style={styles.locationLabel}>📍 London, UK</Text>
          </View>
        </View>
        {/* Right: BlitzPay brand + notifications */}
        <View style={styles.headerRight}>
          <Text style={styles.brandMark}>⚡ BlitzPay</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.notifBtn}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.onSurface} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.gray500} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_placeholder')}
          placeholderTextColor={colors.gray500}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.key}
            style={styles.quickAction}
            onPress={() => navigation.navigate(action.screen)}
            activeOpacity={0.75}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name={action.icon as React.ComponentProps<typeof Ionicons>['name']} size={22} color={colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>{t(action.key as 'my_qr' | 'scan_qr' | 'invoices' | 'send_invoice')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Events */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('happening_now')}</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>{t('see_all')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsRow}>
        {EVENTS.map((event) => (
          <TouchableOpacity key={event.id} style={[styles.eventCard, { backgroundColor: event.color }]} activeOpacity={0.85}>
            <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
            <Text style={styles.eventVenue}>{event.venue}</Text>
            <View style={styles.eventPriceRow}>
              <Text style={styles.eventPrice}>{event.price}</Text>
              <View style={styles.eventPendingBadge}>
                <Text style={styles.eventPendingText}>{t('featured')}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Nearby Merchants */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('nearby_merchants')}</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>{t('see_all')}</Text>
        </TouchableOpacity>
      </View>

      {MERCHANTS.map((merchant) => (
        <TouchableOpacity
          key={merchant.id}
          style={styles.merchantCard}
          onPress={() => navigation.navigate('Merchant', { merchantId: merchant.id, merchantName: merchant.name })}
          activeOpacity={0.85}
        >
          <View style={styles.merchantIconBox}>
            <Ionicons name="storefront-outline" size={24} color={colors.secondary} />
          </View>
          <View style={styles.merchantInfo}>
            <View style={styles.merchantNameRow}>
              <Text style={styles.merchantName}>{merchant.name}</Text>
              {merchant.verified && (
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              )}
            </View>
            <Text style={styles.merchantCategory}>{merchant.category}</Text>
            <View style={styles.merchantMeta}>
              <Ionicons name="star" size={12} color="#FF9500" />
              <Text style={styles.merchantRating}>{merchant.rating}</Text>
              <Text style={styles.merchantDot}>·</Text>
              <Text style={styles.merchantDistance}>{merchant.distance}</Text>
              <Text style={styles.merchantDot}>·</Text>
              <Text style={styles.merchantOpen}>{t('open_until')} {merchant.open_until}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  locationLabel: {
    fontSize: 12,
    color: colors.gray600,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandMark: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  notifBtn: {
    position: 'relative',
    padding: 4,
  },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.gray200,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.onSurface,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.xl,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray700,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onSurface,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  eventsRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  eventCard: {
    width: 180,
    borderRadius: radius.xl,
    padding: spacing.md,
    justifyContent: 'flex-end',
    minHeight: 130,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  eventPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  eventPendingBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  eventPendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  merchantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  merchantIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: `${colors.secondary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurface,
  },
  merchantCategory: {
    fontSize: 12,
    color: colors.gray600,
    marginTop: 1,
  },
  merchantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  merchantRating: {
    fontSize: 12,
    color: colors.gray700,
    fontWeight: '500',
  },
  merchantDot: {
    color: colors.gray400,
    fontSize: 12,
  },
  merchantDistance: {
    fontSize: 12,
    color: colors.gray600,
  },
  merchantOpen: {
    fontSize: 12,
    color: colors.success,
  },
});
