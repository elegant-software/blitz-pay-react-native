import { 
  User, 
  Lock, 
  CreditCard, 
  Bell, 
  ChevronRight, 
  LogOut, 
  Shield, 
  Smartphone,
  CheckCircle2,
  Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/keycloak';

export default function Account() {
  const { language, setLanguage, t } = useLanguage();
  const { logout } = useAuth();
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [defaultMethod, setDefaultMethod] = useState('Monzo Bank •••• 4291');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);

  const paymentMethods = [
    'Monzo Bank •••• 4291',
    'Revolut •••• 8820',
    'Barclays •••• 1105',
    'BlitzPay Balance'
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' }
  ];

  const SettingItem = ({ icon: Icon, label, value, onClick, color = "text-on-surface-variant/60" }: any) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-outline-variant hover:border-primary/20 transition-all mb-3 group shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="text-left">
          <p className="font-bold text-on-surface group-hover:text-primary transition-colors">{label}</p>
          {value && <p className="text-xs text-on-surface-variant">{value}</p>}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-on-surface-variant/20 group-hover:text-primary/40 transition-colors" />
    </motion.button>
  );

  const ToggleItem = ({ icon: Icon, label, description, enabled, onToggle }: any) => (
    <div className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-outline-variant mb-3 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
          <Icon className="w-5 h-5 text-on-surface-variant/60" />
        </div>
        <div className="text-left">
          <p className="font-bold text-on-surface">{label}</p>
          <p className="text-xs text-on-surface-variant">{description}</p>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-all duration-300 relative ${enabled ? 'bg-primary' : 'bg-surface-container-highest'}`}
      >
        <motion.div 
          animate={{ x: enabled ? 24 : 4 }}
          className={`absolute top-1 w-4 h-4 rounded-full shadow-sm transition-colors ${enabled ? 'bg-white' : 'bg-on-surface-variant/40'}`} 
        />
      </button>
    </div>
  );

  return (
    <main className="px-6 pt-8 pb-32 max-w-lg mx-auto min-h-screen bg-surface">
      {/* Profile Header */}
      <section className="flex flex-col items-center mb-10 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200"
              alt="User Profile"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:scale-110 transition-transform">
            <User className="w-4 h-4" />
          </button>
        </div>
        <h1 className="font-headline font-extrabold text-2xl mt-4 text-on-surface tracking-tight">Sarah Jenkins</h1>
        <p className="text-on-surface-variant text-sm font-mono uppercase tracking-wider">sarah.j@blitzpay.com</p>
      </section>

      {/* Security Section */}
      <div className="mb-8">
        <h2 className="font-headline font-bold text-sm uppercase tracking-[0.2em] text-secondary mb-4 px-2">{t('security')}</h2>
        <SettingItem 
          icon={Lock} 
          label="Change PIN" 
          value="Last changed 3 months ago"
          onClick={() => setShowPinModal(true)}
          color="text-primary"
        />
        <ToggleItem 
          icon={Shield} 
          label="Biometric Login" 
          description="Use FaceID or Fingerprint"
          enabled={biometricsEnabled}
          onToggle={() => setBiometricsEnabled(!biometricsEnabled)}
        />
      </div>

      {/* Payments Section */}
      <div className="mb-8">
        <h2 className="font-headline font-bold text-sm uppercase tracking-[0.2em] text-secondary mb-4 px-2">Payments</h2>
        <SettingItem 
          icon={CreditCard} 
          label="Default Payment Method" 
          value={defaultMethod}
          onClick={() => setShowPaymentModal(true)}
          color="text-primary"
        />
      </div>

      {/* Preferences Section */}
      <div className="mb-8">
        <h2 className="font-headline font-bold text-sm uppercase tracking-[0.2em] text-secondary mb-4 px-2">{t('settings')}</h2>
        <ToggleItem 
          icon={Bell} 
          label={t('notifications')} 
          description="Alerts for upcoming payments"
          enabled={remindersEnabled}
          onToggle={() => setRemindersEnabled(!remindersEnabled)}
        />
        <SettingItem 
          icon={Languages} 
          label={t('language')} 
          value={languages.find(l => l.code === language)?.name}
          onClick={() => setShowLanguageModal(true)}
          color="text-primary"
        />
        <SettingItem 
          icon={Smartphone} 
          label="App Appearance" 
          value="Refined Light (System)"
        />
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 p-4 text-destructive font-bold hover:bg-destructive/5 rounded-2xl transition-all border border-outline-variant"
      >
        <LogOut className="w-5 h-5" />
        {t('logout')}
      </button>

      {/* PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-center border border-outline-variant"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-sm">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-headline font-extrabold text-2xl mb-2 text-on-surface">Change PIN</h3>
              <p className="text-on-surface-variant text-sm mb-8">
                Enter your new 6-digit security PIN to update your account access.
              </p>
              
              <div className="flex justify-center gap-3 mb-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="w-10 h-12 bg-surface-container rounded-lg border-2 border-outline-variant flex items-center justify-center focus-within:border-primary transition-colors">
                    <div className="w-2 h-2 rounded-full bg-on-surface-variant/20" />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-4 font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Modal */}
      <AnimatePresence>
        {showLanguageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-lg bg-white rounded-t-[2.5rem] p-8 shadow-2xl border-t border-outline-variant"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-headline font-extrabold text-2xl text-on-surface">{t('language')}</h3>
                <button onClick={() => setShowLanguageModal(false)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                  <ChevronRight className="w-6 h-6 rotate-90 text-on-surface-variant/40" />
                </button>
              </div>
              <div className="space-y-3">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code as any);
                      setShowLanguageModal(false);
                    }}
                    className={`w-full p-5 rounded-2xl flex items-center justify-between border-2 transition-all duration-300 ${
                      language === l.code 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-outline-variant bg-white hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${language === l.code ? 'bg-primary/10' : 'bg-surface-container'}`}>
                        <Languages className={`w-5 h-5 ${language === l.code ? 'text-primary' : 'text-on-surface-variant/40'}`} />
                      </div>
                      <span className={`font-bold ${language === l.code ? 'text-primary' : 'text-on-surface'}`}>{l.name}</span>
                    </div>
                    {language === l.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Method Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-lg bg-white rounded-t-[2.5rem] p-8 shadow-2xl border-t border-outline-variant"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-headline font-extrabold text-2xl text-on-surface">Select Default</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                  <ChevronRight className="w-6 h-6 rotate-90 text-on-surface-variant/40" />
                </button>
              </div>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method}
                    onClick={() => {
                      setDefaultMethod(method);
                      setShowPaymentModal(false);
                    }}
                    className={`w-full p-5 rounded-2xl flex items-center justify-between border-2 transition-all duration-300 ${
                      defaultMethod === method 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-outline-variant bg-white hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${defaultMethod === method ? 'bg-primary/10' : 'bg-surface-container'}`}>
                        <CreditCard className={`w-5 h-5 ${defaultMethod === method ? 'text-primary' : 'text-on-surface-variant/40'}`} />
                      </div>
                      <span className={`font-bold ${defaultMethod === method ? 'text-primary' : 'text-on-surface'}`}>{method}</span>
                    </div>
                    {defaultMethod === method && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
