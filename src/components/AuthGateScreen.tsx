import React, { useState } from 'react';
import { Eye, EyeOff, Globe, GraduationCap, Lock, LogIn, Mail, Sparkles, UserPlus } from 'lucide-react';
import {
  formatFirebaseAuthError,
  registerWithEmail,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
} from '../firebase';
import { LanguageMode } from '../types';

export function AuthGateScreen({
  language,
  onChangeLanguage,
}: {
  language: LanguageMode;
  onChangeLanguage: (lang: LanguageMode) => void;
}) {
  const isHindi = language === 'hi';
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err, isHindi));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg(isHindi ? 'कृपया सही ईमेल पता लिखें।' : 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg(
        isHindi ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.'
      );
      return;
    }
    if (mode === 'signup' && displayName.trim().length < 2) {
      setErrorMsg(isHindi ? 'कृपया अपना पूरा नाम लिखें।' : 'Please enter your name to create your profile.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await registerWithEmail(displayName, trimmedEmail, password);
      } else {
        await signInWithEmail(trimmedEmail, password);
      }
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err, isHindi));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg(
        isHindi
          ? 'पासवर्ड रीसेट लिंक भेजने के लिए ऊपर अपना ईमेल दर्ज करें।'
          : 'Enter your email address above first to receive a password reset link.'
      );
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(trimmedEmail);
      setInfoMsg(
        isHindi
          ? 'पासवर्ड रीसेट ईमेल भेज दिया गया है। अपना इनबॉक्स देखें।'
          : 'Password reset link sent to your email.'
      );
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err, isHindi));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050C24] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Smart Study Guardian
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHindi ? 'जारी रखने के लिए साइन इन या साइन अप करें' : 'Sign in or create a student profile to begin'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChangeLanguage(isHindi ? 'en' : 'hi')}
            className="min-h-[34px] px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-500" />
            <span>{isHindi ? 'EN' : 'हिन्दी'}</span>
          </button>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleGoogleLogin()}
          className="min-h-[46px] w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isHindi ? 'Google से साइन इन करें' : 'Continue with Google'}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {isHindi ? 'या ईमेल से' : 'or with email'}
          </span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#06102B]">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`min-h-[38px] rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 ${
              mode === 'signin'
                ? 'bg-white dark:bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isHindi ? 'साइन इन' : 'Sign In'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`min-h-[38px] rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'bg-white dark:bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isHindi ? 'नया खाता' : 'Sign Up'}</span>
          </button>
        </div>

        <form onSubmit={(e) => void handleEmailSubmit(e)} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {isHindi ? 'छात्र का नाम' : 'Student Name'}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={isHindi ? 'अपना नाम लिखें' : 'Enter your name'}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {isHindi ? 'ईमेल पता' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="student@example.com"
                className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {isHindi ? 'पासवर्ड (कम से कम 6 अक्षर)' : 'Password (6+ characters)'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                className="w-full min-h-[44px] pl-10 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              {errorMsg}
            </p>
          )}
          {infoMsg && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
              {infoMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="min-h-[46px] w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-sm disabled:opacity-60"
          >
            {loading
              ? isHindi
                ? 'कृपया प्रतीक्षा करें...'
                : 'Please wait...'
              : mode === 'signup'
              ? isHindi
                ? 'खाता बनाएं और शुरू करें'
                : 'Create Account & Start Studying'
              : isHindi
              ? 'साइन इन करें'
              : 'Sign In to Dashboard'}
          </button>

          {mode === 'signin' && (
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleForgotPassword()}
              className="w-full text-center text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline pt-1"
            >
              {isHindi ? 'पासवर्ड भूल गए? रीसेट करें' : 'Forgot Password? Send Reset Link'}
            </button>
          )}
        </form>

        <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 leading-relaxed">
          {isHindi
            ? 'आपके सभी दिए गए मॉक टेस्ट, XP और अध्ययन प्रगति आपकी Firebase प्रोफ़ाइल में सुरक्षित सहेजे जाएंगे।'
            : 'All mock tests you take, XP, and syllabus progress are saved directly to your Firebase student profile.'}
        </p>
      </div>
    </div>
  );
}
