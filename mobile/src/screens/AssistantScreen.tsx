import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../lib/LanguageContext';
import { colors, spacing, radius, shadow } from '../lib/theme';

export default function AssistantScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [muted, setMuted] = useState(false);
  const [listening, setListening] = useState(false);

  const toggleListening = () => {
    if (!muted) {
      setListening(!listening);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#000000', '#0A0A1E']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('assistant')}</Text>
          <TouchableOpacity
            onPress={() => setMuted(!muted)}
            style={[styles.muteBtn, muted && styles.muteBtnActive]}
          >
            <Ionicons
              name={muted ? 'mic-off-outline' : 'mic-outline'}
              size={20}
              color={muted ? colors.error : colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={toggleListening} style={styles.avatarWrapper} activeOpacity={0.9}>
            <View style={[styles.outerRing, listening && styles.outerRingActive]}>
              <View style={[styles.innerRing, listening && styles.innerRingActive]}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.avatarCore}
                >
                  <Ionicons name="flash" size={32} color={colors.white} />
                </LinearGradient>
              </View>
            </View>
            <Text style={styles.avatarLabel}>
              {muted ? 'Muted' : listening ? t('live_transcription') : 'Tap to speak'}
            </Text>
          </TouchableOpacity>

          {listening && !muted && (
            <View style={styles.listeningIndicator}>
              {[1, 2, 3, 4, 5].map((bar) => (
                <View key={bar} style={[styles.bar, { height: 8 + bar * 6 }]} />
              ))}
            </View>
          )}
        </View>

        {/* AI Response card */}
        <View style={styles.responseCard}>
          <View style={styles.responseHeader}>
            <View style={styles.aiIconBox}>
              <Ionicons name="flash" size={14} color={colors.primary} />
            </View>
            <Text style={styles.aiLabel}>Blitz AI</Text>
            <View style={styles.activeDot} />
          </View>
          <Text style={styles.responseText}>{t('ai_assistant_msg')}</Text>
          <View style={styles.responseActions}>
            <TouchableOpacity style={styles.responseActionBtn}>
              <Text style={styles.responseActionText}>{t('compare')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.responseActionBtn, styles.responseActionBtnPrimary]}>
              <Text style={[styles.responseActionText, styles.responseActionTextPrimary]}>{t('buy_now')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick suggestions */}
        <View style={styles.suggestions}>
          {['Check price', 'Find nearby', 'Pay invoice', 'My balance'].map((suggestion) => (
            <TouchableOpacity key={suggestion} style={styles.suggestionChip} activeOpacity={0.8}>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.white },
  muteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteBtnActive: { backgroundColor: `${colors.error}20` },
  avatarSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatarWrapper: { alignItems: 'center' },
  outerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRingActive: {
    borderColor: `${colors.primary}40`,
  },
  innerRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRingActive: {
    borderColor: `${colors.primary}60`,
  },
  avatarCore: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 16,
    letterSpacing: 0.5,
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginTop: spacing.md,
    height: 40,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    opacity: 0.8,
  },
  responseCard: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  aiIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiLabel: { fontSize: 13, fontWeight: '700', color: colors.primary },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.success,
  },
  responseText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  responseActions: { flexDirection: 'row', gap: 8 },
  responseActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    paddingVertical: 8,
    alignItems: 'center',
  },
  responseActionBtnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  responseActionText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  responseActionTextPrimary: { color: colors.black },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md + 80,
    justifyContent: 'center',
  },
  suggestionChip: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  suggestionText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
});
