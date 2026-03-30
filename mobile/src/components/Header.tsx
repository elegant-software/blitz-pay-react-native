import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../lib/theme';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  onNotificationsPress?: () => void;
  rightElement?: React.ReactNode;
}

export default function Header({
  title,
  showBack = false,
  showNotifications = false,
  onNotificationsPress,
  rightElement,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        )}
        {title && (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>
      <View style={styles.right}>
        {rightElement}
        {showNotifications && (
          <TouchableOpacity onPress={onNotificationsPress} style={styles.iconBtn} hitSlop={12}>
            <Ionicons name="notifications-outline" size={22} color={colors.onSurface} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  backBtn: {
    marginRight: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
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
});
