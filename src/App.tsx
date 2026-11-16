import React, { useEffect, useRef, useState } from 'react';
import { AlarmClock, BellRing, BookOpen, GraduationCap, Home, Settings, Shield, Sparkles } from 'lucide-react';
import { AiTutorTab } from './components/AiTutorTab';
import { AlarmsView } from './components/AlarmsView';
import { BlockerAndFocusTab } from './components/BlockerAndFocusTab';
import { ClassSelectionModal } from './components/ClassSelectionView';
import { HomeTab } from './components/HomeTab';
import { AnalyticsView, PlannerView } from './components/PlannerAndAnalyticsViews';
import { PracticeAndTestTab } from './components/PracticeAndTestTab';
import { SettingsTab } from './components/SettingsAndSourceTab';
import { EXAM_TRACK_LABELS, INITIAL_APP_STATE } from './data/jeeCatalog';
import { ExamTrack, MainTab, PersistedAppState, StudyAlarm, SubView } from './types';
import { formatTime12h, startAlarmRingLoop, stopAlarmRingLoop } from './utils/alarmAudio';
import { clearPersistedState, loadPersistedState, sanitizePersistedState, savePersistedState } from './utils/localStorageState';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#050C24] text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 text-center space-y-4">
            <h1 className="text-lg font-bold">AI Study Guardian</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              A temporary display issue occurred. Click below to restore your study dashboard cleanly.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => this.setState({ hasError: false })}
                className="min-h-[42px] px-5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-sm"
              >
                Reload View
              </button>
              <button
                onClick={() => {
                  clearPersistedState();
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="min-h-[42px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                Reset Preferences
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
}

function AppContent() {
  const [state, setState] = useState<PersistedAppState>(() => loadPersistedState());
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [subView, setSubView] = useState<SubView>('none');
  const [focusRemainingSeconds, setFocusRemainingSeconds] = useState<number>(0);
  const [showClassModal, setShowClassModal] = useState<boolean>(false);
  const [ringingAlarm, setRingingAlarm] = useState<StudyAlarm | null>(null);
  const firedAlarmKeysRef = useRef<Set<string>>(new Set());

  // Pomodoro state
  const [pomodoroPhase, setPomodoroPhase] = useState<'STUDY' | 'BREAK'>('STUDY');
  const [pomodoroRemainingSec, setPomodoroRemainingSec] = useState(state.pomodoroStudyMin * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);

  // Sync dark/light class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [state.theme]);

  // Persist to localStorage automatically
  useEffect(() => {
    savePersistedState(state);
  }, [state]);

  // Focus countdown ticker
  useEffect(() => {
    const tick = () => {
      if (state.focusPausedRemainingMs > 0) {
        setFocusRemainingSeconds(Math.floor(state.focusPausedRemainingMs / 1000));
      } else if (state.focusActiveUntil > Date.now()) {
        setFocusRemainingSeconds(Math.floor((state.focusActiveUntil - Date.now()) / 1000));
      } else {
        setFocusRemainingSeconds(0);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [state.focusActiveUntil, state.focusPausedRemainingMs]);

  // Pomodoro ticker
  useEffect(() => {
    if (!pomodoroRunning) return;
    const id = window.setInterval(() => {
      setPomodoroRemainingSec((prev) => {
        if (prev <= 1) {
          if (pomodoroPhase === 'STUDY') {
            setPomodoroPhase('BREAK');
            setState((s) => {
              const weekly = [...s.weeklyStudy];
              const lastIdx = weekly.length - 1;
              if (lastIdx >= 0) {
                weekly[lastIdx] = {
                  ...weekly[lastIdx],
                  physicsMinutes: weekly[lastIdx].physicsMinutes + s.pomodoroStudyMin,
                };
              }
              return { ...s, weeklyStudy: weekly };
            });
            return state.pomodoroBreakMin * 60;
          } else {
            setPomodoroPhase('STUDY');
            return state.pomodoroStudyMin * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [pomodoroRunning, pomodoroPhase, state.pomodoroBreakMin, state.pomodoroStudyMin]);

  // Study Alarm 1-second checker (deduped per alarm + YYYY-MM-DD HH:MM)
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const hhmm = `${hh}:${mm}`;
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const jsDay = now.getDay();
      const isoDay = jsDay === 0 ? 7 : jsDay;

      for (const alarm of state.alarms) {
        if (!alarm || !alarm.enabled) continue;
        if (alarm.time !== hhmm) continue;
        const alarmDays = Array.isArray(alarm.days) ? alarm.days : [];
        const dayAllowed = alarmDays.length === 0 || alarmDays.includes(isoDay);
        if (!dayAllowed) continue;
        const dedupKey = `${alarm.id}_${dateStr}_${hhmm}`;
        if (firedAlarmKeysRef.current.has(dedupKey)) continue;
        firedAlarmKeysRef.current.add(dedupKey);
        setRingingAlarm(alarm);
        startAlarmRingLoop(alarm.tone);
        if (state.notificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification('AI Study Guardian — Study Alarm', {
              body: `${formatTime12h(alarm.time)} · ${alarm.label}`,
            });
          } catch {
            // Ignore notification errors in restricted contexts
          }
        }
        break;
      }
    };
    const id = window.setInterval(checkAlarms, 1000);
    return () => {
      window.clearInterval(id);
    };
  }, [state.alarms, state.notificationsEnabled]);

  useEffect(() => {
    return () => {
      stopAlarmRingLoop();
    };
  }, []);

  const handleSelectClassTrack = (track: ExamTrack) => {
    setState((s) => ({
      ...s,
      hasSelectedClass: true,
      selectedClassTrack: track,
      aiDefaultLevel: track,
      negativeMarkingEnabled: !track.startsWith('CLASS_'),
    }));
    setShowClassModal(false);
  };

  const handleDismissAlarm = () => {
    stopAlarmRingLoop();
    setRingingAlarm(null);
  };

  const handleSnoozeAlarm = () => {
    const alarm = ringingAlarm;
    stopAlarmRingLoop();
    setRingingAlarm(null);
    if (!alarm) return;
    const snoozeDate = new Date(Date.now() + 5 * 60_000);
    const snoozeTime = `${String(snoozeDate.getHours()).padStart(2, '0')}:${String(snoozeDate.getMinutes()).padStart(2, '0')}`;
    setState((s) => ({
      ...s,
      alarms: [
        {
          id: `snooze_${Date.now()}`,
          time: snoozeTime,
          label: `${alarm.label} (Snoozed 5m)`,
          days: [],
          enabled: true,
          tone: alarm.tone,
          subject: alarm.subject,
        },
        ...s.alarms,
      ],
    }));
  };

  const navigateTab = (tab: MainTab) => {
    setSubView('none');
    setActiveTab(tab);
  };

  const openSubView = (view: SubView) => {
    setSubView(view);
  };

  const isHindi = state.language === 'hi';
  const activeTrackMeta = EXAM_TRACK_LABELS[state.selectedClassTrack] ?? EXAM_TRACK_LABELS.CLASS_12_BOARD;
  const activeTrackLabel = isHindi ? activeTrackMeta.hi : activeTrackMeta.en;

  const navLabels = {
    home: isHindi ? 'होम' : 'Home',
    tutor: isHindi ? 'AI गुरु' : 'AI Tutor',
    practice: isHindi ? 'मॉक टेस्ट' : 'Mock Test',
    blocker: isHindi ? 'ऐप ब्लॉकर' : 'App Blocker',
    settings: isHindi ? 'सेटिंग्स' : 'Settings',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050C24] text-slate-900 dark:text-slate-100 pb-20 md:pb-8">
      {/* Clean 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-[#050C24]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <button
            onClick={() => navigateTab('home')}
            className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            AI Study Guardian
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => navigateTab('home')}
              className={`hover:text-cyan-600 dark:hover:text-cyan-400 whitespace-nowrap shrink-0 ${
                subView === 'none' && activeTab === 'home' ? 'text-cyan-600 dark:text-cyan-400 font-semibold' : ''
              }`}
            >
              {isHindi ? 'डैशबोर्ड' : 'Dashboard'}
            </button>
            <button
              onClick={() => navigateTab('practice')}
              className={`hover:text-cyan-600 dark:hover:text-cyan-400 whitespace-nowrap shrink-0 ${
                (subView === 'mock_test' || activeTab === 'practice') ? 'text-cyan-600 dark:text-cyan-400 font-semibold' : ''
              }`}
            >
              {isHindi ? 'मॉक टेस्ट' : 'Mock Test'}
            </button>
            <button
              onClick={() => openSubView('planner')}
              className={`hover:text-cyan-600 dark:hover:text-cyan-400 whitespace-nowrap shrink-0 ${
                subView === 'planner' ? 'text-cyan-600 dark:text-cyan-400 font-semibold' : ''
              }`}
            >
              {isHindi ? 'स्टडी प्लानर' : 'Study Planner'}
            </button>
            <button
              onClick={() => openSubView('alarms')}
              className={`hover:text-cyan-600 dark:hover:text-cyan-400 whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${
                subView === 'alarms' ? 'text-cyan-600 dark:text-cyan-400 font-semibold' : ''
              }`}
            >
              <AlarmClock className="w-3.5 h-3.5" />
              <span>{isHindi ? 'अलार्म' : 'Alarms'}</span>
            </button>
            <button
              onClick={() => openSubView('analytics')}
              className={`hover:text-cyan-600 dark:hover:text-cyan-400 whitespace-nowrap shrink-0 ${
                subView === 'analytics' ? 'text-cyan-600 dark:text-cyan-400 font-semibold' : ''
              }`}
            >
              {isHindi ? 'प्रगति रिपोर्ट' : 'Study Reports'}
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowClassModal(true)}
              className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[#0A173B] hover:border-cyan-500/60 text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 whitespace-nowrap"
              title={isHindi ? 'कक्षा या परीक्षा बदलें' : 'Switch Class or Exam'}
            >
              <GraduationCap className="w-3.5 h-3.5 text-cyan-500" />
              <span>{activeTrackLabel}</span>
            </button>
            <button
              onClick={() => navigateTab('blocker')}
              className="min-h-[40px] px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">{isHindi ? 'फोकस मोड' : 'Start Focus'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop 5-Tab Workspace Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        <div className="hidden md:flex items-center gap-2 pb-5 border-b border-slate-200 dark:border-slate-800/80 mb-6">
          {(
            [
              { id: 'home', label: navLabels.home, icon: Home },
              { id: 'tutor', label: navLabels.tutor, icon: Sparkles },
              { id: 'practice', label: navLabels.practice, icon: BookOpen },
              { id: 'blocker', label: navLabels.blocker, icon: Shield },
              { id: 'settings', label: navLabels.settings, icon: Settings },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const selected = subView === 'none' && activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTab(item.id)}
                className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                  selected
                    ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950'
                    : 'bg-white dark:bg-[#0A173B] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-500/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Viewport */}
        <main>
          {subView === 'planner' ? (
            <PlannerView
              state={state}
              pomodoroPhase={pomodoroPhase}
              pomodoroRemainingSec={pomodoroRemainingSec}
              pomodoroRunning={pomodoroRunning}
              onTogglePomodoro={() => setPomodoroRunning((r) => !r)}
              onResetPomodoro={() => {
                setPomodoroRunning(false);
                setPomodoroPhase('STUDY');
                setPomodoroRemainingSec(state.pomodoroStudyMin * 60);
              }}
              onAddGoal={(title, subject, targetMinutes) =>
                setState((s) => ({
                  ...s,
                  goals: [
                    { id: `g_${Date.now()}`, title, subject, targetMinutes, completed: false },
                    ...s.goals,
                  ],
                }))
              }
              onToggleGoal={(id) =>
                setState((s) => ({
                  ...s,
                  goals: s.goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)),
                }))
              }
              onDeleteGoal={(id) =>
                setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }))
              }
              onAddTimetableSlot={(dayOfWeek, startTime, endTime, subject, chapterTitle, isRevision) =>
                setState((s) => ({
                  ...s,
                  timetable: [
                    ...s.timetable,
                    { id: `t_${Date.now()}`, dayOfWeek, startTime, endTime, subject, chapterTitle, isRevision },
                  ],
                }))
              }
              onDeleteTimetableSlot={(id) =>
                setState((s) => ({ ...s, timetable: s.timetable.filter((t) => t.id !== id) }))
              }
              onOpenAlarms={() => openSubView('alarms')}
            />
          ) : subView === 'alarms' ? (
            <AlarmsView
              alarms={state.alarms}
              language={state.language}
              onAddAlarm={(alarmInput) => {
                if (
                  typeof Notification !== 'undefined' &&
                  Notification.permission === 'default' &&
                  typeof Notification.requestPermission === 'function'
                ) {
                  try {
                    Promise.resolve(Notification.requestPermission()).catch(() => {});
                  } catch {
                    // Ignore Notification API restrictions in embedded contexts
                  }
                }
                setState((s) => ({
                  ...s,
                  alarms: [{ id: `alm_${Date.now()}`, ...alarmInput }, ...s.alarms],
                }));
              }}
              onToggleAlarm={(id) =>
                setState((s) => ({
                  ...s,
                  alarms: s.alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
                }))
              }
              onDeleteAlarm={(id) =>
                setState((s) => ({
                  ...s,
                  alarms: s.alarms.filter((a) => a.id !== id),
                }))
              }
            />
          ) : subView === 'analytics' ? (
            <AnalyticsView state={state} />
          ) : subView === 'mock_test' || activeTab === 'practice' ? (
            <PracticeAndTestTab
              state={state}
              isMockTestOpen={subView === 'mock_test'}
              onOpenMockTest={() => setSubView('mock_test')}
              onCloseMockTest={() => {
                setSubView('none');
                setActiveTab('practice');
              }}
              onToggleChapterComplete={(chapterId) =>
                setState((s) => {
                  const prev = s.chapterProgress[chapterId] ?? {
                    completed: false,
                    revisionCount: 0,
                    practiceAttempted: 0,
                    practiceCorrect: 0,
                  };
                  return {
                    ...s,
                    chapterProgress: {
                      ...s.chapterProgress,
                      [chapterId]: { ...prev, completed: !prev.completed },
                    },
                  };
                })
              }
              onLogRevision={(chapterId) =>
                setState((s) => {
                  const prev = s.chapterProgress[chapterId] ?? {
                    completed: false,
                    revisionCount: 0,
                    practiceAttempted: 0,
                    practiceCorrect: 0,
                  };
                  return {
                    ...s,
                    chapterProgress: {
                      ...s.chapterProgress,
                      [chapterId]: { ...prev, revisionCount: prev.revisionCount + 1 },
                    },
                  };
                })
              }
              onRecordPracticeAttempt={(chapterId, correct) =>
                setState((s) => {
                  const prev = s.chapterProgress[chapterId] ?? {
                    completed: false,
                    revisionCount: 0,
                    practiceAttempted: 0,
                    practiceCorrect: 0,
                  };
                  return {
                    ...s,
                    chapterProgress: {
                      ...s.chapterProgress,
                      [chapterId]: {
                        ...prev,
                        practiceAttempted: prev.practiceAttempted + 1,
                        practiceCorrect: prev.practiceCorrect + (correct ? 1 : 0),
                      },
                    },
                  };
                })
              }
              onToggleSaveQuestion={(qId) =>
                setState((s) => ({
                  ...s,
                  savedQuestionIds: s.savedQuestionIds.includes(qId)
                    ? s.savedQuestionIds.filter((id) => id !== qId)
                    : [...s.savedQuestionIds, qId],
                }))
              }
              onAddNote={(chapterId, subject, title, content) =>
                setState((s) => ({
                  ...s,
                  notes: [
                    { id: `n_${Date.now()}`, chapterId, subject, title, content, updatedAt: Date.now() },
                    ...s.notes,
                  ],
                }))
              }
              onSaveMockTestResult={(res) =>
                setState((s) => ({
                  ...s,
                  testHistory: [res, ...s.testHistory],
                }))
              }
              onSaveDailyAiSet={(newSet) =>
                setState((s) => ({
                  ...s,
                  dailyAiSets: [newSet, ...s.dailyAiSets.filter((x) => x.id !== newSet.id)].slice(0, 7),
                }))
              }
            />
          ) : activeTab === 'home' ? (
            <HomeTab
              state={state}
              focusRemainingSeconds={focusRemainingSeconds}
              onNavigateTab={navigateTab}
              onOpenSubView={openSubView}
              onToggleGoal={(id) =>
                setState((s) => ({
                  ...s,
                  goals: s.goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)),
                }))
              }
              onOpenClassSelector={() => setShowClassModal(true)}
              onAddCustomRevision={(title, subject, time) => {
                setState((s) => ({
                  ...s,
                  customRevisions: [
                    { id: `rev_${Date.now()}`, title, subject, time },
                    ...s.customRevisions,
                  ],
                  alarms: [
                    {
                      id: `alm_${Date.now()}`,
                      time,
                      label: `Revision: ${title}`,
                      days: [1, 2, 3, 4, 5, 6, 7],
                      enabled: true,
                      tone: 'chime',
                      subject,
                    },
                    ...s.alarms,
                  ],
                }));
              }}
              onAddAlarm={(alarmInput) => {
                setState((s) => ({
                  ...s,
                  alarms: [{ id: `alm_${Date.now()}`, ...alarmInput }, ...s.alarms],
                }));
              }}
            />
          ) : activeTab === 'tutor' ? (
            <AiTutorTab
              language={state.language}
              defaultLevel={state.aiDefaultLevel}
              defaultSubject={state.aiDefaultSubject}
              chatHistory={state.chatHistory}
              customApiKey={state.customGeminiApiKey}
              onAddChatMessages={(userMsg, assistantMsg) =>
                setState((s) => ({
                  ...s,
                  chatHistory: assistantMsg
                    ? [...s.chatHistory, userMsg, assistantMsg]
                    : [...s.chatHistory, userMsg],
                }))
              }
              onToggleSaveAnswer={(id) =>
                setState((s) => ({
                  ...s,
                  chatHistory: s.chatHistory.map((m) => (m.id === id ? { ...m, saved: !m.saved } : m)),
                }))
              }
              onClearHistory={() => setState((s) => ({ ...s, chatHistory: [] }))}
            />
          ) : activeTab === 'blocker' ? (
            <BlockerAndFocusTab
              state={state}
              focusRemainingSeconds={focusRemainingSeconds}
              pomodoroPhase={pomodoroPhase}
              pomodoroRemainingSec={pomodoroRemainingSec}
              pomodoroRunning={pomodoroRunning}
              onToggleBlockedApp={(pkg) =>
                setState((s) => ({
                  ...s,
                  apps: s.apps.map((a) => (a.packageName === pkg ? { ...a, blocked: !a.blocked } : a)),
                }))
              }
              onStartFocus={(durationMinutes) => {
                setState((s) => ({
                  ...s,
                  focusDurationMinutes: durationMinutes,
                  focusActiveUntil: Date.now() + durationMinutes * 60_000,
                  focusPausedRemainingMs: 0,
                }));
                setPomodoroRunning(true);
              }}
              onPauseFocus={() =>
                setState((s) => ({
                  ...s,
                  focusPausedRemainingMs: Math.max(0, s.focusActiveUntil - Date.now()),
                  focusActiveUntil: 0,
                }))
              }
              onResumeFocus={() =>
                setState((s) => ({
                  ...s,
                  focusActiveUntil: Date.now() + s.focusPausedRemainingMs,
                  focusPausedRemainingMs: 0,
                }))
              }
              onStopFocus={(emergency) =>
                setState((s) => {
                  const plannedMs = s.focusDurationMinutes * 60_000;
                  const rem =
                    s.focusPausedRemainingMs > 0
                      ? s.focusPausedRemainingMs
                      : Math.max(0, s.focusActiveUntil - Date.now());
                  const actualMinutes = Math.max(1, Math.round((plannedMs - rem) / 60_000));
                  return {
                    ...s,
                    focusActiveUntil: 0,
                    focusPausedRemainingMs: 0,
                    focusSessions: [
                      {
                        id: `fs_${Date.now()}`,
                        plannedMinutes: s.focusDurationMinutes,
                        actualMinutes,
                        blockedAppsCount: s.apps.filter((a) => a.blocked).length,
                        youtubeFilterEnabled: s.youtubeFilterEnabled,
                        aiFilterEnabled: s.aiFilterEnabled,
                        status: emergency ? 'EMERGENCY_UNLOCKED' : 'COMPLETED',
                        timestamp: Date.now(),
                      },
                      ...s.focusSessions,
                    ],
                  };
                })
              }
              onTogglePomodoro={() => setPomodoroRunning((r) => !r)}
              onUpdateYouTubeFilter={(patch) => setState((s) => ({ ...s, ...patch }))}
              onUpdateAiFilter={(patch) => setState((s) => ({ ...s, ...patch }))}
            />
          ) : (
            <SettingsTab
              state={state}
              onUpdateSettings={(patch) => setState((s) => ({ ...s, ...patch }))}
              onRestoreBackup={(json) => {
                try {
                  const parsed = JSON.parse(json) as unknown;
                  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
                  setState(sanitizePersistedState(parsed));
                  return true;
                } catch {
                  return false;
                }
              }}
              onClearAllData={() => {
                clearPersistedState();
                setState(INITIAL_APP_STATE);
              }}
            />
          )}
        </main>
      </div>

      {/* Mobile Fixed 5-Tab Bottom Navigation Bar */}
      <nav
        aria-label="Primary Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-[#050C24]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center"
      >
        {(
          [
            { id: 'home', label: navLabels.home, icon: Home },
            { id: 'tutor', label: navLabels.tutor, icon: Sparkles },
            { id: 'practice', label: navLabels.practice, icon: BookOpen },
            { id: 'blocker', label: navLabels.blocker, icon: Shield },
            { id: 'settings', label: navLabels.settings, icon: Settings },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = subView === 'none' && activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigateTab(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 ${
                active ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight truncate max-w-full px-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Upfront Class / Exam Selection Modal */}
      {(!state.hasSelectedClass || showClassModal) && (
        <ClassSelectionModal
          currentTrack={state.selectedClassTrack}
          language={state.language}
          isInitialSetup={!state.hasSelectedClass}
          onSelectTrack={handleSelectClassTrack}
          onChangeLanguage={(lang) => setState((s) => ({ ...s, language: lang }))}
          onClose={() => setShowClassModal(false)}
        />
      )}

      {/* Live Ringing Study Alarm Overlay */}
      {ringingAlarm && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-amber-400/50 bg-white dark:bg-[#08153B] p-6 space-y-5 text-center shadow-2xl">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-400/20 text-amber-500 flex items-center justify-center animate-bounce">
              <BellRing className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                {isHindi ? 'अध्ययन अलार्म बज रहा है' : 'Study Alarm Ringing'}
              </p>
              <p className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {formatTime12h(ringingAlarm.time)}
              </p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
                {ringingAlarm.label}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleSnoozeAlarm}
                className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                {isHindi ? '5 मिनट स्नूज़' : 'Snooze 5 min'}
              </button>
              <button
                onClick={handleDismissAlarm}
                className="min-h-[44px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
              >
                {isHindi ? 'अलार्म बंद करें' : 'Dismiss'}
              </button>
            </div>
            <button
              onClick={() => {
                handleDismissAlarm();
                navigateTab('blocker');
              }}
              className="min-h-[44px] w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm"
            >
              {isHindi ? 'अभी पढ़ाई शुरू करें' : 'Start Study Session Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
