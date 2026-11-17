import React, { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { AlarmClock, Bell, BellRing, BookOpen, Cloud, Fingerprint, GraduationCap, Home, LogIn, Music2, Pause, Play, Settings, Shield, SkipForward, Sparkles, X } from 'lucide-react';
import { AiTutorTab } from './components/AiTutorTab';
import { AlarmsView } from './components/AlarmsView';
import { AuthGateScreen } from './components/AuthGateScreen';
import { BlockerAndFocusTab } from './components/BlockerAndFocusTab';
import { ClassSelectionModal } from './components/ClassSelectionView';
import { HomeTab } from './components/HomeTab';
import { AnalyticsView, PlannerView } from './components/PlannerAndAnalyticsViews';
import { PracticeAndTestTab } from './components/PracticeAndTestTab';
import { SettingsTab } from './components/SettingsAndSourceTab';
import { buildDailyChallengesForDate, EXAM_TRACK_LABELS, getLocalDateIso, INITIAL_APP_STATE } from './data/jeeCatalog';
import {
  formatFirebaseAuthError,
  loadCloudMockTests,
  loadCloudStudyState,
  saveMockTestResultToCloud,
  signInWithGoogle,
  signOutFirebase,
  subscribeToAuth,
  syncStudyStateToCloud,
} from './firebase';
import { DailyChallengeCategory, ExamTrack, MainTab, MockTestResult, PersistedAppState, StudyAlarm, SubView } from './types';
import { formatTime12h, startAlarmRingLoop, stopAlarmRingLoop } from './utils/alarmAudio';
import {
  hasEnrolledWebBiometric,
  hasFallbackStudyPin,
  verifyFallbackStudyPin,
  verifyWebBiometric,
} from './utils/biometricWebAuth';
import { clearPersistedState, loadPersistedState, sanitizePersistedState, savePersistedState, sendLocalNotificationSafe } from './utils/localStorageState';
import { BUILTIN_STUDY_TRACKS, studyMusicPlayer, StudyMusicTrack } from './utils/studyMusicPlayer';

interface InAppNotificationItem {
  id: string;
  title: string;
  body: string;
  actionTab?: MainTab;
  actionSubView?: SubView;
}

function parseHhMmToMinutes(hhmm: string): number | null {
  const parts = hhmm.split(':');
  if (parts.length !== 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function withChallengeCompleted(
  state: PersistedAppState,
  category: DailyChallengeCategory
): PersistedAppState {
  let changed = false;
  const nextChallenges = (state.dailyChallenges ?? []).map((dc) => {
    if (dc.category === category && !dc.completed) {
      changed = true;
      return { ...dc, completed: true, completedAt: Date.now() };
    }
    return dc;
  });
  return changed ? { ...state, dailyChallenges: nextChallenges } : state;
}

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
  const [notifications, setNotifications] = useState<InAppNotificationItem[]>([]);
  const firedAlarmKeysRef = useRef<Set<string>>(new Set());
  const firedNotificationKeysRef = useRef<Set<string>>(new Set());

  // Pomodoro state
  const [pomodoroPhase, setPomodoroPhase] = useState<'STUDY' | 'BREAK'>('STUDY');
  const [pomodoroRemainingSec, setPomodoroRemainingSec] = useState(state.pomodoroStudyMin * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);

  // Persistent Study Music Player state
  const [blockerSubTab, setBlockerSubTab] = useState<'focus' | 'music' | 'apps' | 'youtube' | 'content_filter'>('focus');
  const [customMusicTracks, setCustomMusicTracks] = useState<StudyMusicTrack[]>([]);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicLoop, setMusicLoop] = useState(true);
  const [musicCurrentSec, setMusicCurrentSec] = useState(0);
  const [musicDurationSec, setMusicDurationSec] = useState(0);

  // Firebase Auth, Cloud Sync & Fingerprint Lock state
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const stateRef = useRef<PersistedAppState>(state);
  stateRef.current = state;
  const [isAppUnlocked, setIsAppUnlocked] = useState<boolean>(() => {
    const initial = loadPersistedState();
    if (!initial.biometricLockEnabled) return true;
    return !hasEnrolledWebBiometric() && !hasFallbackStudyPin();
  });
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockFeedback, setUnlockFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToAuth(async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user) {
        setSyncStatus(null);
        return;
      }
      try {
        const [cloud, cloudTests] = await Promise.all([
          loadCloudStudyState(user),
          loadCloudMockTests(user),
        ]);

        const currentState = stateRef.current;
        const mergedChapterProgress = { ...currentState.chapterProgress };
        if (cloud?.completedChapterIds?.length) {
          for (const chapterId of cloud.completedChapterIds) {
            const existing = mergedChapterProgress[chapterId] ?? {
              completed: false,
              revisionCount: 0,
              practiceAttempted: 0,
              practiceCorrect: 0,
            };
            mergedChapterProgress[chapterId] = { ...existing, completed: true };
          }
        }

        const mergedTestMap = new Map<string, MockTestResult>();
        for (const item of [...cloudTests, ...currentState.testHistory]) {
          const dedupKey = `${item.id}_${item.timestamp}_${item.score}`;
          if (!mergedTestMap.has(dedupKey)) {
            mergedTestMap.set(dedupKey, item);
          }
        }
        const mergedTests = Array.from(mergedTestMap.values()).sort((a, b) => b.timestamp - a.timestamp);

        const mergedState: PersistedAppState = {
          ...currentState,
          chapterProgress: mergedChapterProgress,
          testHistory: mergedTests,
          studyStreakDays: Math.max(currentState.studyStreakDays, cloud?.studyStreakDays ?? 1),
        };

        setState(mergedState);
        const synced = await syncStudyStateToCloud(user, mergedState);
        setSyncStatus(
          `Synced with Firebase (${mergedTests.length} saved tests · ${synced.xpPoints} XP · ${synced.studyStreakDays}d streak)`
        );
      } catch (err) {
        console.error('[Firebase Auth Sync]', err);
        setSyncStatus('Signed in. Cloud sync will retry automatically.');
      }
    });
    return unsub;
  }, []);

  const handleSignInGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        const snap = await syncStudyStateToCloud(user, stateRef.current);
        setSyncStatus(`Signed in & synced (${user.displayName || user.email} · ${snap.totalMockTests} tests)`);
      }
    } catch (err) {
      setSyncStatus(formatFirebaseAuthError(err, stateRef.current.language === 'hi'));
    }
  };

  const handleSignOutGoogle = async () => {
    await signOutFirebase();
    setSyncStatus(null);
  };

  const handleSyncCloudNow = async () => {
    if (!firebaseUser) return;
    try {
      const snap = await syncStudyStateToCloud(firebaseUser, stateRef.current);
      setSyncStatus(`Synced ${snap.totalMockTests} saved tests, ${snap.completedChapterIds.length} chapters & ${snap.xpPoints} XP.`);
    } catch (err) {
      setSyncStatus(err instanceof Error ? err.message : 'Sync failed');
    }
  };

  const allMusicTracks = [...BUILTIN_STUDY_TRACKS, ...customMusicTracks];
  const activeMusicTrack =
    allMusicTracks.find((t) => t.id === state.studyMusicTrackId) ?? BUILTIN_STUDY_TRACKS[0];

  useEffect(() => {
    studyMusicPlayer.setVolume(state.studyMusicVolume ?? 0.45);
  }, [state.studyMusicVolume]);

  useEffect(() => {
    studyMusicPlayer.setLoop(musicLoop);
  }, [musicLoop]);

  useEffect(() => {
    studyMusicPlayer.setCallbacks(
      (cur, dur) => {
        setMusicCurrentSec(cur);
        setMusicDurationSec(dur);
      },
      () => {
        const currentIdx = allMusicTracks.findIndex((t) => t.id === activeMusicTrack.id);
        const nextTrack = allMusicTracks[(currentIdx + 1) % allMusicTracks.length];
        if (nextTrack) {
          setState((s) => ({ ...s, studyMusicTrackId: nextTrack.id }));
          studyMusicPlayer.playTrack(nextTrack);
          setMusicPlaying(true);
        } else {
          setMusicPlaying(false);
        }
      }
    );
  });

  useEffect(() => {
    return () => {
      studyMusicPlayer.stop();
    };
  }, []);

  const handleToggleMusicPlay = () => {
    if (musicPlaying) {
      studyMusicPlayer.stop();
      setMusicPlaying(false);
    } else {
      const ok = studyMusicPlayer.playTrack(activeMusicTrack);
      setMusicPlaying(ok);
    }
  };

  const handleSelectMusicTrack = (trackId: string, autoPlay = true) => {
    const found = allMusicTracks.find((t) => t.id === trackId);
    if (!found) return;
    setState((s) => ({ ...s, studyMusicTrackId: found.id }));
    if (autoPlay || musicPlaying) {
      const ok = studyMusicPlayer.playTrack(found);
      setMusicPlaying(ok);
    }
  };

  const handleStepMusicTrack = (direction: -1 | 1) => {
    if (allMusicTracks.length === 0) return;
    const idx = allMusicTracks.findIndex((t) => t.id === activeMusicTrack.id);
    const nextIdx = (idx + direction + allMusicTracks.length) % allMusicTracks.length;
    handleSelectMusicTrack(allMusicTracks[nextIdx].id, true);
  };

  const handleAddCustomMusicFiles = (files: FileList) => {
    const added: StudyMusicTrack[] = [];
    Array.from(files).forEach((file, i) => {
      if (!file.type.startsWith('audio/') && !/\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(file.name)) {
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^.]+$/, '');
      added.push({
        id: `custom_audio_${Date.now()}_${i}`,
        titleEn: cleanName,
        titleHi: cleanName,
        subtitleEn: 'Custom study track from your device',
        subtitleHi: 'आपके डिवाइस से जोड़ा गया स्टडी ऑडियो',
        kind: 'custom',
        tag: 'Device Audio',
        objectUrl,
      });
    });
    if (added.length > 0) {
      setCustomMusicTracks((prev) => [...added, ...prev]);
      const first = added[0];
      setState((s) => ({ ...s, studyMusicTrackId: first.id }));
      const ok = studyMusicPlayer.playTrack(first);
      setMusicPlaying(ok);
    }
  };

  const handleRemoveCustomMusicTrack = (trackId: string) => {
    const target = customMusicTracks.find((t) => t.id === trackId);
    if (target?.objectUrl) {
      URL.revokeObjectURL(target.objectUrl);
    }
    setCustomMusicTracks((prev) => prev.filter((t) => t.id !== trackId));
    if (activeMusicTrack.id === trackId) {
      studyMusicPlayer.stop();
      setMusicPlaying(false);
      setState((s) => ({ ...s, studyMusicTrackId: BUILTIN_STUDY_TRACKS[0].id }));
    }
  };

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

  const pushNotification = (
    dedupKey: string,
    title: string,
    body: string,
    actionTab?: MainTab,
    actionSubView?: SubView
  ) => {
    if (firedNotificationKeysRef.current.has(dedupKey)) return;
    firedNotificationKeysRef.current.add(dedupKey);
    sendLocalNotificationSafe(title, body);
    const id = `${dedupKey}_${Date.now()}`;
    setNotifications((prev) => [{ id, title, body, actionTab, actionSubView }, ...prev].slice(0, 3));
    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 9000);
  };

  // Daily Challenge rollover + Local Study Notification Scheduler
  useEffect(() => {
    const checkScheduleAndChallenges = () => {
      const todayIso = getLocalDateIso();
      if (state.dailyChallengeDate !== todayIso) {
        setState((s) => {
          if (s.dailyChallengeDate === todayIso) return s;
          const prevCompleted = (s.dailyChallenges ?? []).filter((c) => c.completed).length;
          const prevTotal = (s.dailyChallenges ?? []).length;
          const updatedHistory =
            prevTotal > 0 && !s.dailyChallengeHistory.some((h) => h.dateIso === s.dailyChallengeDate)
              ? [
                  {
                    dateIso: s.dailyChallengeDate,
                    completedCount: prevCompleted,
                    totalCount: prevTotal,
                  },
                  ...s.dailyChallengeHistory,
                ].slice(0, 30)
              : s.dailyChallengeHistory;
          return {
            ...s,
            dailyChallengeDate: todayIso,
            dailyChallenges: buildDailyChallengesForDate(todayIso, s.selectedClassTrack),
            dailyChallengeHistory: updatedHistory,
          };
        });
        return;
      }

      if (!state.notificationsEnabled) return;

      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const jsDay = now.getDay();
      const isoDay = jsDay === 0 ? 7 : jsDay;
      const hi = state.language === 'hi';

      // 1. Upcoming Timetable Study Sessions (0-10 mins before start)
      for (const slot of state.timetable) {
        if (slot.dayOfWeek !== isoDay) continue;
        const startMin = parseHhMmToMinutes(slot.startTime);
        if (startMin === null) continue;
        const diff = startMin - nowMinutes;
        if (diff >= 0 && diff <= 10) {
          pushNotification(
            `tt_${slot.id}_${todayIso}`,
            hi ? 'आगामी अध्ययन सत्र रिमाइंडर' : 'Upcoming Study Session',
            diff === 0
              ? `${slot.chapterTitle} (${slot.subject}) ${hi ? 'अभी शुरू हो रहा है' : 'is starting now'}`
              : `${slot.chapterTitle} (${slot.subject}) ${hi ? `${diff} मिनट में शुरू होगा` : `starts in ${diff} min`}`,
            undefined,
            'planner'
          );
        }
      }

      // 2. Upcoming Custom Revision Schedules (0-10 mins before start)
      for (const rev of state.customRevisions) {
        const revMin = parseHhMmToMinutes(rev.time);
        if (revMin === null) continue;
        const diff = revMin - nowMinutes;
        if (diff >= 0 && diff <= 10) {
          pushNotification(
            `rev_${rev.id}_${todayIso}`,
            hi ? 'पुनरावृत्ति रिमाइंडर' : 'Revision Session Reminder',
            diff === 0
              ? `${rev.title} (${rev.subject}) — ${hi ? 'अभी दोहराएं' : 'time to revise now'}`
              : `${rev.title} (${rev.subject}) ${hi ? `${diff} मिनट में` : `in ${diff} min`}`,
            'practice'
          );
        }
      }
    };

    checkScheduleAndChallenges();
    const intervalId = window.setInterval(checkScheduleAndChallenges, 15000);

    // Gentle Daily AI Challenge reminder shortly after opening app
    const challengeTimerId = window.setTimeout(() => {
      if (!state.notificationsEnabled) return;
      const todayIso = getLocalDateIso();
      const pending = (state.dailyChallenges ?? []).filter((c) => !c.completed);
      if (pending.length === 0) return;
      const hi = state.language === 'hi';
      pushNotification(
        `dc_nudge_${todayIso}`,
        hi ? 'आज के डेली AI चैलेंज तैयार हैं' : 'Daily AI Challenges Waiting',
        hi
          ? `${pending.length} डेली AI चैलेंज पूरे करके ${pending.reduce((s, c) => s + c.xpReward, 0)} XP कमाएं।`
          : `Complete ${pending.length} Daily AI Challenge(s) today to earn +${pending.reduce((s, c) => s + c.xpReward, 0)} XP.`,
        'home'
      );
    }, 3500);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(challengeTimerId);
    };
  }, [
    state.dailyChallengeDate,
    state.dailyChallenges,
    state.notificationsEnabled,
    state.timetable,
    state.customRevisions,
    state.language,
  ]);

  const handleRequestNotificationPermission = () => {
    if (typeof Notification === 'undefined' || typeof Notification.requestPermission !== 'function') return;
    try {
      Promise.resolve(Notification.requestPermission())
        .then((perm) => {
          if (perm === 'granted') {
            sendLocalNotificationSafe(
              'AI Study Guardian',
              state.language === 'hi'
                ? 'डेली AI चैलेंज और अध्ययन रिमाइंडर चालू हो गए हैं।'
                : 'Daily AI Challenge & study session reminders are now active.'
            );
          }
        })
        .catch(() => {});
    } catch {
      // Ignore Notification API restrictions
    }
  };

  const handleSelectClassTrack = (track: ExamTrack) => {
    setState((s) => {
      const todayIso = getLocalDateIso();
      const completedCategories = new Set(
        (s.dailyChallenges ?? []).filter((c) => c.completed).map((c) => c.category)
      );
      const nextChallenges = buildDailyChallengesForDate(todayIso, track).map((c) =>
        completedCategories.has(c.category) ? { ...c, completed: true, completedAt: Date.now() } : c
      );
      return {
        ...s,
        hasSelectedClass: true,
        selectedClassTrack: track,
        aiDefaultLevel: track,
        negativeMarkingEnabled: !track.startsWith('CLASS_'),
        dailyChallengeDate: todayIso,
        dailyChallenges: nextChallenges,
      };
    });
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

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#050C24] text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {isHindi ? 'आपकी प्रोफ़ाइल लोड हो रही है...' : 'Loading your student profile...'}
          </p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <AuthGateScreen
        language={state.language}
        onChangeLanguage={(lang) => setState((s) => ({ ...s, language: lang }))}
      />
    );
  }

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
              onClick={() => {
                setBlockerSubTab('music');
                navigateTab('blocker');
              }}
              className={`min-h-[38px] px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap ${
                musicPlaying
                  ? 'border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[#0A173B] hover:border-cyan-500/60 text-slate-800 dark:text-slate-100'
              }`}
              title={isHindi ? 'स्टडी म्यूज़िक प्लेयर खोलें' : 'Open Study Music Player'}
            >
              <Music2 className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden sm:inline">
                {musicPlaying
                  ? isHindi
                    ? 'संगीत चालू'
                    : 'Music On'
                  : isHindi
                  ? 'म्यूज़िक'
                  : 'Music'}
              </span>
            </button>
            <button
              onClick={() => setShowClassModal(true)}
              className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[#0A173B] hover:border-cyan-500/60 text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 whitespace-nowrap"
              title={isHindi ? 'कक्षा या परीक्षा बदलें' : 'Switch Class or Exam'}
            >
              <GraduationCap className="w-3.5 h-3.5 text-cyan-500" />
              <span>{activeTrackLabel}</span>
            </button>
            <button
              onClick={() => {
                if (firebaseUser) {
                  void handleSyncCloudNow();
                } else {
                  void handleSignInGoogle();
                }
              }}
              className={`min-h-[38px] px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap ${
                firebaseUser
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[#0A173B] hover:border-cyan-500/60 text-slate-800 dark:text-slate-100'
              }`}
              title={firebaseUser ? 'Sync study progress to Firebase' : 'Sign in with Google'}
            >
              {firebaseUser ? <Cloud className="w-3.5 h-3.5 text-emerald-500" /> : <LogIn className="w-3.5 h-3.5 text-cyan-500" />}
              <span className="hidden md:inline">
                {firebaseUser ? (isHindi ? 'सिंक' : 'Synced') : isHindi ? 'लॉगिन' : 'Sign In'}
              </span>
            </button>
            <button
              onClick={() => {
                setBlockerSubTab('focus');
                navigateTab('blocker');
              }}
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
                setState((s) => {
                  const target = s.goals.find((g) => g.id === id);
                  const willComplete = target ? !target.completed : false;
                  const next = {
                    ...s,
                    goals: s.goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)),
                  };
                  return willComplete ? withChallengeCompleted(next, 'REVISION') : next;
                })
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
                  return withChallengeCompleted(
                    {
                      ...s,
                      chapterProgress: {
                        ...s.chapterProgress,
                        [chapterId]: { ...prev, revisionCount: prev.revisionCount + 1 },
                      },
                    },
                    'REVISION'
                  );
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
              onSaveMockTestResult={(res) => {
                setState((s) => {
                  const next = withChallengeCompleted(
                    {
                      ...s,
                      testHistory: [res, ...s.testHistory],
                    },
                    'MOCK_TEST'
                  );
                  if (firebaseUser) {
                    void saveMockTestResultToCloud(firebaseUser, next, res)
                      .then(() => syncStudyStateToCloud(firebaseUser, next))
                      .then((snap) => {
                        setSyncStatus(
                          `Saved test "${res.title}" to Firebase (${snap.totalMockTests} total · ${snap.xpPoints} XP)`
                        );
                      })
                      .catch((err) => {
                        console.error('[Mock Test Cloud Save]', err);
                      });
                  }
                  return next;
                });
              }}
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
                setState((s) => {
                  const target = s.goals.find((g) => g.id === id);
                  const willComplete = target ? !target.completed : false;
                  const next = {
                    ...s,
                    goals: s.goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)),
                  };
                  return willComplete ? withChallengeCompleted(next, 'REVISION') : next;
                })
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
              onToggleDailyChallenge={(challengeId) =>
                setState((s) => ({
                  ...s,
                  dailyChallenges: (s.dailyChallenges ?? []).map((dc) =>
                    dc.id === challengeId
                      ? { ...dc, completed: !dc.completed, completedAt: !dc.completed ? Date.now() : undefined }
                      : dc
                  ),
                }))
              }
              onOpenChallengeAction={(category) => {
                if (category === 'TUTOR') navigateTab('tutor');
                else if (category === 'FOCUS') {
                  setBlockerSubTab('focus');
                  navigateTab('blocker');
                } else if (category === 'MOCK_TEST') navigateTab('practice');
                else openSubView('planner');
              }}
              onRequestNotificationPermission={handleRequestNotificationPermission}
              onOpenMusicStudio={() => {
                setBlockerSubTab('music');
                navigateTab('blocker');
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
                setState((s) => {
                  const next = {
                    ...s,
                    chatHistory: assistantMsg
                      ? [...s.chatHistory, userMsg, assistantMsg]
                      : [...s.chatHistory, userMsg],
                  };
                  return assistantMsg ? withChallengeCompleted(next, 'TUTOR') : next;
                })
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
              initialSubTab={blockerSubTab}
              musicTracks={allMusicTracks}
              activeMusicTrack={activeMusicTrack}
              musicPlaying={musicPlaying}
              musicLoop={musicLoop}
              musicCurrentSec={musicCurrentSec}
              musicDurationSec={musicDurationSec}
              onToggleMusicPlay={handleToggleMusicPlay}
              onSelectMusicTrack={handleSelectMusicTrack}
              onPrevMusicTrack={() => handleStepMusicTrack(-1)}
              onNextMusicTrack={() => handleStepMusicTrack(1)}
              onToggleMusicLoop={() => setMusicLoop((v) => !v)}
              onChangeMusicVolume={(vol) => setState((s) => ({ ...s, studyMusicVolume: vol }))}
              onSeekMusic={(sec) => studyMusicPlayer.seek(sec)}
              onAddCustomMusicFiles={handleAddCustomMusicFiles}
              onRemoveCustomMusicTrack={handleRemoveCustomMusicTrack}
              onToggleAutoMusicWithFocus={(enabled) =>
                setState((s) => ({ ...s, studyMusicAutoWithFocus: enabled }))
              }
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
                if (state.studyMusicAutoWithFocus && !musicPlaying) {
                  const ok = studyMusicPlayer.playTrack(activeMusicTrack);
                  setMusicPlaying(ok);
                }
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
              onStopFocus={(emergency) => {
                if (musicPlaying) {
                  studyMusicPlayer.stop();
                  setMusicPlaying(false);
                }
                setState((s) => {
                  const plannedMs = s.focusDurationMinutes * 60_000;
                  const rem =
                    s.focusPausedRemainingMs > 0
                      ? s.focusPausedRemainingMs
                      : Math.max(0, s.focusActiveUntil - Date.now());
                  const actualMinutes = Math.max(1, Math.round((plannedMs - rem) / 60_000));
                  const next: PersistedAppState = {
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
                  return !emergency ? withChallengeCompleted(next, 'FOCUS') : next;
                });
              }}
              onTogglePomodoro={() => setPomodoroRunning((r) => !r)}
              onUpdateYouTubeFilter={(patch) => setState((s) => ({ ...s, ...patch }))}
              onUpdateAiFilter={(patch) => setState((s) => ({ ...s, ...patch }))}
            />
          ) : (
            <SettingsTab
              state={state}
              firebaseUser={firebaseUser}
              syncStatus={syncStatus}
              onSignInGoogle={handleSignInGoogle}
              onSignOutGoogle={handleSignOutGoogle}
              onSyncCloudNow={handleSyncCloudNow}
              onLockAppNow={() => {
                setUnlockPin('');
                setUnlockFeedback(null);
                setIsAppUnlocked(false);
              }}
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

      {/* Local In-App Study & Daily Challenge Notification Toasts */}
      {notifications.length > 0 && (
        <div className="fixed bottom-20 md:bottom-5 right-4 z-40 w-[min(360px,calc(100vw-2rem))] space-y-2.5">
          {notifications.map((note) => (
            <div
              key={note.id}
              className="rounded-2xl border border-cyan-500/40 bg-white/95 dark:bg-[#0A173B]/95 backdrop-blur-md p-4 shadow-xl flex items-start gap-3"
            >
              <div className="h-9 w-9 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{note.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">{note.body}</p>
                {(note.actionTab || note.actionSubView) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (note.actionSubView) openSubView(note.actionSubView);
                      else if (note.actionTab) navigateTab(note.actionTab);
                      setNotifications((prev) => prev.filter((item) => item.id !== note.id));
                    }}
                    className="mt-2 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    {isHindi ? 'अभी खोलें' : 'Open Now'} →
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setNotifications((prev) => prev.filter((item) => item.id !== note.id))}
                aria-label="Dismiss notification"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Persistent Floating Study Music Mini-Player */}
      {musicPlaying && (
        <div className="fixed bottom-20 md:bottom-5 left-4 z-40 rounded-2xl border border-cyan-500/40 bg-white/95 dark:bg-[#0A173B]/95 backdrop-blur-md px-3.5 py-2.5 shadow-xl flex items-center gap-3 max-w-[300px]">
          <button
            type="button"
            onClick={() => {
              setBlockerSubTab('music');
              navigateTab('blocker');
            }}
            className="h-9 w-9 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center shrink-0"
            title={isHindi ? 'म्यूज़िक स्टूडियो खोलें' : 'Open Study Music Studio'}
          >
            <Music2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setBlockerSubTab('music');
              navigateTab('blocker');
            }}
            className="min-w-0 flex-1 text-left"
          >
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {isHindi ? activeMusicTrack.titleHi : activeMusicTrack.titleEn}
            </p>
            <p className="text-[10px] text-cyan-600 dark:text-cyan-400 truncate">{activeMusicTrack.tag}</p>
          </button>
          <button
            type="button"
            onClick={handleToggleMusicPlay}
            aria-label="Pause study music"
            className="h-8 w-8 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0"
          >
            {musicPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => handleStepMusicTrack(1)}
            aria-label="Next study track"
            className="h-8 w-8 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {/* Fingerprint / Biometric Study Lock Overlay */}
      {state.biometricLockEnabled && !isAppUnlocked && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border border-cyan-500/40 bg-white dark:bg-[#08153B] p-6 space-y-5 text-center shadow-2xl">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <Fingerprint className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isHindi ? 'ऐप अनलॉक करें' : 'Unlock AI Study Guardian'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {isHindi
                  ? 'जारी रखने के लिए फिंगरप्रिंट या Study PIN सत्यापित करें।'
                  : 'Verify your device fingerprint or enter your Study PIN to continue.'}
              </p>
            </div>

            {hasEnrolledWebBiometric() && (
              <button
                type="button"
                onClick={async () => {
                  const res = await verifyWebBiometric();
                  if (res.ok) {
                    setIsAppUnlocked(true);
                    setUnlockFeedback(null);
                  } else {
                    setUnlockFeedback(res.message);
                  }
                }}
                className="min-h-[46px] w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm inline-flex items-center justify-center gap-2"
              >
                <Fingerprint className="w-4 h-4" />
                <span>{isHindi ? 'फिंगरप्रिंट से अनलॉक करें' : 'Unlock with Fingerprint'}</span>
              </button>
            )}

            {hasFallbackStudyPin() && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (verifyFallbackStudyPin(unlockPin)) {
                    setIsAppUnlocked(true);
                    setUnlockPin('');
                    setUnlockFeedback(null);
                  } else {
                    setUnlockFeedback(isHindi ? 'गलत PIN। कृपया फिर से प्रयास करें।' : 'Incorrect Study PIN. Please try again.');
                  }
                }}
                className="space-y-2.5"
              >
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={unlockPin}
                  onChange={(e) => setUnlockPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={isHindi ? 'Study PIN दर्ज करें' : 'Enter Study PIN'}
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-center text-sm font-mono tracking-widest"
                />
                <button
                  type="submit"
                  className="min-h-[42px] w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  {isHindi ? 'PIN से अनलॉक करें' : 'Unlock with PIN'}
                </button>
              </form>
            )}

            {unlockFeedback && <p className="text-xs font-medium text-amber-500">{unlockFeedback}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
