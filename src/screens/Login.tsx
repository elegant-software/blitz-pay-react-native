import { useState } from 'react';
import { Eye, EyeOff, ScanFace, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/keycloak';
import { keycloak } from '../lib/keycloak';
import { useLanguage } from '../lib/LanguageContext';

interface LoginProps {
  onLoginSuccess: () => void;
  onNavigateToSignup: () => void;
  sessionExpired?: boolean;
}

export default function Login({ onLoginSuccess, onNavigateToSignup, sessionExpired }: LoginProps) {
  const { t } = useLanguage();
  const { login, loginWithBiometric, isWebAuthnAvailable, biometricEnrolled } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      onLoginSuccess();
    } catch (e) {
      const key = e instanceof Error ? e.message : 'network_error';
      setError(t(key as Parameters<typeof t>[0]) ?? t('network_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    keycloak.login({ action: 'UPDATE_PASSWORD', loginHint: email || undefined } as Parameters<typeof keycloak.login>[0]);
  };

  const showBiometric = isWebAuthnAvailable && biometricEnrolled;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-surface flex flex-col px-6"
    >
      {/* Session expired banner */}
      {sessionExpired && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 px-4 py-3 bg-primary-container rounded-xl text-sm text-on-primary-container text-center"
        >
          {t('session_expired')}
        </motion.div>
      )}

      {/* Logo / Wordmark — top 40% */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[40vh]">
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg mb-2">
          <Zap className="w-8 h-8 text-white" fill="white" />
        </div>
        <h1 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface">BlitzPay</h1>
        <p className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">{t('splash_tagline')}</p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4 pb-12">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
            {t('email')}
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="you@example.com"
            className="w-full px-4 py-4 bg-surface-container rounded-xl border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary transition-all text-on-surface placeholder:text-on-surface-variant/50 outline-none"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
            {t('password')}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              className="w-full px-4 py-4 pr-12 bg-surface-container rounded-xl border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary transition-all text-on-surface placeholder:text-on-surface-variant/50 outline-none"
            />
            <button
              type="button"
              aria-label={showPassword ? t('hide_password') : t('show_password')}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div className="flex justify-end -mt-1">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-primary font-semibold"
          >
            {t('forgot_password')}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 text-center px-2"
          >
            {error}
          </motion.p>
        )}

        {/* Log In CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogin}
          disabled={isLoading || !email || !password}
          className="w-full py-4 bg-primary text-white font-headline font-bold text-base rounded-2xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            t('log_in')
          )}
        </motion.button>

        {/* Face ID */}
        {showBiometric && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={loginWithBiometric}
            className="w-full py-4 bg-surface-container text-on-surface font-semibold text-sm rounded-2xl border border-outline-variant flex items-center justify-center gap-2"
          >
            <ScanFace className="w-5 h-5 text-primary" />
            {t('face_id_login')}
          </motion.button>
        )}

        {/* Sign Up link */}
        <p className="text-center text-sm text-on-surface-variant">
          {t('no_account')}{' '}
          <button
            type="button"
            onClick={onNavigateToSignup}
            className="text-primary font-semibold"
          >
            {t('sign_up_link')}
          </button>
        </p>
      </div>
    </motion.main>
  );
}
