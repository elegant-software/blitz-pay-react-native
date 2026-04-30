import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  useAudioRecorder,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  IOSOutputFormat,
  AudioQuality,
} from 'expo-audio';
import * as Speech from 'expo-speech';
import { submitVoiceQuery } from './api/voiceApi';

// 16 kHz mono AAC — optimised for voice upload (~7 KB/10 s vs 160 KB with HIGH_QUALITY)
const VOICE_PRESET = {
  extension: '.m4a',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 32000,
  isMeteringEnabled: true,
  android: {
    outputFormat: 'mpeg4' as const,
    audioEncoder: 'aac' as const,
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MEDIUM,
    linearPCMBitDepth: 16 as const,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 32000,
  },
};

export type MicState = 'idle' | 'recording' | 'processing' | 'error';

export interface ConversationEntry {
  id: string;
  question: string;    // what the user said (transcribed)
  response?: string;   // AI-generated answer (if backend provides it)
  language?: string;
  timestamp: number;
}

interface VoiceAssistantContextValue {
  micState: MicState;
  metering: number;
  conversation: ConversationEntry[];
  toggleRecording: () => Promise<void>;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextValue | null>(null);

const SILENCE_THRESHOLD_DB = -50;
const SILENCE_DURATION_MS = 1500;
const INITIAL_GRACE_MS = 2000;
const POLL_INTERVAL_MS = 200;
const MAX_RECORDING_MS = 60_000;

export function VoiceAssistantProvider({ children }: { children: React.ReactNode }) {
  const recorder = useAudioRecorder(VOICE_PRESET);

  const [micState, setMicState] = useState<MicState>('idle');
  const [metering, setMetering] = useState(-160);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);

  const micStateRef = useRef<MicState>('idle');
  micStateRef.current = micState;

  const silenceStartRef = useRef<number | null>(null);
  const recordingStartRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
  };

  const stopAndSubmit = useCallback(async () => {
    if (micStateRef.current !== 'recording') return;
    clearTimers();
    console.log('[VoiceAssistant] stopping recorder');
    try { await recorder.stop(); } catch {}

    // Release recording audio session so TTS can play through speaker on both platforms
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch {}
    // Give the audio session 250 ms to switch route before TTS starts
    await new Promise<void>((r) => setTimeout(r, 250));

    const uri = recorder.uri;
    console.log('[VoiceAssistant] uri:', uri);
    if (!uri) { setMicState('idle'); setMetering(-160); return; }

    setMicState('processing');
    setMetering(-160);
    try {
      const result = await submitVoiceQuery(uri, 'audio/m4a');
      console.log('[VoiceAssistant] response:', result);
      if (result.transcript) {
        const entry: ConversationEntry = {
          id: `${Date.now()}`,
          question: result.transcript,
          response: result.response,
          language: result.language,
          timestamp: Date.now(),
        };
        setConversation((prev) => [...prev, entry]);

        const textToSpeak = result.response || result.transcript;
        const lang = result.language ?? undefined;
        console.log('[VoiceAssistant] speaking, lang:', lang, 'text:', textToSpeak);
        try {
          const isSpeaking = await Speech.isSpeakingAsync();
          if (isSpeaking) await Speech.stop();
        } catch {}
        // Release recording audio session so TTS can use the speaker
        try { await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }); } catch {}
        // Defer to next frame so Android audio focus is fully released before TTS claims it
        await new Promise<void>((r) => setTimeout(r, Platform.OS === 'android' ? 300 : 0));
        console.log('[Speech] about to speak, isSpeaking:', await Speech.isSpeakingAsync().catch(() => 'err'));
        Speech.speak(textToSpeak, {
          language: lang,
          onStart: () => console.log('[Speech] started'),
          onDone: () => console.log('[Speech] done'),
          onError: (e) => {
            console.error('[Speech] error:', e);
            // Retry without language code if language-specific voice is unavailable
            if (lang) {
              console.log('[Speech] retrying without language');
              Speech.speak(textToSpeak, {
                onStart: () => console.log('[Speech] retry started'),
                onDone: () => console.log('[Speech] retry done'),
                onError: (e2) => console.error('[Speech] retry error:', e2),
              });
            }
          },
        });
      }
      setMicState('idle');
    } catch (e) {
      console.error('[VoiceAssistant] submit error:', e);
      setMicState('error');
      setTimeout(() => setMicState('idle'), 3000);
    }
  }, [recorder]);

  const startRecording = useCallback(async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) return;
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingStartRef.current = Date.now();
      silenceStartRef.current = null;
      setMicState('recording');
      console.log('[VoiceAssistant] recording started');

      pollRef.current = setInterval(() => {
        if (micStateRef.current !== 'recording') { clearTimers(); return; }
        const status = recorder.getStatus();
        const db = status.metering ?? -160;
        setMetering(db);
        const elapsed = Date.now() - recordingStartRef.current;
        if (elapsed < INITIAL_GRACE_MS) return;
        if (db < SILENCE_THRESHOLD_DB) {
          if (!silenceStartRef.current) silenceStartRef.current = Date.now();
          else if (Date.now() - silenceStartRef.current >= SILENCE_DURATION_MS) {
            console.log('[VoiceAssistant] silence → auto-stop');
            void stopAndSubmit();
          }
        } else {
          silenceStartRef.current = null;
        }
      }, POLL_INTERVAL_MS);

      autoStopRef.current = setTimeout(() => void stopAndSubmit(), MAX_RECORDING_MS);
    } catch (e) {
      console.error('[VoiceAssistant] start error:', e);
      setMicState('error');
      setTimeout(() => setMicState('idle'), 3000);
    }
  }, [recorder, stopAndSubmit]);

  const toggleRecording = useCallback(async () => {
    if (micState === 'processing') return;
    if (micState === 'recording') { await stopAndSubmit(); return; }
    if (micState === 'error') { setMicState('idle'); return; }
    await startRecording();
  }, [micState, startRecording, stopAndSubmit]);

  return (
    <VoiceAssistantContext.Provider value={{ micState, metering, conversation, toggleRecording }}>
      {children}
    </VoiceAssistantContext.Provider>
  );
}

export function useVoiceAssistantContext() {
  const ctx = useContext(VoiceAssistantContext);
  if (!ctx) throw new Error('useVoiceAssistantContext must be used inside VoiceAssistantProvider');
  return ctx;
}
