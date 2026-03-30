import { motion, useMotionValue } from 'motion/react';
import { Maximize2, Minimize2, GripVertical, MicOff, Mic, AudioLines } from 'lucide-react';
import { useState } from 'react';

interface FloatingAvatarProps {
  isVisible: boolean;
}

const DRAG_CONSTRAINTS = {
  top: -400,
  bottom: 400,
  left: -320,
  right: 320,
};

export default function FloatingAvatar({ isVisible }: FloatingAvatarProps) {
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [isLarge, setIsLarge] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  if (!isVisible) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.2}
      dragConstraints={DRAG_CONSTRAINTS}
      style={{ x: dragX, y: dragY }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-24 left-6 z-[100] touch-none"
    >
      <div className="relative group">
        {/* Avatar Container */}
        <motion.div
          onClick={() => !isLarge && setIsMuted(!isMuted)}
          animate={{
            width: isLarge ? 280 : 80,
            height: isLarge ? 380 : 80,
            borderRadius: isLarge ? '2rem' : '9999px',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative overflow-hidden border-2 border-primary shadow-lg bg-white cursor-grab active:cursor-grabbing"
        >
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1080&h=1920"
            alt="AI Assistant"
            className="w-full h-full object-cover object-top"
            referrerPolicy="no-referrer"
          />
          
          {/* Subtle Pulse Overlay */}
          <div className={`absolute inset-0 ${isMuted ? 'bg-primary/5' : 'bg-primary/10'} animate-pulse pointer-events-none`} />
          
          {/* Drag Handle Indicator (Visible on Hover) */}
          <div className="absolute top-1/2 left-1 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-on-surface-variant/20" />
          </div>

          {/* Pulsing Ring (Only when not muted and not large) */}
          {!isMuted && !isLarge && (
            <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20" />
          )}

          {/* Audio Lines Overlay (Only when not muted and not large) */}
          {!isMuted && !isLarge && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
              <AudioLines className="w-8 h-8 text-white" />
            </div>
          )}
        </motion.div>

        {/* Controls */}
        <div className="absolute -bottom-2 -right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLarge(!isLarge);
            }}
            className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-2 border-white"
          >
            {isLarge ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Status Indicator / Mute Badge */}
        {!isLarge && (
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: isMuted ? 0 : Infinity, duration: 2 }}
            className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 ${isMuted ? 'bg-red-500' : 'bg-green-500'}`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-white" />}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
