import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/keycloak';
import { useLanguage } from '../lib/LanguageContext';

interface SignupProps {
  onSignupSuccess: () => void;
  onNavigateToLogin: () => void;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validatePassword(pwd: string): boolean {
  return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);
}

export default function Signup({ onSignupSuccess, onNavigateToLogin }: SignupProps) {
  const { t } = useLanguage();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = t('full_name') + ' required';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email';
    if (!validatePassword(password)) errors.password = t('password_hint');
    if (password !== confirmPassword) errors.confirmPassword = t('passwords_do_not_match');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid =
    name.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    validatePassword(password) &&
    password === confirmPassword;

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setServerError(null);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });

      if (res.status === 201) {
        // Auto-login after successful registration
        await login(email, password);
        onSignupSuccess();
        return;
      }

      const body = await res.json().catch(() => ({})) as { error?: string };
      if (res.status === 409 || body.error === 'email_conflict') {
        setFieldErrors({ email: t('email_conflict') });
      } else if (res.status === 422) {
        setServerError(t('registration_failed'));
      } else {
        setServerError(t('network_error'));
      }
    } catch {
      setServerError(t('network_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-surface flex flex-col px-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 pt-14 pb-8">
        <button
          onClick={onNavigateToLogin}
          aria-label="Back"
          className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <h1 className="font-headline font-extrabold text-2xl tracking-tight text-on-surface">
          {t('create_account')}
        </h1>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-5 flex-1">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
            {t('full_name')}
          </label>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Schmidt"
            className="w-full px-4 py-4 bg-surface-container rounded-xl border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary transition-all text-on-surface placeholder:text-on-surface-variant/50 outline-none"
          />
          {fieldErrors.name && <p className="text-xs text-red-500 pl-1">{fieldErrors.name}</p>}
        </div>

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
            placeholder="you@example.com"
            className="w-full px-4 py-4 bg-surface-container rounded-xl border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary transition-all text-on-surface placeholder:text-on-surface-variant/50 outline-none"
          />
          {fieldErrors.email && (
            <p className="text-xs text-red-500 pl-1">
              {fieldErrors.email}{' '}
              {fieldErrors.email === t('email_conflict') && (
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-primary font-semibold underline"
                >
                  {t('log_in_link')}
                </button>
              )}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
            {t('password')}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <p className={`text-xs pl-1 ${fieldErrors.password ? 'text-red-500' : 'text-on-surface-variant'}`}>
            {t('password_hint')}
          </p>
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
            {t('confirm_password')}
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••"
              className="w-full px-4 py-4 pr-12 bg-surface-container rounded-xl border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary transition-all text-on-surface placeholder:text-on-surface-variant/50 outline-none"
            />
            <button
              type="button"
              aria-label={showConfirm ? t('hide_password') : t('show_password')}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-xs text-red-500 pl-1">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* Server error */}
        {serverError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 text-center px-2"
          >
            {serverError}
          </motion.p>
        )}

        {/* Submit CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={isLoading || !isFormValid}
          className="w-full py-4 bg-primary text-white font-headline font-bold text-base rounded-2xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity mt-2"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            t('create_account')
          )}
        </motion.button>

        {/* Log In link */}
        <p className="text-center text-sm text-on-surface-variant pb-10">
          {t('already_have_account')}{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-primary font-semibold"
          >
            {t('log_in_link')}
          </button>
        </p>
      </div>
    </motion.main>
  );
}
