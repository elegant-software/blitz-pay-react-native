import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../lib/theme';

interface Props {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: Props) {
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.85);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(onComplete, 1800);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LinearGradient colors={['#000000', '#0A0A1E', '#0D0D2B']} style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <View style={styles.iconRing}>
          <View style={styles.iconCore}>
            <Ionicons name="storefront" size={36} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.brand}>BlitzPay</Text>
        <Text style={styles.sub}>Merchant Portal</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', gap: spacing.sm },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: `${colors.primary}40`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconCore: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: { fontSize: 36, fontWeight: '800', color: colors.white, letterSpacing: -1 },
  sub: { fontSize: 14, color: colors.gray500, letterSpacing: 1 },
});