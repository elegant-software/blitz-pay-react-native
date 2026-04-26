import { MicOff, Mic, AudioLines, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/keycloak';

type MicState = 'idle' | 'recording' | 'processing' | 'error';

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://api-blitzpay-staging.elegantsoftware.de';

interface TranscriptResult {
  transcript: string;
  language?: string;
}

export default function Assistant() {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [micState, setMicState] = useState<MicState>('idle');
  const [transcriptResult, setTranscriptResult] = useState<TranscriptResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopAndSubmit = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    const mimeType = recorder.mimeType || 'audio/webm';
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];
    mediaRecorderRef.current = null;

    setMicState('processing');
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/v1/voice/query`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) throw new Error(`${response.status}`);

      const data = (await response.json()) as TranscriptResult;
      setTranscriptResult(
        data.transcript
          ? data
          : { transcript: t('voice_nothing_detected') },
      );
      setMicState('idle');
    } catch {
      setMicState('error');
    }
  }, [token, t]);

  const toggleMic = async () => {
    if (micState === 'processing') return;
    if (micState === 'error') {
      setMicState('idle');
      return;
    }
    if (micState === 'recording') {
      await stopAndSubmit();
      return;
    }

    // idle → start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setMicState('recording');
    } catch {
      setMicState('error');
    }
  };

  const isRecording = micState === 'recording';
  const isProcessing = micState === 'processing';
  const isError = micState === 'error';

  const micIcon = isRecording ? (
    <AudioLines className="w-3.5 h-3.5 text-white" />
  ) : (
    <MicOff className="w-3.5 h-3.5 text-white" />
  );

  const badgeBg = isRecording
    ? 'bg-green-500'
    : isError
    ? 'bg-red-600'
    : 'bg-red-500';

  return (
    <main className="flex-1 relative flex flex-col justify-end overflow-hidden min-h-[calc(100vh-80px)] pb-32">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/5 to-surface" />

      <div className="relative z-20 px-8 pb-8 flex flex-col gap-8">
        {/* Mic avatar + transcript bubble */}
        <div className="flex gap-4 items-start max-w-[90%]">
          <motion.button
            drag
            dragMomentum={false}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMic}
            disabled={isProcessing}
            className="w-16 h-16 rounded-full border-2 border-primary flex-shrink-0 shadow-lg bg-white relative group z-30 touch-none disabled:opacity-50"
          >
            <div className="w-full h-full rounded-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1080&h=1920"
                alt="AI Assistant"
                className="w-full h-full object-cover object-top"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* State badge */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: isRecording ? Infinity : 0, duration: 2 }}
              className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 ${badgeBg}`}
            >
              {micIcon}
            </motion.div>

            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
              {isRecording ? <Mic className="w-6 h-6 text-white" /> : <AudioLines className="w-6 h-6 text-white" />}
            </div>

            {isRecording && (
              <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20" />
            )}
          </motion.button>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl rounded-tl-none shadow-xl border-l-4 border-primary"
          >
            {isProcessing ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="font-headline font-bold text-on-surface text-lg">
                  {t('voice_processing')}
                </span>
              </div>
            ) : (
              <p className="font-headline font-bold text-on-surface text-lg leading-relaxed">
                {isError
                  ? t('voice_error_retry')
                  : transcriptResult?.transcript ?? t('ai_assistant_msg')}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-on-surface-variant/60 font-sans text-[10px] uppercase tracking-widest font-semibold">
                {isRecording ? t('voice_listening') : t('live_transcription')}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,194,255,0.4)] ${
                  isRecording ? 'bg-green-400 animate-pulse' : isProcessing ? 'bg-primary animate-pulse' : 'bg-primary'
                }`}
              />
            </div>
          </motion.div>
        </div>

        {/* Product card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-md text-on-surface p-6 rounded-xl flex gap-6 items-center shadow-lg border border-outline-variant transform transition-transform active:scale-95 duration-200"
        >
          <div className="w-24 h-24 bg-surface-container rounded-lg overflow-hidden flex-shrink-0 border border-outline-variant">
            <img
              alt="Product"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuArSdvVhJ4jHq1b60iTqeJI12zJoRQmuTzmZe_4ZkXUOy7JR8kwmFTksw1jxWpK6mGf2gCrjsQ7idKv5XOFoMHQTUe_jd6UCoZftTQcQVqTEp_w-oKI3VLburphZd39M0lhcdizFhhruTviRLNlZQDy3ej41SL220qaJCDuMbzvV8QE6MLDdPsNAR3cDrZeJ6EPzxu3DhCzx1mV5x64gaLqO-otuI1IpSj5f79PYASuvAXoCJYL2o16FQNQjk2NeDxZIYSohACgYs0o"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-headline font-bold text-lg text-primary">Acoustic Pro Max</h3>
            <p className="text-sm text-on-surface-variant mb-2">Gen 2 Edition • Titanium Grey</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-full font-bold uppercase tracking-wider border border-primary/20">
                TOP CHOICE
              </span>
              <span className="text-sm font-bold text-on-surface">$349.00</span>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
