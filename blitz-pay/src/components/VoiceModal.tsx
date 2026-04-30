import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { useLanguage } from '../lib/LanguageContext';
import { colors, spacing, radius } from '../lib/theme';

interface VoiceModalProps {
  visible: boolean;
  onClose: () => void;
}

// Map dBFS (-80..0) to bar height (0..1)
function dbToAmplitude(db: number): number {
  const clamped = Math.max(-80, Math.min(0, db));
  return (clamped + 80) / 80;
}

const NUM_BARS = 7;

export default function VoiceModal({ visible, onClose }: VoiceModalProps) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { micState, transcript, aiResponse, metering, startRecording, stopAndSubmit, reset } = useVoiceAssistant();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  // Per-bar animations
  const barAnims = useRef(Array.from({ length: NUM_BARS }, () => new Animated.Value(0.15))).current;
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fade in/out modal
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, damping: 20, stiffness: 250, useNativeDriver: true }),
      ]).start();
      // Start recording after modal animates in
      const t = setTimeout(() => void startRecording(), 350);
      return () => clearTimeout(t);
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
      ]).start();
      reset();
    }
  }, [visible]);

  // Animate waveform bars based on metering
  useEffect(() => {
    if (micState !== 'recording') return;
    const amp = dbToAmplitude(metering);
    barAnims.forEach((anim, i) => {
      const variance = 0.3 + Math.random() * 0.7;
      const target = Math.max(0.1, amp * variance);
      Animated.timing(anim, {
        toValue: target,
        duration: POLL_INTERVAL_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    });
  }, [metering, micState]);

  // Idle bar breathe animation
  useEffect(() => {
    if (micState === 'recording') return;
    barAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 0.1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [micState]);

  // Auto-close 3s after speaking finishes (or transcript arrives if no response)
  useEffect(() => {
    if (micState === 'idle' && (aiResponse || transcript)) {
      autoCloseRef.current = setTimeout(() => {
        onClose();
      }, 3000);
    }
    return () => {
      if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    };
  }, [micState, aiResponse, transcript]);

  const handleClose = () => {
    if (micState === 'recording') void stopAndSubmit();
    if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    onClose();
  };

  const statusLabel = () => {
    if (micState === 'recording') return t('voice_listening');
    if (micState === 'processing') return t('voice_processing');
    if (micState === 'speaking') return t('voice_speaking');
    if (micState === 'error') return t('voice_error_retry');
    if (transcript) return transcript;
    return t('tap_to_speak');
  };

  const isRecording = micState === 'recording';
  const isProcessing = micState === 'processing';
  const isSpeaking = micState === 'speaking';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={handleClose} activeOpacity={1} />

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + spacing.lg, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient colors={['#0A0A1E', '#000000']} style={styles.gradient}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Close button */}
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>

            {/* Avatar orb */}
            <View style={styles.orbContainer}>
              <View style={[styles.orbOuter, isRecording && styles.orbOuterActive]}>
                <View style={[styles.orbInner, isRecording && styles.orbInnerActive]}>
                  <LinearGradient
                    colors={micState === 'error' ? [colors.error, '#FF6B6B'] : [colors.primary, colors.secondary]}
                    style={styles.orb}
                  >
                    {isProcessing || isSpeaking ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Ionicons
                        name={isRecording ? 'mic' : micState === 'error' ? 'mic-off' : 'flash'}
                        size={28}
                        color={colors.white}
                      />
                    )}
                  </LinearGradient>
                </View>
              </View>
            </View>

            {/* Waveform bars */}
            <View style={styles.barsContainer}>
              {barAnims.map((anim, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.bar,
                    {
                      height: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [4, 48],
                      }),
                      opacity: anim.interpolate({
                        inputRange: [0.1, 1],
                        outputRange: [0.3, 1],
                      }),
                    },
                  ]}
                />
              ))}
            </View>

            {/* Status / transcript */}
            <Text style={[styles.statusText, transcript && styles.transcriptText]}>
              {statusLabel()}
            </Text>

            {/* AI response bubble */}
            {aiResponse && (micState === 'speaking' || micState === 'idle') && (
              <View style={styles.responseBubble}>
                <Text style={styles.responseText}>{aiResponse}</Text>
              </View>
            )}

            {/* Hint */}
            {isRecording && (
              <Text style={styles.hintText}>{t('voice_stop_hint')}</Text>
            )}

            {/* Manual stop button */}
            {isRecording && (
              <TouchableOpacity style={styles.stopBtn} onPress={() => void stopAndSubmit()}>
                <Ionicons name="stop-circle" size={18} color={colors.primary} />
                <Text style={styles.stopBtnText}>{t('voice_stop_btn')}</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const POLL_INTERVAL_MS = 200;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  gradient: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    minHeight: 320,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: spacing.md,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbOuterActive: { borderColor: `${colors.primary}40` },
  orbInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbInnerActive: { borderColor: `${colors.primary}70` },
  orb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 56,
    marginBottom: spacing.md,
  },
  bar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  transcriptText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: spacing.md,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.primary}50`,
    marginTop: spacing.sm,
  },
  stopBtnText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  responseBubble: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    maxWidth: '100%',
  },
  responseText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
