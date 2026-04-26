import { useCallback, useRef, useState } from 'react';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import * as Speech from 'expo-speech';
import { submitVoiceQuery } from '../lib/api/voiceApi';

export type MicState = 'idle' | 'recording' | 'processing' | 'speaking' | 'error';

export interface UseVoiceAssistantReturn {
  micState: MicState;
  transcript: string | null;
  aiResponse: string | null;
  metering: number;
  startRecording: () => Promise<void>;
  stopAndSubmit: () => Promise<void>;
  reset: () => void;
}

const SILENCE_THRESHOLD_DB = -50;
const SILENCE_DURATION_MS = 1500;
const INITIAL_GRACE_MS = 2000;
const POLL_INTERVAL_MS = 200;
const MAX_RECORDING_MS = 60_000;

export function useVoiceAssistant(): UseVoiceAssistantReturn {
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });

  const [micState, setMicState] = useState<MicState>('idle');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [metering, setMetering] = useState<number>(-160);

  const micStateRef = useRef<MicState>('idle');
  micStateRef.current = micState;

  const silenceStartRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
  };

  const stopAndSubmit = useCallback(async () => {
    if (micStateRef.current !== 'recording') return;
    clearTimers();
    console.log('[useVoiceAssistant] stopping recorder');
    try { await recorder.stop(); } catch (e) {
      console.warn('[useVoiceAssistant] recorder.stop() swallowed:', e);
    }
    const uri = recorder.uri;
    console.log('[useVoiceAssistant] recording uri:', uri);
    if (!uri) { setMicState('idle'); return; }

    setMicState('processing');
    setMetering(-160);
    try {
      const result = await submitVoiceQuery(uri, 'audio/m4a');
      console.log('[useVoiceAssistant] result:', result);
      setTranscript(result.transcript || null);
      setAiResponse(result.response || null);

      const textToSpeak = result.response;
      if (textToSpeak) {
        setMicState('speaking');
        // Switch audio mode back to playback before speaking
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        await new Promise<void>((resolve) => {
          Speech.speak(textToSpeak, {
            language: result.language ?? 'de',
            onDone: resolve,
            onError: () => resolve(),
            onStopped: resolve,
          });
        });
      }
      setMicState('idle');
    } catch (e) {
      console.error('[useVoiceAssistant] submit error:', e);
      setMicState('error');
    }
  }, [recorder]);

  const startRecording = useCallback(async () => {
    console.log('[useVoiceAssistant] requesting mic permission');
    const { granted } = await requestRecordingPermissionsAsync();
    console.log('[useVoiceAssistant] mic permission granted:', granted);
    if (!granted) return;

    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingStartRef.current = Date.now();
      silenceStartRef.current = null;
      setMicState('recording');
      setTranscript(null);
      console.log('[useVoiceAssistant] recording started');

      // Silence detection polling
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
            console.log('[useVoiceAssistant] silence detected — auto-stopping');
            void stopAndSubmit();
          }
        } else {
          silenceStartRef.current = null;
        }
      }, POLL_INTERVAL_MS);

      // Hard cap
      autoStopRef.current = setTimeout(() => void stopAndSubmit(), MAX_RECORDING_MS);
    } catch (e) {
      console.error('[useVoiceAssistant] start recording error:', e);
      setMicState('error');
    }
  }, [recorder, stopAndSubmit]);

  const reset = useCallback(() => {
    clearTimers();
    Speech.stop();
    setMicState('idle');
    setTranscript(null);
    setAiResponse(null);
    setMetering(-160);
  }, []);

  return { micState, transcript, aiResponse, metering, startRecording, stopAndSubmit, reset };
}
