import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Gift, Sparkles, Trophy, ArrowRight, Smartphone } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface ShakeRewardProps {
  onComplete: () => void;
}

export default function ShakeReward({ onComplete }: ShakeRewardProps) {
  const { t } = useLanguage();
  const [isShaking, setIsShaking] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);

  // Simulate shake detection
  const handleShake = () => {
    if (isRevealed) return;
    
    setIsShaking(true);
    setShakeCount(prev => prev + 1);
    
    setTimeout(() => {
      setIsShaking(false);
      if (shakeCount >= 2) {
        setIsRevealed(true);
      }
    }, 500);
  };

  // Real shake detection (if supported)
  useEffect(() => {
    let lastX: number, lastY: number, lastZ: number;
    let threshold = 15;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const { x, y, z } = acc;
      if (lastX !== undefined) {
        const deltaX = Math.abs(x! - lastX);
        const deltaY = Math.abs(y! - lastY);
        const deltaZ = Math.abs(z! - lastZ);

        if (deltaX + deltaY + deltaZ > threshold) {
          handleShake();
        }
      }

      lastX = x!;
      lastY = y!;
      lastZ = z!;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [shakeCount, isRevealed]);

  return (
    <div className="fixed inset-0 z-[200] bg-surface flex flex-col items-center justify-center p-8 text-center overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <motion.div
            key="shake-instruction"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="mb-8 relative">
              <motion.div
                animate={isShaking ? {
                  rotate: [-10, 10, -10, 10, 0],
                  x: [-5, 5, -5, 5, 0],
                } : {}}
                transition={{ duration: 0.3, repeat: isShaking ? Infinity : 0 }}
                className="w-32 h-32 bg-primary/10 rounded-[2.5rem] flex items-center justify-center shadow-md border border-primary/20"
              >
                <Gift className="w-16 h-16 text-primary" />
              </motion.div>
              
              {/* Progress Dots */}
              <div className="flex gap-2 justify-center mt-6">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      shakeCount > i ? 'bg-primary shadow-sm' : 'bg-surface-container-highest'
                    }`} 
                  />
                ))}
              </div>
            </div>

            <h2 className="font-headline font-extrabold text-3xl text-on-surface mb-4">
              {t('shake_reward')}
            </h2>
            <p className="text-on-surface-variant text-lg mb-12 max-w-[240px]">
              {t('shake_msg')}
            </p>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleShake}
              className="flex items-center gap-3 px-8 py-4 bg-white rounded-full text-on-surface font-bold border border-outline-variant shadow-sm hover:bg-surface-container transition-colors"
            >
              <Smartphone className="w-5 h-5 text-primary" />
              {t('simulate_shake')}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="reward-reveal"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="mb-8 relative">
              <motion.div
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="w-40 h-40 bg-primary rounded-full flex items-center justify-center shadow-xl"
              >
                <Trophy className="w-20 h-20 text-white" />
              </motion.div>
              
              {/* Particle Effects */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    scale: [0, 1, 0], 
                    x: Math.cos(i * 30 * Math.PI / 180) * 120,
                    y: Math.sin(i * 30 * Math.PI / 180) * 120
                  }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full"
                />
              ))}
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="font-headline font-extrabold text-4xl text-on-surface mb-2 tracking-tight">
                {t('points_earned', { amount: '250' })}
              </h2>
              <p className="text-primary font-bold tracking-widest uppercase text-sm mb-8">
                {t('reward_unlocked')}
              </p>
              <p className="text-on-surface-variant text-lg mb-12 max-w-[280px]">
                {t('reward_msg')}
              </p>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onComplete}
                className="w-full h-16 rounded-full bg-primary text-white font-headline font-bold text-lg flex items-center justify-center gap-3 shadow-lg"
              >
                {t('continue_to_vault')}
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sparkles Overlay */}
      {isRevealed && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: [0, 1, 0], y: '-10%' }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                repeat: Infinity, 
                delay: Math.random() * 2 
              }}
              className="absolute"
              style={{ left: `${Math.random() * 100}%` }}
            >
              <Sparkles className="w-4 h-4 text-primary/40" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
