import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { BellRing, Check, Cloud, Download, Eye, EyeOff, Fingerprint, HelpCircle, KeyRound, Lock, LogIn, LogOut, Moon, RefreshCw, ShieldCheck, Sun, Trash2, Upload } from 'lucide-react';
import { STUDY_LEVEL_OPTIONS } from '../data/jeeCatalog';
import { PersistedAppState, Subject } from '../types';
import {
  clearWebBiometricCredentials,
  enrollWebBiometric,
  hasEnrolledWebBiometric,
  hasFallbackStudyPin,
  isPlatformBiometricAvailable,
  setFallbackStudyPin,
} from '../utils/biometricWebAuth';
import { maskApiKey } from '../utils/localStorageState';

export function SettingsTab({
  state,
  firebaseUser,
  syncStatus,
  onSignInGoogle,
  onSignOutGoogle,
  onSyncCloudNow,
  onLockAppNow,
  onUpdateSettings,
  onRestoreBackup,
  onClearAllData,
}: {
  state: PersistedAppState;
  firebaseUser: User | null;
  syncStatus: string | null;
  onSignInGoogle: () => Promise<void>;
  onSignOutGoogle: () => Promise<void>;
  onSyncCloudNow: () => Promise<void>;
  onLockAppNow: () => void;
  onUpdateSettings: (patch: Partial<PersistedAppState>) => void;
  onRestoreBackup: (json: string) => boolean;
  onClearAllData: () => void;
}) {
  const isHindi = state.language === 'hi';
  const [restoreText, setRestoreText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(state.customGeminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [keySavedToast, setKeySavedToast] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(() => hasEnrolledWebBiometric());
  const [hasPin, setHasPin] = useState(() => hasFallbackStudyPin());
  const [pinInput, setPinInput] = useState('');
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    setApiKeyInput(state.customGeminiApiKey || '');
  }, [state.customGeminiApiKey]);

  useEffect(() => {
    void isPlatformBiometricAvailable().then(setBiometricSupported);
  }, []);

  const requestNotificationsIfSupported = () => {
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default' &&
      typeof Notification.requestPermission === 'function'
    ) {
      try {
        Promise.resolve(Notification.requestPermission()).catch(() => {});
      } catch {
        // Ignore browser/iframe restrictions
      }
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-study-guardian-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage(isHindi ? 'बैकअप फ़ाइल डाउनलोड हो गई।' : 'Backup file downloaded.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-6">
        {/* 1. Language, 2. Light/Dark Theme, 3. Notifications, 4. Study Preferences */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isHindi ? 'ऐप और अध्ययन प्राथमिकताएं' : 'Settings & Study Preferences'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                {isHindi ? 'भाषा (Language)' : 'Language'}
              </p>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#06102B]">
                <button
                  onClick={() => onUpdateSettings({ language: 'en' })}
                  className={`min-h-[40px] rounded-lg text-xs font-semibold ${
                    state.language === 'en' ? 'bg-white dark:bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => onUpdateSettings({ language: 'hi' })}
                  className={`min-h-[40px] rounded-lg text-xs font-semibold ${
                    state.language === 'hi' ? 'bg-white dark:bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                {isHindi ? 'थीम (Theme)' : 'Light / Dark Theme'}
              </p>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#06102B]">
                <button
                  onClick={() => onUpdateSettings({ theme: 'dark' })}
                  className={`min-h-[40px] rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${
                    state.theme === 'dark' ? 'bg-cyan-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'डार्क' : 'Dark'}</span>
                </button>
                <button
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={`min-h-[40px] rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${
                    state.theme === 'light' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'लाइट' : 'Light'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isHindi ? 'सूचनाएं व टेस्ट सेटिंग्स' : 'Notifications & Study Preferences'}
            </p>
            <label className="flex items-center justify-between min-h-[44px] cursor-pointer">
              <span className="text-sm inline-flex items-center gap-2">
                <BellRing className="w-4 h-4 text-cyan-500" />
                <span>
                  {isHindi ? 'अध्ययन, डेली चैलेंज व ब्रेक सूचनाएं' : 'Study, Daily Challenge & Break Notifications'}
                </span>
              </span>
              <input
                type="checkbox"
                checked={state.notificationsEnabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (checked) requestNotificationsIfSupported();
                  onUpdateSettings({ notificationsEnabled: checked });
                }}
                className="h-5 w-5 accent-cyan-500"
              />
            </label>
            <label className="flex items-center justify-between min-h-[44px] cursor-pointer">
              <span className="text-sm">
                {isHindi ? 'प्रतियोगी परीक्षा में नेगेटिव मार्किंग (-1)' : 'Competitive Mock Test Negative Marking (-1)'}
              </span>
              <input
                type="checkbox"
                checked={state.negativeMarkingEnabled}
                onChange={(e) => onUpdateSettings({ negativeMarkingEnabled: e.target.checked })}
                className="h-5 w-5 accent-cyan-500"
              />
            </label>
            <div className="flex items-center justify-between min-h-[44px]">
              <span className="text-sm">
                {isHindi ? 'दैनिक अध्ययन लक्ष्य (मिनट)' : 'Daily Study Goal (minutes)'}
              </span>
              <select
                value={state.dailyGoalMinutes}
                onChange={(e) => onUpdateSettings({ dailyGoalMinutes: Number(e.target.value) })}
                className="min-h-[38px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-xs font-semibold"
              >
                <option value={180}>3 Hours (180m)</option>
                <option value={240}>4 Hours (240m)</option>
                <option value={360}>6 Hours (360m)</option>
                <option value={480}>8 Hours (480m)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5. AI Tutor Preferences */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isHindi ? 'AI ट्यूटर प्राथमिकताएं' : 'AI Tutor Preferences'}
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                {isHindi ? 'चुनी हुई कक्षा / परीक्षा (पूरे ऐप के लिए)' : 'Active Class Board / Exam (Adapts Entire App)'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STUDY_LEVEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() =>
                      onUpdateSettings({
                        hasSelectedClass: true,
                        selectedClassTrack: opt.id,
                        aiDefaultLevel: opt.id,
                        negativeMarkingEnabled: !opt.id.startsWith('CLASS_'),
                      })
                    }
                    className={`min-h-[38px] px-2.5 rounded-xl text-xs font-semibold border whitespace-nowrap truncate ${
                      state.selectedClassTrack === opt.id
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isHindi ? opt.hi : opt.en}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                {isHindi ? 'डिफ़ॉल्ट विषय' : 'Default Subject'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['PHYSICS', 'CHEMISTRY', 'MATHEMATICS'] as Subject[]).map((subj) => (
                  <button
                    key={subj}
                    onClick={() => onUpdateSettings({ aiDefaultSubject: subj })}
                    className={`min-h-[40px] rounded-xl text-xs font-semibold border ${
                      state.aiDefaultSubject === subj
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {subj === 'PHYSICS' ? 'Physics' : subj === 'CHEMISTRY' ? 'Chemistry' : 'Mathematics'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gemini API Key Settings (Bring Your Own Key) */}
        <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/5 dark:bg-[#0A173B] p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white inline-flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-500" />
                <span>{isHindi ? 'कस्टम Gemini API Key' : 'Custom AI API Key'}</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {isHindi
                  ? 'अपनी व्यक्तिगत Gemini API Key सुरक्षित रूप से सहेजें। यह केवल आपके डिवाइस पर मास्क रूप में रहती है और AI गुरु व मॉक टेस्ट के लिए उपयोग होती है।'
                  : 'Enter your personal Gemini API key. It stays locally on your device in masked format and powers AI Guru & Mock Test generation.'}
              </p>
            </div>
            {state.customGeminiApiKey && (
              <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {maskApiKey(state.customGeminiApiKey)}
              </span>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUpdateSettings({ customGeminiApiKey: apiKeyInput.trim() });
              setKeySavedToast(true);
              setTimeout(() => setKeySavedToast(false), 2000);
            }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={isHindi ? 'अपनी Gemini API Key यहाँ पेस्ट करें (AIza...)' : 'Paste your Gemini API key (AIza...)'}
                  className="w-full min-h-[44px] pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-xs font-mono text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="submit"
                className="min-h-[44px] px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                {keySavedToast ? <Check className="w-4 h-4" /> : null}
                <span>
                  {keySavedToast
                    ? isHindi
                      ? 'सहेजा गया'
                      : 'Saved'
                    : isHindi
                    ? 'की सेव करें'
                    : 'Save Key'}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {state.customGeminiApiKey
                  ? isHindi
                    ? `सक्रिय कस्टम Key (${maskApiKey(state.customGeminiApiKey)})`
                    : `Custom API key active (${maskApiKey(state.customGeminiApiKey)})`
                  : isHindi
                  ? 'कोई कस्टम API Key सेट नहीं (सर्वर की उपयोग)'
                  : 'No custom key set (using app server default)'}
              </span>
              {state.customGeminiApiKey && (
                <button
                  type="button"
                  onClick={() => {
                    setApiKeyInput('');
                    onUpdateSettings({ customGeminiApiKey: '' });
                  }}
                  className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                >
                  {isHindi ? 'की हटाएं' : 'Clear Key'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Right Column: Cloud Sync, Fingerprint Lock, Backup, Privacy Policy & Help */}
      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white inline-flex items-center gap-2">
                <Cloud className="w-4 h-4 text-cyan-500" />
                <span>{isHindi ? 'Firebase लॉगिन व क्लाउड सिंक' : 'Firebase Auth & Cloud Sync'}</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {firebaseUser
                  ? isHindi
                    ? `साइन इन: ${firebaseUser.displayName || firebaseUser.email}`
                    : `Signed in as ${firebaseUser.displayName || firebaseUser.email}`
                  : isHindi
                  ? 'प्रगति, XP और स्ट्रीक को क्लाउड में सहेजने के लिए Google से साइन इन करें।'
                  : 'Sign in with Google to sync your progress, XP, and study streak to Firebase.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {firebaseUser ? (
              <>
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={async () => {
                    setAuthLoading(true);
                    try {
                      await onSyncCloudNow();
                    } finally {
                      setAuthLoading(false);
                    }
                  }}
                  className="min-h-[42px] px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'अभी सिंक करें' : 'Sync Now'}</span>
                </button>
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={async () => {
                    setAuthLoading(true);
                    try {
                      await onSignOutGoogle();
                    } finally {
                      setAuthLoading(false);
                    }
                  }}
                  className="min-h-[42px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'साइन आउट' : 'Sign Out'}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={authLoading}
                onClick={async () => {
                  setAuthLoading(true);
                  try {
                    await onSignInGoogle();
                  } finally {
                    setAuthLoading(false);
                  }
                }}
                className="min-h-[44px] px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{authLoading ? (isHindi ? 'जुड़ रहा है...' : 'Signing in...') : isHindi ? 'Google से साइन इन करें' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
          {syncStatus && <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400">{syncStatus}</p>}

          {firebaseUser && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {isHindi
                    ? `प्रोफ़ाइल में सहेजे गए टेस्ट (${state.testHistory.length})`
                    : `Saved Tests in Profile (${state.testHistory.length})`}
                </p>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {isHindi ? 'क्लाउड सिंक्ड' : 'Cloud Synced'}
                </span>
              </div>
              {state.testHistory.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHindi
                    ? 'अभी तक कोई मॉक टेस्ट सबमिट नहीं हुआ है। आपका पहला टेस्ट यहाँ स्वतः सहेजा जाएगा।'
                    : 'No mock tests taken yet. Completed tests automatically save to your Firebase profile.'}
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {state.testHistory.slice(0, 8).map((test) => (
                    <div
                      key={test.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#06102B] px-3 py-2 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {test.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {test.subjectLabel} · {new Date(test.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                          {test.score}/{test.maxScore}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                          {Math.round(test.accuracyPercent)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white inline-flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-500" />
                <span>{isHindi ? 'फिंगरप्रिंट व ऐप लॉक' : 'Fingerprint & App Lock'}</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {biometricSupported
                  ? isHindi
                    ? 'डिवाइस फिंगरप्रिंट / बायोमेट्रिक से अपने अध्ययन डैशबोर्ड को सुरक्षित करें।'
                    : 'Protect your study notes and analytics with device fingerprint or a backup Study PIN.'
                  : isHindi
                  ? 'बायोमेट्रिक या 4-अंकीय Study PIN से अपने डैशबोर्ड को लॉक करें।'
                  : 'Secure your study dashboard with device biometric or a 4-digit fallback Study PIN.'}
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="Enable Fingerprint App Lock"
              checked={Boolean(state.biometricLockEnabled)}
              onChange={async (e) => {
                const enabled = e.target.checked;
                if (!enabled) {
                  onUpdateSettings({ biometricLockEnabled: false });
                  setSecurityMessage(isHindi ? 'ऐप लॉक बंद कर दिया गया।' : 'App lock disabled.');
                  return;
                }
                if (!biometricEnrolled && !hasPin) {
                  const res = await enrollWebBiometric(firebaseUser?.email || 'student@studyguardian.ai');
                  setBiometricEnrolled(res.ok || hasEnrolledWebBiometric());
                  if (res.ok) {
                    onUpdateSettings({ biometricLockEnabled: true });
                    setSecurityMessage(res.message);
                  } else {
                    setSecurityMessage(res.message);
                  }
                } else {
                  onUpdateSettings({ biometricLockEnabled: true });
                  setSecurityMessage(isHindi ? 'ऐप लॉक सक्रिय हो गया।' : 'App lock enabled.');
                }
              }}
              className="h-5 w-5 accent-cyan-500 mt-1"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                const res = await enrollWebBiometric(firebaseUser?.email || 'student@studyguardian.ai');
                const enrolled = res.ok || hasEnrolledWebBiometric();
                setBiometricEnrolled(enrolled);
                if (enrolled) {
                  onUpdateSettings({ biometricLockEnabled: true });
                }
                setSecurityMessage(res.message);
              }}
              className="min-h-[40px] px-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>
                {biometricEnrolled
                  ? isHindi
                    ? 'फिंगरप्रिंट पंजीकृत'
                    : 'Fingerprint Enrolled'
                  : isHindi
                  ? 'फिंगरप्रिंट सेट करें'
                  : 'Enroll Fingerprint'}
              </span>
            </button>
            {(biometricEnrolled || hasPin) && state.biometricLockEnabled && (
              <button
                type="button"
                onClick={onLockAppNow}
                className="min-h-[40px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isHindi ? 'अभी लॉक करें' : 'Lock Now'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={isHindi ? '4-6 अंकों का PIN सेट करें' : 'Set 4-6 digit Study PIN'}
              className="flex-1 min-h-[40px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-xs font-mono"
            />
            <button
              type="button"
              disabled={pinInput.length < 4}
              onClick={() => {
                setFallbackStudyPin(pinInput);
                setHasPin(true);
                setPinInput('');
                onUpdateSettings({ biometricLockEnabled: true });
                setSecurityMessage(isHindi ? 'Study PIN सहेजा गया और लॉक सक्रिय हुआ।' : 'Study PIN saved & App Lock enabled.');
              }}
              className="min-h-[40px] px-3.5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs disabled:opacity-40"
            >
              {isHindi ? 'PIN सेव करें' : 'Save PIN'}
            </button>
          </div>

          {(biometricEnrolled || hasPin) && (
            <button
              type="button"
              onClick={() => {
                clearWebBiometricCredentials();
                setBiometricEnrolled(false);
                setHasPin(false);
                onUpdateSettings({ biometricLockEnabled: false });
                setSecurityMessage(isHindi ? 'फिंगरप्रिंट और PIN हटाए गए।' : 'Fingerprint & Study PIN cleared.');
              }}
              className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline"
            >
              {isHindi ? 'बायोमेट्रिक / PIN रीसेट करें' : 'Clear Fingerprint & PIN'}
            </button>
          )}
          {securityMessage && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{securityMessage}</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isHindi ? 'बैकअप और रिस्टोर' : 'Backup and Restore'}
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportJson}
              className="min-h-[44px] px-4 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{isHindi ? 'बैकअप डाउनलोड करें' : 'Export Backup'}</span>
            </button>
            <button
              onClick={() => {
                onClearAllData();
                setStatusMessage(
                  isHindi ? 'सभी अध्ययन डेटा रीसेट कर दिया गया।' : 'Study progress reset to defaults.'
                );
              }}
              className="min-h-[44px] px-4 rounded-xl border border-red-400/60 text-red-600 dark:text-red-400 text-xs font-semibold inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isHindi ? 'डेटा साफ़ करें' : 'Reset Study Data'}</span>
            </button>
          </div>
          <div className="space-y-2">
            <textarea
              value={restoreText}
              onChange={(e) => setRestoreText(e.target.value)}
              rows={3}
              placeholder={
                isHindi ? 'अपना सहेजा गया बैकअप यहाँ पेस्ट करें...' : 'Paste your exported study backup here to restore...'
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-xs"
            />
            <button
              onClick={() => {
                const ok = onRestoreBackup(restoreText);
                setStatusMessage(
                  ok
                    ? isHindi
                      ? 'बैकअप सफलतापूर्वक रिस्टोर हो गया।'
                      : 'Backup restored successfully.'
                    : isHindi
                    ? 'अमान्य बैकअप फ़ाइल। कृपया सही बैकअप पेस्ट करें।'
                    : 'Invalid backup data. Please paste a valid exported backup.'
                );
                if (ok) setRestoreText('');
              }}
              disabled={!restoreText.trim()}
              className="min-h-[40px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isHindi ? 'बैकअप रिस्टोर करें' : 'Restore Backup'}</span>
            </button>
          </div>
          {statusMessage && <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400">{statusMessage}</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isHindi ? 'गोपनीयता और सहायता' : 'Privacy Policy & Support'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {isHindi
              ? 'आपकी अध्ययन प्रगति, नोट्स और सभी दिए गए मॉक टेस्ट सुरक्षित रूप से आपके Firebase छात्र खाते और इस डिवाइस पर सहेजे जाते हैं।'
              : 'Your notes, syllabus progress, and all completed mock test records are securely stored in your Firebase student profile and cached locally on your device.'}
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="min-h-[40px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-500" />
              <span>{isHindi ? 'गोपनीयता नीति' : 'Privacy Policy'}</span>
            </button>
            <button
              onClick={() => setShowHelpModal(true)}
              className="min-h-[40px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>{isHindi ? 'सहायता और समर्थन' : 'Help and Support'}</span>
            </button>
          </div>
        </div>
      </div>

      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isHindi ? 'गोपनीयता नीति — Smart Study Guardian' : 'Privacy Policy — Smart Study Guardian'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Smart Study Guardian associates your syllabus progress, study streaks, and completed mock test records exclusively with your signed-in Firebase account, while keeping personal notes cached on your device. Focus Shield controls never read your messages, passwords, or screenshots.
            </p>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="min-h-[42px] px-5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs"
            >
              {isHindi ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isHindi ? 'सहायता और मार्गदर्शन' : 'Help and Support'}
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed list-disc list-inside">
              <li>Use AI Tutor to solve Physics, Chemistry, and Mathematics questions in English or Hindi for Class 9–12 Boards, JEE, NEET, and CUET.</li>
              <li>Use Syllabus &amp; Practice to review chapter notes, formulas, topic quizzes, and timed Mock Tests.</li>
              <li>Use Focus Mode &amp; App Blocker to pause distracting apps and stay on schedule.</li>
            </ul>
            <button
              onClick={() => setShowHelpModal(false)}
              className="min-h-[42px] px-5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs"
            >
              {isHindi ? 'ठीक है' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
