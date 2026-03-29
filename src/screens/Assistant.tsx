import { MicOff, Mic, AudioLines, Keyboard } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';

export default function Assistant() {
  const { t } = useLanguage();
  const [isMuted, setIsMuted] = useState(true);

  return (
    <main className="flex-1 relative flex flex-col justify-end overflow-hidden min-h-[calc(100vh-80px)] pb-32">
      {/* Subtle Light Backdrop */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/5 to-surface"></div>

      {/* AI Interaction Interface */}
      <div className="relative z-20 px-8 pb-8 flex flex-col gap-8">
        {/* Transcription Bubble with Avatar */}
        <div className="flex gap-4 items-start max-w-[90%]">
          <motion.button
            drag
            dragMomentum={false}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMuted(!isMuted)}
            className="w-16 h-16 rounded-full border-2 border-primary flex-shrink-0 shadow-lg bg-white relative group z-30 touch-none"
          >
            <div className="w-full h-full rounded-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1080&h=1920"
                alt="AI Assistant"
                className="w-full h-full object-cover object-top"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Mute/Unmute Icon Badge */}
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: isMuted ? 0 : Infinity, duration: 2 }}
              className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 ${isMuted ? 'bg-red-500' : 'bg-green-500'}`}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-white" />}
            </motion.div>

            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
              {isMuted ? <Mic className="w-6 h-6 text-white" /> : <AudioLines className="w-6 h-6 text-white" />}
            </div>
            
            {/* Pulsing Ring (Only when not muted) */}
            {!isMuted && (
              <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20" />
            )}
          </motion.button>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl rounded-tl-none shadow-xl border-l-4 border-primary"
          >
            <p className="font-headline font-bold text-on-surface text-lg leading-relaxed">
              {t('ai_assistant_msg')}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-on-surface-variant/60 font-sans text-[10px] uppercase tracking-widest font-semibold">
                {t('live_transcription')}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,194,255,0.4)]"></span>
            </div>
          </motion.div>
        </div>

        {/* Contextual Product Card */}
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
            <h3 className="font-headline font-bold text-lg text-primary">
              Acoustic Pro Max
            </h3>
            <p className="text-sm text-on-surface-variant mb-2">Gen 2 Edition • Titanium Grey</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-full font-bold uppercase tracking-wider border border-primary/20">
                TOP CHOICE
              </span>
              <span className="text-sm font-bold text-on-surface">
                $349.00
              </span>
            </div>
          </div>
        </motion.div>
      </div>

    </main>
  );
}
