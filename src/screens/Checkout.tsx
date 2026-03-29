import { ReceiptText, Landmark, CreditCard, Wallet as WalletIcon, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import TrueLayerPayment from '../components/TrueLayerPayment';
import { useLanguage } from '../lib/LanguageContext';

interface CheckoutProps {
  onConfirm: () => void;
}

export default function Checkout({ onConfirm }: CheckoutProps) {
  const { t } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState('bank');
  const [showTrueLayer, setShowTrueLayer] = useState(false);

  const methods = [
    {
      id: 'bank',
      name: t('bank_account_direct'),
      desc: t('ach_transfer'),
      icon: Landmark,
    },
    {
      id: 'card',
      name: t('credit_debit_card'),
      desc: t('visa_mastercard'),
      icon: CreditCard,
    },
    {
      id: 'paypal',
      name: t('paypal'),
      desc: t('express_checkout'),
      icon: WalletIcon,
    },
  ];

  const handleConfirm = () => {
    if (selectedMethod === 'bank') {
      setShowTrueLayer(true);
    } else {
      onConfirm();
    }
  };

  return (
    <>
      <main className="px-6 pt-8 pb-48 max-w-lg mx-auto">
      {/* Editorial Header */}
      <section className="mb-12">
        <span className="font-headline font-bold text-[11px] uppercase tracking-[0.2em] text-primary mb-3 block">
          {t('secure_checkout')}
        </span>
        <h1 className="font-headline font-extrabold text-4xl leading-tight tracking-tight text-on-surface">
          Studio Alchemists
        </h1>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-on-surface-variant/60 font-medium">{t('total_amount')}</span>
          <span className="font-headline font-extrabold text-3xl text-primary">
            $1,240.00
          </span>
        </div>
      </section>

      {/* Invoice Breakdown Card */}
      <section className="mb-10 p-8 rounded-xl bg-surface-container shadow-sm border border-outline-variant">
        <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2 text-on-surface">
          <ReceiptText className="w-5 h-5 text-primary" />
          {t('invoice_details')}
        </h3>
        <div className="space-y-6">
          {[
            { name: 'Brand Identity', desc: 'Visual guidelines & Logo assets', price: '$850.00' },
            { name: 'UI/UX Kit', desc: 'Mobile app components', price: '$240.00' },
            { name: 'Support', desc: '3 Months Priority Support', price: '$150.00' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-on-surface">{item.name}</p>
                <p className="text-sm text-on-surface-variant/60">{item.desc}</p>
              </div>
              <span className="font-medium text-on-surface">{item.price}</span>
            </div>
          ))}
          <div className="pt-6 mt-6 border-t border-outline-variant flex justify-between items-center">
            <span className="font-headline font-bold text-lg text-on-surface">{t('total_due')}</span>
            <span className="font-headline font-extrabold text-2xl text-primary">
              $1,240.00
            </span>
          </div>
        </div>
      </section>

      {/* Payment Method Selection */}
      <section className="mb-12">
        <h3 className="font-headline font-bold text-lg mb-6 px-2 text-on-surface">
          {t('payment_method')}
        </h3>
        <div className="space-y-4">
          {methods.map((method) => {
            const Icon = method.icon;
            const isActive = selectedMethod === method.id;
            return (
              <motion.div
                key={method.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-5 rounded-[2rem] transition-all cursor-pointer flex items-center justify-between border ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-lg'
                    : 'bg-surface-container-low border-outline-variant hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isActive ? 'bg-white/20' : 'bg-surface-container-high'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-on-surface-variant/60'}`} />
                  </div>
                  <div>
                    <p className={`font-extrabold ${isActive ? 'text-white' : 'text-on-surface'}`}>
                      {method.name}
                    </p>
                    <p className={`text-xs ${isActive ? 'opacity-70' : 'text-on-surface-variant/60'}`}>
                      {method.desc}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isActive ? 'border-white bg-white' : 'border-outline-variant'
                  }`}
                >
                  {isActive && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Trust Badge */}
      <div className="flex flex-col items-center gap-4 mb-12 py-6 px-4 bg-primary/5 rounded-3xl border border-primary/10">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-primary" />
          {t('encrypted_transaction')}
        </div>
        <p className="text-center text-[11px] leading-relaxed text-on-surface-variant/60 max-w-xs font-medium">
          {t('secure_msg')}
        </p>
      </div>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-surface/80 backdrop-blur-xl px-6 pt-4 pb-8 flex flex-col items-center gap-4 border-t border-outline-variant shadow-lg z-50">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleConfirm}
          className="w-full h-16 rounded-full bg-primary text-white font-headline font-black text-lg flex items-center justify-center gap-3 shadow-lg"
        >
          {t('confirm_payment')}
          <ArrowRight className="w-6 h-6" />
        </motion.button>
        <p className="text-[10px] text-on-surface-variant/40 uppercase tracking-widest font-bold">
          {t('authorized_by')}
        </p>
      </div>
    </main>

    <AnimatePresence>
      {showTrueLayer && (
        <TrueLayerPayment
          amount="$1,240.00"
          onSuccess={() => {
            setShowTrueLayer(false);
            onConfirm();
          }}
          onCancel={() => setShowTrueLayer(false)}
        />
      )}
    </AnimatePresence>
  </>
);
}
