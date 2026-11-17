import React, { useState } from 'react';
import { AlarmClock, ArrowRight, Bell, Brain, CalendarDays, CheckCircle2, Circle, GraduationCap, LineChart, Music2, Plus, Shield, Sparkles, Timer, Trophy, X } from 'lucide-react';
import { EXAM_TRACK_LABELS, JEE_CHAPTERS } from '../data/jeeCatalog';
import { DailyChallengeCategory, MainTab, PersistedAppState, StudyAlarm, StudyGoal, Subject, SubView } from '../types';
import { getNextAlarmSummary } from '../utils/alarmAudio';
import { formatHm, formatHms } from '../utils/localStorageState';
import { ProgressRing, StudyGuardianMascot } from './MascotEmblem';

interface HomeTabProps {
  state: PersistedAppState;
  focusRemainingSeconds: number;
  onNavigateTab: (tab: MainTab) => void;
  onOpenSubView: (view: SubView) => void;
  onToggleGoal: (id: string) => void;
  onOpenClassSelector: () => void;
  onAddCustomRevision?: (title: string, subject: Subject, time: string) => void;
  onAddAlarm?: (alarm: Omit<StudyAlarm, 'id'>) => void;
  onToggleDailyChallenge?: (id: string) => void;
  onOpenChallengeAction?: (category: DailyChallengeCategory) => void;
  onRequestNotificationPermission?: () => void;
  onOpenMusicStudio?: () => void;
}

const SUBJECT_META: { key: Subject; en: string; hi: string; color: string }[] = [
  { key: 'PHYSICS', en: 'Physics', hi: 'भौतिक विज्ञान', color: '#00D4FF' },
  { key: 'CHEMISTRY', en: 'Chemistry', hi: 'रसायन विज्ञान', color: '#FACC15' },
  { key: 'MATHEMATICS', en: 'Mathematics', hi: 'गणित', color: '#10B981' },
];

export function HomeTab({
  state,
  focusRemainingSeconds,
  onNavigateTab,
  onOpenSubView,
  onToggleGoal,
  onOpenClassSelector,
  onAddCustomRevision,
  onAddAlarm,
  onToggleDailyChallenge,
  onOpenChallengeAction,
  onRequestNotificationPermission,
  onOpenMusicStudio,
}: HomeTabProps) {
  const isHindi = state.language === 'hi';
  const activeTrackMeta = EXAM_TRACK_LABELS[state.selectedClassTrack] ?? EXAM_TRACK_LABELS.CLASS_12_BOARD;
  const activeTrackName = isHindi ? activeTrackMeta.hi : activeTrackMeta.en;
  const activeTrackTag = isHindi ? activeTrackMeta.tagHi : activeTrackMeta.tagEn;

  const [showRevModal, setShowRevModal] = useState(false);
  const [revTitle, setRevTitle] = useState('');
  const [revSubject, setRevSubject] = useState<Subject>('PHYSICS');
  const [revTime, setRevTime] = useState('07:00');

  const handleAddRevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = revTitle.trim();
    if (!title) return;
    if (onAddCustomRevision) {
      onAddCustomRevision(title, revSubject, revTime);
    }
    setRevTitle('');
    setShowRevModal(false);
  };

  const todayDay = state.weeklyStudy[state.weeklyStudy.length - 1];
  const todayMinutes = todayDay
    ? todayDay.physicsMinutes + todayDay.chemistryMinutes + todayDay.mathMinutes
    : 0;
  const dailyPercent = Math.min(100, Math.round((todayMinutes / Math.max(1, state.dailyGoalMinutes)) * 100));

  const trackChapters = JEE_CHAPTERS.filter((ch) => ch.track === state.selectedClassTrack);
  const prioritizedPool = trackChapters.length >= 3 ? trackChapters : [...trackChapters, ...JEE_CHAPTERS.filter((ch) => ch.track !== state.selectedClassTrack)];

  const upcomingRevisions = prioritizedPool
    .filter((ch) => {
      const prog = state.chapterProgress[ch.id];
      return !prog?.completed || prog.revisionCount === 0;
    })
    .slice(0, 4);

  const activeAlarmsCount = state.alarms.filter((a) => a.enabled).length;
  const nextAlarmText = getNextAlarmSummary(state.alarms, isHindi);
  const dailyChallenges = state.dailyChallenges ?? [];
  const completedChallengesCount = dailyChallenges.filter((dc) => dc.completed).length;
  const earnedChallengeXp = dailyChallenges.filter((dc) => dc.completed).reduce((sum, dc) => sum + dc.xpReward, 0);
  const totalChallengeXp = dailyChallenges.reduce((sum, dc) => sum + dc.xpReward, 0);
  const challengeProgressPct = dailyChallenges.length > 0 ? Math.round((completedChallengesCount / dailyChallenges.length) * 100) : 0;
  const canRequestBrowserNotify =
    state.notificationsEnabled &&
    typeof Notification !== 'undefined' &&
    Notification.permission === 'default' &&
    Boolean(onRequestNotificationPermission);

  return (
    <div className="space-y-6">
      {/* Hero Dashboard Card */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <StudyGuardianMascot size={64} meditating={focusRemainingSeconds > 0} />
                <div>
                  <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                    {activeTrackName} · {activeTrackTag}
                    <span aria-hidden="true"> · </span>
                    {state.studyStreakDays} {isHindi ? 'दिन की स्ट्रीक' : 'day streak'}
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                    {isHindi
                      ? `${activeTrackName} का आज का अध्ययन लक्ष्य पूरा करें`
                      : `Focus & Score High in ${activeTrackName}`}
                  </h1>
                </div>
              </div>
              <button
                onClick={onOpenClassSelector}
                className="min-h-[38px] px-3.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-bold text-cyan-700 dark:text-cyan-300 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <GraduationCap className="w-4 h-4" />
                <span>{isHindi ? 'कक्षा / परीक्षा बदलें' : 'Change Class'}</span>
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {isHindi ? 'आज की अध्ययन प्रगति' : "Today's Study Progress"}
                </span>
                <span className="font-mono tabular-nums font-semibold text-cyan-600 dark:text-cyan-400">
                  {formatHm(todayMinutes)} / {formatHm(state.dailyGoalMinutes)} ({dailyPercent}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${dailyPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-between gap-3 rounded-xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isHindi ? 'फोकस शील्ड' : 'Study Focus Shield'}
              </span>
              <span className="font-mono tabular-nums text-xs font-semibold text-amber-600 dark:text-amber-400">
                {focusRemainingSeconds > 0
                  ? formatHms(focusRemainingSeconds)
                  : isHindi
                  ? 'तैयार'
                  : 'Ready'}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {focusRemainingSeconds > 0
                ? isHindi
                  ? 'ध्यान भटकाने वाले ऐप्स और शॉर्ट्स अभी रुके हुए हैं।'
                  : 'Distracting apps and short videos are paused while you study.'
                : isHindi
                ? 'पढ़ाई के समय ध्यान भटकाने वाले ऐप्स रोकें और टाइमर शुरू करें।'
                : 'Pause distracting apps, filter Shorts, and track deep focus sessions.'}
            </p>
            <button
              onClick={() => onNavigateTab('blocker')}
              className="min-h-[44px] w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2 px-4 whitespace-nowrap"
            >
              <Shield className="w-4 h-4" />
              <span>
                {focusRemainingSeconds > 0
                  ? isHindi
                    ? 'फोकस सत्र देखें'
                    : 'Manage Active Focus'
                  : isHindi
                  ? 'फोकस मोड शुरू करें'
                  : 'Start Focus Session'}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Quick Action Grid */}
      <section aria-label="Quick Actions" className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <QuickActionTile
          icon={<Sparkles className="w-5 h-5 text-cyan-500" />}
          title={isHindi ? 'AI गुरु' : 'AI Tutor'}
          subtitle={activeTrackName}
          onClick={() => onNavigateTab('tutor')}
        />
        <QuickActionTile
          icon={<Brain className="w-5 h-5 text-emerald-500" />}
          title={isHindi ? 'मॉक टेस्ट' : 'Mock Test'}
          subtitle={isHindi ? '50-प्रश्नों का टेस्ट' : '50-Question Drill'}
          onClick={() => onNavigateTab('practice')}
        />
        <QuickActionTile
          icon={<Music2 className="w-5 h-5 text-cyan-500" />}
          title={isHindi ? 'स्टडी म्यूज़िक' : 'Study Music'}
          subtitle={isHindi ? 'लो-फ़ाई व फोकस ध्वनि' : 'Lo-Fi & Focus Sounds'}
          onClick={() => (onOpenMusicStudio ? onOpenMusicStudio() : onNavigateTab('blocker'))}
        />
        <QuickActionTile
          icon={<AlarmClock className="w-5 h-5 text-cyan-500" />}
          title={isHindi ? 'स्टडी अलार्म' : 'Study Alarms'}
          subtitle={
            nextAlarmText
              ? nextAlarmText.replace(/^Next alarm:\s*|^अगला अलार्म:\s*/i, '')
              : isHindi
              ? `${activeAlarmsCount} सक्रिय अलार्म`
              : `${activeAlarmsCount} active`
          }
          onClick={() => onOpenSubView('alarms')}
        />
        <QuickActionTile
          icon={<Shield className="w-5 h-5 text-cyan-500" />}
          title={isHindi ? 'ऐप ब्लॉकर' : 'App Blocker'}
          subtitle={isHindi ? 'ध्यान भटकाव रोकें' : 'Apps & YouTube'}
          onClick={() => onNavigateTab('blocker')}
        />
        <QuickActionTile
          icon={<CalendarDays className="w-5 h-5 text-amber-500" />}
          title={isHindi ? 'टाइमटेबल' : 'Study Planner'}
          subtitle={isHindi ? 'दैनिक लक्ष्य व समय' : 'Goals & Pomodoro'}
          onClick={() => onOpenSubView('planner')}
        />
        <QuickActionTile
          icon={<LineChart className="w-5 h-5 text-emerald-500" />}
          title={isHindi ? 'प्रगति रिपोर्ट' : 'Study Reports'}
          subtitle={isHindi ? 'अध्याय व अध्ययन समय' : 'Chapters & Hours'}
          onClick={() => onOpenSubView('analytics')}
        />
      </section>

      {/* Daily AI Challenges Section */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-400/15 text-amber-500 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isHindi ? 'आज के डेली AI चैलेंज' : 'Daily AI Challenges'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {isHindi
                  ? `${completedChallengesCount}/${dailyChallenges.length} पूर्ण · ${earnedChallengeXp}/${totalChallengeXp} XP अर्जित`
                  : `${completedChallengesCount}/${dailyChallenges.length} completed · ${earnedChallengeXp}/${totalChallengeXp} XP earned today`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canRequestBrowserNotify && (
              <button
                type="button"
                onClick={onRequestNotificationPermission}
                className="min-h-[38px] px-3 rounded-xl border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-amber-600 dark:text-amber-300 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{isHindi ? 'रिमाइंडर नोटिफिकेशन चालू करें' : 'Enable Push Reminders'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenSubView('analytics')}
              className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:border-cyan-500/60"
            >
              {isHindi ? 'सभी एनालिटिक्स देखें' : 'View Analytics'}
            </button>
          </div>
        </div>

        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-300"
            style={{ width: `${challengeProgressPct}%` }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dailyChallenges.map((dc) => {
            const actionLabel =
              dc.category === 'TUTOR'
                ? isHindi
                  ? 'AI गुरु खोलें'
                  : 'Ask AI Guru'
                : dc.category === 'FOCUS'
                ? isHindi
                  ? 'फोकस शुरू करें'
                  : 'Start Focus'
                : dc.category === 'MOCK_TEST'
                ? isHindi
                  ? 'टेस्ट दें'
                  : 'Take Test'
                : isHindi
                ? 'रिवीजन देखें'
                : 'Open Planner';

            return (
              <div
                key={dc.id}
                className={`p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                  dc.completed
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#06102B]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggleDailyChallenge?.(dc.id)}
                  aria-label={dc.completed ? 'Mark challenge incomplete' : 'Mark challenge complete'}
                  className="mt-0.5 text-left flex items-start gap-3 min-w-0 flex-1"
                >
                  {dc.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        dc.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {isHindi ? dc.titleHi : dc.titleEn}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {isHindi ? dc.descriptionHi : dc.descriptionEn}
                    </p>
                    <span className="inline-block mt-1.5 text-[11px] font-mono font-bold text-amber-500 tabular-nums">
                      +{dc.xpReward} XP
                    </span>
                  </div>
                </button>

                {!dc.completed && onOpenChallengeAction && (
                  <button
                    type="button"
                    onClick={() => onOpenChallengeAction(dc.category)}
                    className="min-h-[36px] px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 text-xs font-bold whitespace-nowrap shrink-0"
                  >
                    {actionLabel}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Main 3-Column Content Area */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Progress */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isHindi ? 'विषय प्रगति' : 'Subject Progress'}
            </h2>
            <button
              onClick={() => onNavigateTab('practice')}
              className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline whitespace-nowrap"
            >
              {isHindi ? 'मॉक टेस्ट दें' : 'Take Mock Test'}
            </button>
          </div>
          <div className="space-y-4">
            {SUBJECT_META.map((subj) => {
              const trackSubjectChapters = JEE_CHAPTERS.filter(
                (c) => c.subject === subj.key && c.track === state.selectedClassTrack
              );
              const chapters =
                trackSubjectChapters.length > 0
                  ? trackSubjectChapters
                  : JEE_CHAPTERS.filter((c) => c.subject === subj.key);
              const done = chapters.filter((c) => state.chapterProgress[c.id]?.completed).length;
              const pct = chapters.length ? (done / chapters.length) * 100 : 0;
              const mins =
                subj.key === 'PHYSICS'
                  ? todayDay?.physicsMinutes ?? 0
                  : subj.key === 'CHEMISTRY'
                  ? todayDay?.chemistryMinutes ?? 0
                  : todayDay?.mathMinutes ?? 0;

              return (
                <div
                  key={subj.key}
                  className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {isHindi ? subj.hi : subj.en}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {done} {isHindi ? 'में से' : 'of'} {chapters.length} {isHindi ? 'अध्याय' : 'chapters'} · {formatHm(mins)}{' '}
                      {isHindi ? 'आज' : 'today'}
                    </p>
                  </div>
                  <ProgressRing percent={pct} color={subj.color} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Study Goals */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isHindi ? 'दैनिक लक्ष्य' : 'Daily Study Goals'}
            </h2>
            <button
              onClick={() => onOpenSubView('planner')}
              className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline whitespace-nowrap"
            >
              {isHindi ? 'लक्ष्य जोड़ें' : 'Manage Goals'}
            </button>
          </div>
          <div className="space-y-2.5">
            {state.goals.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isHindi
                  ? 'अभी कोई लक्ष्य नहीं जोड़ा गया है। स्टडी प्लानर में आज के लक्ष्य जोड़ें।'
                  : "No study goals set yet. Open Study Planner to add today's targets."}
              </p>
            ) : (
              state.goals.slice(0, 5).map((goal: StudyGoal) => (
                <label
                  key={goal.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer min-h-[44px]"
                >
                  <input
                    type="checkbox"
                    checked={goal.completed}
                    onChange={() => onToggleGoal(goal.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${
                        goal.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {goal.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {goal.subject} · {goal.targetMinutes} min
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Revision Queue */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isHindi ? 'आगामी पुनरावृत्ति' : 'Upcoming Revision'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRevModal(true)}
                className="min-h-[36px] px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 font-semibold text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isHindi ? 'शेड्यूल जोड़ें' : 'Add Schedule'}</span>
              </button>
              <Timer className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="space-y-3">
            {state.customRevisions?.map((rev) => (
              <div
                key={rev.id}
                className="flex items-center justify-between gap-3 pb-3 border-b border-cyan-500/20 bg-cyan-500/5 p-2.5 rounded-xl"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500 text-slate-950 uppercase">
                      {isHindi ? 'कस्टम' : 'Custom'}
                    </span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{rev.title}</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                    {rev.subject} · ⏰ {rev.time}
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('practice')}
                  className="min-h-[38px] px-3 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>{isHindi ? 'दोहराएं' : 'Revise'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {upcomingRevisions.map((ch) => {
              const chMeta = EXAM_TRACK_LABELS[ch.track] ?? EXAM_TRACK_LABELS.CLASS_12_BOARD;
              const trackName = isHindi ? chMeta.hi : chMeta.en;
              return (
                <div
                  key={ch.id}
                  className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{ch.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {ch.subject} · {trackName} · {ch.weightagePercent}% weightage
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('practice')}
                    className="min-h-[40px] px-3 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <span>{isHindi ? 'दोहराएं' : 'Revise'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Add Custom Revision Schedule Modal */}
      {showRevModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isHindi ? 'नया चैप्टर रिवीजन शेडूल जोड़ें' : 'Add Custom Revision Schedule'}
              </h3>
              <button
                type="button"
                onClick={() => setShowRevModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddRevSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {isHindi ? 'चैप्टर / टॉपिक का नाम' : 'Chapter / Topic Name'}
                </label>
                <input
                  type="text"
                  value={revTitle}
                  onChange={(e) => setRevTitle(e.target.value)}
                  placeholder={isHindi ? 'जैसे: Electrostatics Formula Revision' : 'e.g., Electrostatics Formula Revision'}
                  required
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {isHindi ? 'विषय (Subject)' : 'Subject'}
                  </label>
                  <select
                    value={revSubject}
                    onChange={(e) => setRevSubject(e.target.value as Subject)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-xs font-semibold"
                  >
                    <option value="PHYSICS">{isHindi ? 'भौतिकी' : 'Physics'}</option>
                    <option value="CHEMISTRY">{isHindi ? 'रसायन' : 'Chemistry'}</option>
                    <option value="MATHEMATICS">{isHindi ? 'गणित' : 'Mathematics'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {isHindi ? 'रिमाइंडर समय (Notification)' : 'Reminder Time'}
                  </label>
                  <input
                    type="time"
                    value={revTime}
                    onChange={(e) => setRevTime(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] font-mono text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isHindi
                  ? 'यह शेडूल आगामी पुनरावृत्ति सूची में जुड़ेगा और निश्चित समय पर अलार्म नोटिफिकेशन रिंग करेगा।'
                  : 'This schedule will be added to your Upcoming Revision and ring a notification alarm at the exact set time.'}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRevModal(false)}
                  className="min-h-[40px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  {isHindi ? 'शेड्यूल सहेजें' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickActionTile({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="min-h-[84px] text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] hover:border-cyan-500/60 dark:hover:border-cyan-400/60 p-4 transition-colors flex flex-col justify-between gap-2"
    >
      <div className="flex items-center justify-between w-full">
        {icon}
        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
      </div>
    </button>
  );
}
