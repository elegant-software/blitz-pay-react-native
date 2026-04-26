import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../lib/LanguageContext';
import { colors, spacing, radius } from '../lib/theme';
import { useVoiceAssistantContext, type ConversationEntry } from '../lib/VoiceAssistantContext';

export default function AssistantScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { micState, conversation } = useVoiceAssistantContext();

  const listRef = useRef<FlatList>(null);
  const isRecording = micState === 'recording';
  const isProcessing = micState === 'processing';

  // Scroll to bottom when new message arrives
  useEffect(() => {
    if (conversation.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [conversation.length]);

  const renderMessage = ({ item }: { item: ConversationEntry }) => {
    const aiText = item.response ?? item.question;
    return (
      <View style={styles.messageRow}>
        {/* User bubble — right aligned */}
        <View style={styles.userBubble}>
          <Ionicons name="mic" size={13} color={colors.primary} style={styles.userBubbleIcon} />
          <Text style={styles.userBubbleText}>{item.question}</Text>
        </View>

        {/* AI bubble — always shown */}
        <View style={styles.aiBubble}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIconBox}>
              <Ionicons name="flash" size={12} color={colors.primary} />
            </View>
            <Text style={styles.aiLabel}>Blitz AI</Text>
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={styles.aiText}>{aiText}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#000000', '#0A0A1E']} style={styles.gradient}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('assistant')}</Text>
          {isRecording && (
            <View style={styles.listeningBadge}>
              <View style={styles.listeningDot} />
              <Text style={styles.listeningLabel}>{t('voice_listening')}</Text>
            </View>
          )}
          {isProcessing && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
        </View>

        {/* Conversation list */}
        {conversation.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="mic-outline" size={36} color={`${colors.primary}80`} />
            </View>
            <Text style={styles.emptyTitle}>{t('voice_empty_title')}</Text>
            <Text style={styles.emptySubtitle}>{t('voice_empty_subtitle')}</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={conversation}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.white },
  listeningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.primary}20`,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  listeningDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  listeningLabel: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  messageRow: { gap: spacing.sm },
  userBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: `${colors.primary}25`,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  userBubbleIcon: { marginTop: 2 },
  userBubbleText: { fontSize: 14, color: colors.white, fontWeight: '500', flexShrink: 1, lineHeight: 20 },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: spacing.md,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiIconBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiLabel: { fontSize: 12, fontWeight: '700', color: colors.primary, flex: 1 },
  timestamp: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  aiText: { fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 21 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
