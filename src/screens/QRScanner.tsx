import { ArrowLeft, Zap, Image, ShieldCheck, QrCode as QrIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';

interface QRScannerProps {
  onBack: () => void;
  onScan: () => void;
}

export default function QRScanner({ onBack, onScan }: QRScannerProps) {
  const { t } = useLanguage();
  const [isFlashOn, setIsFlashOn] = useState(false);

  // Simulate a scan after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onScan();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-black/40 backdrop-blur-md border-b border-white/10 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-fixed">
              {t('merchant_scan')}
            </span>
            <span className="font-headline font-bold text-lg text-white">{t('i_scan_you')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/60">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-xs font-bold">{t('secure')}</span>
        </div>
      </header>

      {/* Camera Viewport Simulation */}
      <main className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
        {/* Background Image Simulation */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1080&h=1920"
            alt="Camera View"
            className="w-full h-full object-cover opacity-60 grayscale-[30%]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        </div>

        {/* Scanning Frame */}
        <div className="relative z-10 w-72 h-72">
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-secondary-fixed rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-secondary-fixed rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-secondary-fixed rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-secondary-fixed rounded-br-2xl" />

          {/* Scanning Line Animation */}
          <motion.div
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-1 bg-secondary-fixed shadow-[0_0_20px_#9cf0ff] z-10"
          />

          {/* QR Icon Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <QrIcon className="w-48 h-48 text-white" />
          </div>
        </div>

        {/* Instructions */}
        <div className="relative z-10 mt-12 text-center px-8">
          <p className="text-white font-bold text-lg mb-2">{t('align_qr_code')}</p>
          <p className="text-white/60 text-sm max-w-[240px] mx-auto">
            {t('position_qr_msg')}
          </p>
        </div>

        {/* Camera Controls */}
        <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center gap-8">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsFlashOn(!isFlashOn)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              isFlashOn ? 'bg-secondary-fixed text-secondary-container' : 'bg-white/10 text-white'
            }`}
          >
            <Zap className={`w-6 h-6 ${isFlashOn ? 'fill-current' : ''}`} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center"
          >
            <Image className="w-6 h-6" />
          </motion.button>
        </div>
      </main>
    </div>
  );
}
