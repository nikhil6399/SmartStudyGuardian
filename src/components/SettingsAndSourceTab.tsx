import React, { useEffect, useState } from 'react';
import { BellRing, Check, Download, Eye, EyeOff, HelpCircle, KeyRound, Moon, ShieldCheck, Sun, Trash2, Upload } from 'lucide-react';
import { STUDY_LEVEL_OPTIONS } from '../data/jeeCatalog';
import { PersistedAppState, Subject } from '../types';
import { maskApiKey } from '../utils/localStorageState';

export function SettingsTab({
  state,
  onUpdateSettings,
  onRestoreBackup,
  onClearAllData,
}: {
  state: PersistedAppState;
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

  useEffect(() => {
    setApiKeyInput(state.customGeminiApiKey || '');
  }, [state.customGeminiApiKey]);

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

      {/* Right Column: 6. Privacy Policy, 7. Help and Support, 8. Backup and Restore */}
      <div className="lg:col-span-5 space-y-6">
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
              ? 'आपके नोट्स, अध्याय प्रगति और मॉक टेस्ट स्कोर सुरक्षित रूप से आपके डिवाइस पर रहते हैं। किसी लॉगिन या खाते की आवश्यकता नहीं है।'
              : 'Your notes, syllabus progress, timetable, and mock test history are saved privately on your device. No account or login is required.'}
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
              {isHindi ? 'गोपनीयता नीति — AI Study Guardian' : 'Privacy Policy — AI Study Guardian'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              AI Study Guardian keeps your syllabus progress, personal notes, mock test scores, and study preferences privately on your device. No sign-up, phone number, or personal account is collected. Focus Shield controls never read your messages, passwords, or screenshots.
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
