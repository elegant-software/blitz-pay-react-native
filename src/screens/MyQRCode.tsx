import { ArrowLeft, Share2, Download, ShieldCheck, QrCode as QrIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';

interface MyQRCodeProps {
  onBack: () => void;
}

export default function MyQRCode({ onBack }: MyQRCodeProps) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-[110] bg-surface flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              {t('personal_id')}
            </span>
            <span className="font-headline font-bold text-lg">{t('you_scan_me')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant/60">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-xs font-bold">{t('secure')}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center pb-24">
        {/* Profile Info */}
        <div className="mb-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary-container shadow-xl mb-4">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150"
              alt="User Profile"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="font-headline font-extrabold text-2xl mb-1">Sarah Jenkins</h2>
          <p className="text-on-surface-variant text-sm font-mono tracking-widest uppercase">
            ID: BZ-992-XJ
          </p>
        </div>

        {/* QR Code Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative p-8 bg-white rounded-3xl shadow-[0_20px_60px_rgba(7,25,65,0.12)] border border-outline-variant/10 mb-12"
        >
          <div className="w-64 h-64 bg-surface-container-low rounded-xl flex items-center justify-center relative overflow-hidden">
            <QrIcon className="w-56 h-56 text-on-surface opacity-90" />
            
            {/* Scanning Line Animation */}
            <motion.div
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-0.5 bg-secondary shadow-[0_0_10px_#006875] z-10"
            />
          </div>
          
          {/* Corner Accents */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-secondary rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-secondary rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-secondary rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-secondary rounded-br-lg" />
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-4 w-full max-w-xs">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex-1 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center gap-2 font-bold text-on-surface"
          >
            <Download className="w-5 h-5" />
            {t('save')}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex-1 h-14 rounded-2xl bg-primary-container text-secondary-container flex items-center justify-center gap-2 font-bold"
          >
            <Share2 className="w-5 h-5" />
            {t('share')}
          </motion.button>
        </div>

        <p className="mt-12 text-xs text-on-surface-variant/60 leading-relaxed max-w-xs">
          {t('dynamic_qr_msg')}
        </p>
      </main>
    </div>
  );
}
