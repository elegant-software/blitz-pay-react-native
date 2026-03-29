import { Search, ChevronRight, ArrowLeft, Landmark, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';

interface TrueLayerPaymentProps {
  onSuccess: () => void;
  onCancel: () => void;
  amount: string;
}

type PaymentStep = 'bank-selection' | 'redirecting' | 'success';

export default function TrueLayerPayment({ onSuccess, onCancel, amount }: TrueLayerPaymentProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<PaymentStep>('bank-selection');
  const [searchQuery, setSearchQuery] = useState('');

  const banks = [
    { id: 'monzo', name: 'Monzo', iconColor: 'bg-[#ff4b4b]' },
    { id: 'revolut', name: 'Revolut', iconColor: 'bg-[#0075eb]' },
    { id: 'starling', name: 'Starling Bank', iconColor: 'bg-[#6935d3]' },
    { id: 'barclays', name: 'Barclays', iconColor: 'bg-[#00aeef]' },
    { id: 'hsbc', name: 'HSBC', iconColor: 'bg-[#db0011]' },
    { id: 'lloyds', name: 'Lloyds Bank', iconColor: 'bg-[#006a4d]' },
    { id: 'natwest', name: 'NatWest', iconColor: 'bg-[#42145f]' },
    { id: 'santander', name: 'Santander', iconColor: 'bg-[#ec0000]' },
  ];

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBankSelect = () => {
    setStep('redirecting');
    setTimeout(() => {
      setStep('success');
    }, 3000);
  };

  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        onSuccess();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, onSuccess]);

  return (
    <div className="fixed inset-0 z-[110] bg-surface flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-surface/80 backdrop-blur-xl border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              TrueLayer Secure
            </span>
            <span className="font-headline font-bold text-lg text-on-surface">{t('direct_bank_pay')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant/40">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="text-xs font-bold">{t('encrypted')}</span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {step === 'bank-selection' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col px-6 pt-8"
          >
            <div className="mb-8">
              <h2 className="font-headline font-extrabold text-2xl mb-2 text-on-surface">{t('select_bank')}</h2>
              <p className="text-on-surface-variant/60 text-sm">
                {t('choose_bank_msg', { amount })}
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
              <input
                type="text"
                placeholder={t('search_bank')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-surface-container rounded-xl border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all text-on-surface placeholder:text-on-surface-variant/20"
              />
            </div>

            {/* Bank List */}
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3 pb-8">
              {filteredBanks.map((bank) => (
                <motion.button
                  key={bank.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBankSelect}
                  className="w-full flex items-center justify-between p-4 bg-surface-container rounded-xl shadow-sm hover:bg-surface-container-high transition-all border border-outline-variant"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${bank.iconColor} flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
                      {bank.name[0]}
                    </div>
                    <span className="font-bold text-on-surface">{bank.name}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-on-surface-variant/20" />
                </motion.button>
              ))}
            </div>

            {/* Footer Info */}
            <div className="py-6 border-t border-outline-variant flex flex-col items-center gap-2">
              <p className="text-[10px] text-on-surface-variant/40 text-center">
                {t('truelayer_terms')}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">{t('powered_by')}</span>
                <span className="text-[10px] font-black italic text-primary">TrueLayer</span>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'redirecting' && (
          <motion.div
            key="redirecting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-8 text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20"></div>
              <div className="relative w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            </div>
            <h2 className="font-headline font-extrabold text-2xl mb-4 text-on-surface">{t('redirecting_bank')}</h2>
            <p className="text-on-surface-variant/60 leading-relaxed">
              {t('redirecting_msg')}
            </p>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-8 text-center"
          >
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="font-headline font-extrabold text-3xl mb-4 text-on-surface">{t('payment_successful_truelayer')}</h2>
            <p className="text-on-surface-variant/60 mb-8">
              {t('payment_success_msg', { amount })}
            </p>
            <div className="w-full p-6 bg-surface-container rounded-xl text-left space-y-3 border border-outline-variant">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant/40">{t('reference')}</span>
                <span className="font-mono font-bold text-on-surface">TL-8829-XJ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant/40">{t('status')}</span>
                <span className="text-green-500 font-bold uppercase tracking-widest text-[10px]">{t('settled')}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
