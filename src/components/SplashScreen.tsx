import { motion } from 'motion/react';
import { Zap } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 2.5, duration: 0.5 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[200] bg-surface flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/20 rounded-full blur-[120px]" />
      </div>

      {/* Blitz Icon Animation */}
      <div className="relative">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 260, 
            damping: 20,
            delay: 0.2 
          }}
          className="relative z-10"
        >
          <Zap className="w-24 h-24 text-primary fill-primary drop-shadow-[0_0_20px_rgba(0,240,255,0.8)]" />
        </motion.div>

        {/* Electric Rings */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeOut"
            }}
            className="absolute inset-0 border-2 border-primary/30 rounded-full"
          />
        ))}
      </div>

      {/* App Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center"
      >
        <h1 className="font-headline font-black italic text-5xl tracking-tighter text-white">
          Blitz<span className="text-primary">Pay</span>
        </h1>
        <p className="text-primary/60 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">
          {t('splash_tagline')}
        </p>
      </motion.div>

      {/* Loading Bar */}
      <div className="absolute bottom-20 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '0%' }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="w-full h-full bg-primary shadow-[0_0_10px_#00F0FF]"
        />
      </div>
    </motion.div>
  );
}
