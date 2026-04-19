import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../lib/LanguageContext';
import { colors, spacing, radius } from '../lib/theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const { t } = useLanguage();
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;
  
  // Rings
  const ring1Scale = useRef(new Animated.Value(0.5)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Icon animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
        delay: 200,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
        delay: 200,
      }),
    ]).start();

    // Rings animation
    const animateRing = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
      scale.setValue(0.5);
      opacity.setValue(0.6);
      Animated.loop(
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 2.5,
            duration: 1500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    setTimeout(() => animateRing(ring1Scale, ring1Opacity, 0), 400);
    setTimeout(() => animateRing(ring2Scale, ring2Opacity, 0), 900);

    // Text animation
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        delay: 800,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
        delay: 800,
      }),
    ]).start();

    // Loading bar
    Animated.timing(loadingAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false, // Cannot animate width with native driver
    }).start();

    // Final fade out
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    }, 2500);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-45deg', '0deg'],
  });

  const loadingWidth = loadingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Background Glow */}
      <View style={styles.glowContainer}>
        <View style={styles.glow} />
      </View>

      {/* Blitz Icon */}
      <View style={styles.iconContainer}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }, { rotate: spin }] }}>
          <View style={styles.iconCircle}>
            <Ionicons name="flash" size={64} color={colors.primary} />
          </View>
        </Animated.View>

        {/* Electric Rings */}
        <Animated.View 
          style={[
            styles.ring, 
            { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }
          ]} 
        />
        <Animated.View 
          style={[
            styles.ring, 
            { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }
          ]} 
        />
      </View>

      {/* App Name */}
      <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslateY }], alignItems: 'center', marginTop: 40 }}>
        <Text style={styles.appName}>
          Blitz<Text style={{ color: colors.primary }}>Pay</Text>
        </Text>
        <Text style={styles.tagline}>{t('splash_tagline')}</Text>
      </Animated.View>

      {/* Loading Bar */}
      <View style={styles.loadingTrack}>
        <Animated.View style={[styles.loadingFill, { width: loadingWidth }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: colors.primary,
    opacity: 0.15,
    filter: 'blur(60px)', // Note: standard RN doesn't support filter, but expo might or we use opacity
  },
  iconContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow/Glow effect
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  appName: {
    fontSize: 48,
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.white,
    letterSpacing: -2,
  },
  tagline: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '700',
    color: `${colors.primary}99`,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  loadingTrack: {
    position: 'absolute',
    bottom: 80,
    width: 200,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingFill: {
    height: '100%',
    backgroundColor: colors.primary,
    // Glow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
});
