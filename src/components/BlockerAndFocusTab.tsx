import React, { useState } from 'react';
import { Eye, Lock, Pause, Play, Shield, ShieldAlert, Square, Youtube } from 'lucide-react';
import { FilterStrictness, PersistedAppState } from '../types';
import { formatHms, formatMmSs } from '../utils/localStorageState';
import { StudyGuardianMascot } from './MascotEmblem';

interface BlockerAndFocusTabProps {
  state: PersistedAppState;
  focusRemainingSeconds: number;
  pomodoroPhase: 'STUDY' | 'BREAK';
  pomodoroRemainingSec: number;
  pomodoroRunning: boolean;
  onToggleBlockedApp: (packageName: string) => void;
  onStartFocus: (durationMinutes: number) => void;
  onPauseFocus: () => void;
  onResumeFocus: () => void;
  onStopFocus: (emergency: boolean) => void;
  onTogglePomodoro: () => void;
  onUpdateYouTubeFilter: (patch: Partial<PersistedAppState>) => void;
  onUpdateAiFilter: (patch: Partial<PersistedAppState>) => void;
}

export function BlockerAndFocusTab({
  state,
  focusRemainingSeconds,
  pomodoroPhase,
  pomodoroRemainingSec,
  pomodoroRunning,
  onToggleBlockedApp,
  onStartFocus,
  onPauseFocus,
  onResumeFocus,
  onStopFocus,
  onTogglePomodoro,
  onUpdateYouTubeFilter,
  onUpdateAiFilter,
}: BlockerAndFocusTabProps) {
  const isHindi = state.language === 'hi';
  const [subTab, setSubTab] = useState<'focus' | 'apps' | 'youtube' | 'content_filter'>('focus');
  const [selectedDuration, setSelectedDuration] = useState(state.focusDurationMinutes || 120);
  const [customMinutes, setCustomMinutes] = useState('90');
  const [showShieldPreview, setShowShieldPreview] = useState(false);

  // YouTube local inputs
  const [ytKeywords, setYtKeywords] = useState(state.youtubeKeywords);
  const [ytCategories, setYtCategories] = useState(state.youtubeAllowedCategories);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Content Safety Filter settings
  const [aiKeywords, setAiKeywords] = useState(state.aiFilterKeywords);
  const [aiCategories, setAiCategories] = useState(state.aiFilterCategories);

  const isFocusActive = state.focusActiveUntil > Date.now() || state.focusPausedRemainingMs > 0;
  const isPaused = state.focusPausedRemainingMs > 0;
  const blockedCount = state.apps.filter((a) => a.blocked).length;

  return (
    <div className="space-y-6">
      {/* Sub-module Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-200/80 dark:bg-[#0A173B] border border-slate-200 dark:border-slate-800">
          {[
            { id: 'focus', label: isHindi ? 'स्मार्ट फोकस' : 'Focus Mode' },
            { id: 'apps', label: isHindi ? 'ऐप ब्लॉकर' : 'App Blocker' },
            { id: 'youtube', label: isHindi ? 'YouTube नियंत्रण' : 'YouTube Study Mode' },
            { id: 'content_filter', label: isHindi ? 'सुरक्षा फ़िल्टर' : 'Content Safety Filter' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSavedNotice(null);
                setSubTab(tab.id as typeof subTab);
              }}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                subTab === tab.id
                  ? 'bg-white dark:bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowShieldPreview(true)}
          className="min-h-[44px] px-4 rounded-xl border border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap"
        >
          <Eye className="w-4 h-4" />
          <span>{isHindi ? 'फोकस स्क्रीन देखें' : 'View Focus Shield'}</span>
        </button>
      </div>

      {/* 1. SMART STUDY FOCUS MODE */}
      {subTab === 'focus' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-5">
            <div className="flex items-center gap-4">
              <StudyGuardianMascot size={60} meditating={isFocusActive && !isPaused} />
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isHindi ? 'पढ़ाई पर ध्यान दें, मोबाइल पर नहीं' : 'Focus on Study, Not on Mobile'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {blockedCount} {isHindi ? 'ऐप्स चुने गए' : 'apps selected'} · YouTube Filter ({state.youtubeFilterEnabled ? 'ON' : 'OFF'}) · Pomodoro
                </p>
              </div>
            </div>

            {isFocusActive ? (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#06102B] border border-cyan-500/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                    {isPaused
                      ? isHindi
                        ? 'फोकस सत्र रुका हुआ है'
                        : 'Focus Session Paused'
                      : isHindi
                      ? 'शेष फोकस समय'
                      : 'Remaining Time'}
                  </span>
                  <span className="font-mono tabular-nums text-3xl font-bold text-amber-500">
                    {formatHms(focusRemainingSeconds)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {isPaused ? (
                    <button
                      onClick={onResumeFocus}
                      className="min-h-[44px] flex-1 px-4 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-sm inline-flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>{isHindi ? 'फिर शुरू करें' : 'Resume Focus'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={onPauseFocus}
                      className="min-h-[44px] flex-1 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold inline-flex items-center justify-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      <span>{isHindi ? 'थोड़ा रुकें' : 'Pause'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => onStopFocus(false)}
                    className="min-h-[44px] flex-1 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    <span>{isHindi ? 'सत्र समाप्त' : 'End Session'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    {isHindi ? 'फोकस अवधि चुनें' : 'Focus Duration'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { min: 60, label: '1 Hour' },
                      { min: 120, label: '2 Hours' },
                      { min: 180, label: '3 Hours' },
                      { min: -1, label: 'Custom' },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() =>
                          setSelectedDuration(opt.min === -1 ? Math.max(15, Number(customMinutes) || 90) : opt.min)
                        }
                        className={`min-h-[44px] rounded-xl border text-xs font-semibold ${
                          (opt.min === -1 && ![60, 120, 180].includes(selectedDuration)) ||
                          selectedDuration === opt.min
                            ? 'border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {![60, 120, 180].includes(selectedDuration) && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={15}
                        max={480}
                        value={customMinutes}
                        onChange={(e) => {
                          setCustomMinutes(e.target.value);
                          setSelectedDuration(Math.max(15, Number(e.target.value) || 90));
                        }}
                        className="w-28 min-h-[40px] px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm font-mono tabular-nums"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">minutes</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onStartFocus(selectedDuration)}
                  className="min-h-[48px] w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-sm transition-colors"
                >
                  {isHindi ? 'फोकस मोड शुरू करें' : 'Start Blocking & Study Focus'}
                </button>
              </div>
            )}

            {/* Embedded Pomodoro */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pomodoro Cycle ({pomodoroPhase})</p>
                <p className="font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-white">
                  {formatMmSs(pomodoroRemainingSec)}
                </p>
              </div>
              <button
                onClick={onTogglePomodoro}
                className="min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                {pomodoroRunning ? 'Pause Pomodoro' : 'Start Pomodoro'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isHindi ? 'फोकस सत्र इतिहास' : 'Focus Session History'}
            </h3>
            <div className="space-y-3">
              {state.focusSessions.slice(0, 5).map((fs) => (
                <div
                  key={fs.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                      {fs.actualMinutes} / {fs.plannedMinutes} min · {fs.status === 'COMPLETED' ? 'Completed' : 'Ended Early'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {fs.blockedAppsCount} apps shielded
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {new Date(fs.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. APP BLOCKER */}
      {subTab === 'apps' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isHindi ? 'ब्लॉक करने के लिए ऐप्स चुनें' : 'Select Apps to Block'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHindi
                    ? 'पढ़ाई के समय चुने गए ऐप्स अपने आप रुक जाएंगे।'
                    : 'Selected distracting apps are paused while your Study Focus session is active.'}
                </p>
              </div>
              <span className="font-mono tabular-nums text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                {blockedCount} selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {state.apps.map((app) => (
                <button
                  key={app.packageName}
                  onClick={() => onToggleBlockedApp(app.packageName)}
                  className={`min-h-[84px] p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-colors ${
                    app.blocked
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#06102B]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{app.appName}</span>
                    <input type="checkbox" readOnly checked={app.blocked} className="h-4 w-4 accent-cyan-500" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    Today: {app.dailyMinutesUsed}m
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isHindi ? 'फोकस गोपनीयता और सुरक्षा' : 'Your Privacy & Focus Shield'}
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <li>
                <strong className="text-slate-900 dark:text-white">Daily Usage Summary:</strong> Shows how long you spent in each app today so you can choose distractions wisely.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Study Shield Protection:</strong> Only checks whether a blocked app is opened during Focus Mode. Never reads messages, passwords, or private data.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Emergency Unlock:</strong> Available anytime if you urgently need a paused app.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 3. YOUTUBE STUDY MODE */}
      {subTab === 'youtube' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Youtube className="w-6 h-6 text-red-500" />
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">YouTube Study Control</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Keep study lectures accessible while reducing Shorts and distracting topics.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between min-h-[44px] cursor-pointer">
                <span className="text-sm font-medium">Enable YouTube Study Filter</span>
                <input
                  type="checkbox"
                  checked={state.youtubeFilterEnabled}
                  onChange={(e) => onUpdateYouTubeFilter({ youtubeFilterEnabled: e.target.checked })}
                  className="h-5 w-5 accent-cyan-500"
                />
              </label>
              <label className="flex items-center justify-between min-h-[44px] cursor-pointer">
                <span className="text-sm font-medium">Hide YouTube Shorts During Focus</span>
                <input
                  type="checkbox"
                  checked={state.youtubeBlockShorts}
                  onChange={(e) => onUpdateYouTubeFilter({ youtubeBlockShorts: e.target.checked })}
                  className="h-5 w-5 accent-cyan-500"
                />
              </label>
              <label className="flex items-center justify-between min-h-[44px] cursor-pointer">
                <span className="text-sm font-medium">Block YouTube Completely During Focus</span>
                <input
                  type="checkbox"
                  checked={state.youtubeBlockWholeApp}
                  onChange={(e) => onUpdateYouTubeFilter({ youtubeBlockWholeApp: e.target.checked })}
                  className="h-5 w-5 accent-cyan-500"
                />
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Distracting Topics to Avoid
                </label>
                <input
                  type="text"
                  value={ytKeywords}
                  onChange={(e) => setYtKeywords(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Allowed Study Categories
                </label>
                <input
                  type="text"
                  value={ytCategories}
                  onChange={(e) => setYtCategories(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    onUpdateYouTubeFilter({
                      youtubeKeywords: ytKeywords,
                      youtubeAllowedCategories: ytCategories,
                    });
                    setSavedNotice('YouTube study preferences updated.');
                  }}
                  className="min-h-[44px] px-5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs"
                >
                  Save Preferences
                </button>
                {savedNotice && <span className="text-xs text-cyan-600 dark:text-cyan-400">{savedNotice}</span>}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Study Shield Activity</h3>
            {state.filterLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800 text-xs">
                <p className="text-slate-800 dark:text-slate-100 font-medium">{log.summary}</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {new Date(log.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CONTENT SAFETY FILTER */}
      {subTab === 'content_filter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Content Safety Filter</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Helps keep distracting and inappropriate content out of your study environment.
                </p>
              </div>
              <input
                type="checkbox"
                checked={state.aiFilterEnabled}
                onChange={(e) => onUpdateAiFilter({ aiFilterEnabled: e.target.checked })}
                aria-label="Enable Content Filter"
                className="h-5 w-5 accent-cyan-500"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Strictness</p>
              <div className="grid grid-cols-3 gap-2">
                {(['RELAXED', 'BALANCED', 'STRICT'] as FilterStrictness[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => onUpdateAiFilter({ aiFilterStrictness: level })}
                    className={`min-h-[42px] rounded-xl border text-xs font-semibold ${
                      state.aiFilterStrictness === level
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Blocked Keywords
                </label>
                <input
                  type="text"
                  value={aiKeywords}
                  onChange={(e) => setAiKeywords(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Filter Categories
                </label>
                <input
                  type="text"
                  value={aiCategories}
                  onChange={(e) => setAiCategories(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onUpdateAiFilter({ aiFilterKeywords: aiKeywords, aiFilterCategories: aiCategories });
                  setSavedNotice('Safety filter rules saved.');
                }}
                className="min-h-[42px] px-5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs"
              >
                Save Filter Settings
              </button>
              {savedNotice && <span className="text-xs text-cyan-600 dark:text-cyan-400">{savedNotice}</span>}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Protection Activity</h3>
            {state.filterLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800 text-xs">
                <p className="text-slate-800 dark:text-slate-100 font-medium">{log.summary}</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {new Date(log.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* App Blocked Shield Overlay Preview Modal */}
      {showShieldPreview && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-cyan-500/50 bg-gradient-to-b from-[#08153E] to-[#040B24] p-6 text-center text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 font-semibold text-cyan-400">
                <Shield className="w-4 h-4" />
                <span>App Blocked</span>
              </span>
              <button
                onClick={() => setShowShieldPreview(false)}
                className="min-h-[36px] px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <StudyGuardianMascot size={92} meditating />
              <p className="text-amber-400 font-bold text-lg">Study Time — Don&apos;t Break It!</p>
            </div>

            <div className="rounded-2xl border border-red-500/40 bg-[#0B1B4B] p-4 space-y-1.5">
              <div className="inline-flex items-center gap-2 text-red-400 font-bold text-base">
                <ShieldAlert className="w-5 h-5" />
                <span>This App is Blocked!</span>
              </div>
              <p className="text-xs text-slate-300">
                You paused distracting apps to stay focused on your study session. Keep going — you can do it!
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-[#0B1B4B] p-4">
              <p className="text-xs text-slate-400">Block Time Remaining</p>
              <p className="font-mono tabular-nums text-3xl font-extrabold text-amber-400 mt-1">
                {formatHms(focusRemainingSeconds > 0 ? focusRemainingSeconds : selectedDuration * 60)}
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => setShowShieldPreview(false)}
                className="min-h-[46px] w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm"
              >
                Return to Study
              </button>
              <button
                onClick={() => {
                  onStopFocus(true);
                  setShowShieldPreview(false);
                }}
                className="min-h-[42px] w-full rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Emergency Unlock (Only if Really Needed)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
