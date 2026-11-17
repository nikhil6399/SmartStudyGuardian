import React, { useState } from 'react';
import { AlarmClock, Plus, Trash2 } from 'lucide-react';
import { EXAM_TRACK_LABELS, JEE_CHAPTERS } from '../data/jeeCatalog';
import { PersistedAppState, Subject } from '../types';
import { formatHm, formatMmSs, getLast30DaysFocusData } from '../utils/localStorageState';

const DAYS = [
  { num: 1, label: 'Mon' },
  { num: 2, label: 'Tue' },
  { num: 3, label: 'Wed' },
  { num: 4, label: 'Thu' },
  { num: 5, label: 'Fri' },
  { num: 6, label: 'Sat' },
  { num: 7, label: 'Sun' },
];

export function PlannerView({
  state,
  pomodoroPhase,
  pomodoroRemainingSec,
  pomodoroRunning,
  onTogglePomodoro,
  onResetPomodoro,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
  onAddTimetableSlot,
  onDeleteTimetableSlot,
  onOpenAlarms,
}: {
  state: PersistedAppState;
  pomodoroPhase: 'STUDY' | 'BREAK';
  pomodoroRemainingSec: number;
  pomodoroRunning: boolean;
  onTogglePomodoro: () => void;
  onResetPomodoro: () => void;
  onAddGoal: (title: string, subject: Subject, minutes: number) => void;
  onToggleGoal: (id: string) => void;
  onDeleteGoal: (id: string) => void;
  onAddTimetableSlot: (day: number, start: string, end: string, subject: Subject, chapter: string, isRevision: boolean) => void;
  onDeleteTimetableSlot: (id: string) => void;
  onOpenAlarms?: () => void;
}) {
  const [goalTitle, setGoalTitle] = useState('');
  const [goalSubject, setGoalSubject] = useState<Subject>('PHYSICS');
  const [goalMinutes, setGoalMinutes] = useState('60');

  const [selectedDay, setSelectedDay] = useState(1);
  const [slotTime, setSlotTime] = useState('07:00-09:00');
  const [slotChapter, setSlotChapter] = useState('');
  const [slotSubject, setSlotSubject] = useState<Subject>('MATHEMATICS');
  const [slotRevision, setSlotRevision] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pomodoro & Streaks */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pomodoro &amp; Streak</h2>
            <span className="font-mono tabular-nums text-xs font-semibold text-amber-500">
              {state.studyStreakDays} day streak
            </span>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              {pomodoroPhase === 'STUDY' ? 'Deep Study Block' : 'Break Reminder'}
            </p>
            <p className="font-mono tabular-nums text-4xl font-bold text-slate-900 dark:text-white">
              {formatMmSs(pomodoroRemainingSec)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onTogglePomodoro}
              className="min-h-[44px] rounded-xl bg-cyan-500 text-slate-950 font-semibold text-sm"
            >
              {pomodoroRunning ? 'Pause' : 'Start Timer'}
            </button>
            <button
              onClick={onResetPomodoro}
              className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold"
            >
              Reset
            </button>
          </div>
          {onOpenAlarms && (
            <button
              onClick={onOpenAlarms}
              className="min-h-[42px] w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-bold inline-flex items-center justify-center gap-2"
            >
              <AlarmClock className="w-4 h-4" />
              <span>Manage Study Alarms ({state.alarms.filter((a) => a.enabled).length} active)</span>
            </button>
          )}
        </div>

        {/* Daily Study Goals */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Daily Study Goals</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!goalTitle.trim()) return;
              onAddGoal(goalTitle.trim(), goalSubject, Math.max(15, Number(goalMinutes) || 60));
              setGoalTitle('');
            }}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2.5"
          >
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="New goal (e.g., Solve 35 Thermodynamics problems)"
              className="sm:col-span-6 min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm"
            />
            <select
              value={goalSubject}
              onChange={(e) => setGoalSubject(e.target.value as Subject)}
              className="sm:col-span-3 min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm"
            >
              <option value="PHYSICS">Physics</option>
              <option value="CHEMISTRY">Chemistry</option>
              <option value="MATHEMATICS">Mathematics</option>
            </select>
            <input
              type="number"
              value={goalMinutes}
              onChange={(e) => setGoalMinutes(e.target.value)}
              min={15}
              className="sm:col-span-1 min-h-[42px] px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm font-mono tabular-nums"
            />
            <button
              type="submit"
              className="sm:col-span-2 min-h-[42px] px-3 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs inline-flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {state.goals.map((g) => (
              <div key={g.id} className="py-3 flex items-center justify-between gap-3">
                <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={g.completed}
                    onChange={() => onToggleGoal(g.id)}
                    className="h-4 w-4 accent-cyan-500"
                  />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${g.completed ? 'line-through text-slate-400' : ''}`}>
                      {g.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {g.subject} · {g.targetMinutes} min
                    </p>
                  </div>
                </label>
                <button
                  onClick={() => onDeleteGoal(g.id)}
                  className="min-h-[38px] min-w-[38px] rounded-lg text-slate-400 hover:text-red-500 flex items-center justify-center"
                  aria-label="Delete goal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Timetable */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Weekly Study Timetable</h2>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#06102B]">
            {DAYS.map((d) => (
              <button
                key={d.num}
                onClick={() => setSelectedDay(d.num)}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold ${
                  selectedDay === d.num ? 'bg-white dark:bg-cyan-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!slotChapter.trim()) return;
            const [s = '07:00', end = '09:00'] = slotTime.split('-').map((x) => x.trim());
            onAddTimetableSlot(selectedDay, s, end, slotSubject, slotChapter.trim(), slotRevision);
            setSlotChapter('');
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-2.5"
        >
          <input
            type="text"
            value={slotChapter}
            onChange={(e) => setSlotChapter(e.target.value)}
            placeholder="Chapter or topic..."
            className="sm:col-span-4 min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm"
          />
          <input
            type="text"
            value={slotTime}
            onChange={(e) => setSlotTime(e.target.value)}
            placeholder="07:00-09:00"
            className="sm:col-span-2 min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm font-mono"
          />
          <select
            value={slotSubject}
            onChange={(e) => setSlotSubject(e.target.value as Subject)}
            className="sm:col-span-2 min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm"
          >
            <option value="PHYSICS">Physics</option>
            <option value="CHEMISTRY">Chemistry</option>
            <option value="MATHEMATICS">Math</option>
          </select>
          <label className="sm:col-span-2 flex items-center gap-2 text-xs px-2">
            <input
              type="checkbox"
              checked={slotRevision}
              onChange={(e) => setSlotRevision(e.target.checked)}
              className="h-4 w-4 accent-cyan-500"
            />
            <span>Revision Slot</span>
          </label>
          <button
            type="submit"
            className="sm:col-span-2 min-h-[42px] rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs"
          >
            Add Slot
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {state.timetable
            .filter((t) => t.dayOfWeek === selectedDay)
            .map((slot) => (
              <div
                key={slot.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-mono text-cyan-600 dark:text-cyan-400">
                    {slot.startTime} – {slot.endTime} · {slot.subject} {slot.isRevision ? '· Revision' : ''}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{slot.chapterTitle}</p>
                </div>
                <button
                  onClick={() => onDeleteTimetableSlot(slot.id)}
                  className="min-h-[38px] min-w-[38px] rounded-lg text-slate-400 hover:text-red-500 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export function AnalyticsView({ state }: { state: PersistedAppState }) {
  const isHindi = state.language === 'hi';
  const thirtyDaysData = getLast30DaysFocusData(state);
  const [selectedDayIso, setSelectedDayIso] = useState<string>(
    thirtyDaysData[thirtyDaysData.length - 1]?.dateIso ?? ''
  );

  const selectedDayPoint =
    thirtyDaysData.find((d) => d.dateIso === selectedDayIso) ??
    thirtyDaysData[thirtyDaysData.length - 1];

  const goalHours = Math.max(0.5, Number((state.dailyGoalMinutes / 60).toFixed(1)));
  const maxHoursIn30Days = Math.max(
    goalHours,
    2,
    ...thirtyDaysData.map((d) => d.totalHours)
  );
  const total30DayMinutes = thirtyDaysData.reduce((sum, d) => sum + d.totalMinutes, 0);
  const activeStudyDaysCount = thirtyDaysData.filter((d) => d.totalMinutes > 0).length;
  const avgDailyMinutes = activeStudyDaysCount > 0 ? Math.round(total30DayMinutes / activeStudyDaysCount) : 0;
  const goalMetDays = thirtyDaysData.filter((d) => d.totalMinutes >= state.dailyGoalMinutes).length;
  const peakDay = thirtyDaysData.reduce(
    (best, d) => (d.totalMinutes > best.totalMinutes ? d : best),
    thirtyDaysData[0]
  );

  const maxDayMin = Math.max(
    60,
    ...state.weeklyStudy.map((d) => d.physicsMinutes + d.chemistryMinutes + d.mathMinutes)
  );
  const totalWeekMin = state.weeklyStudy.reduce(
    (sum, d) => sum + d.physicsMinutes + d.chemistryMinutes + d.mathMinutes,
    0
  );

  const trackPool = JEE_CHAPTERS.filter((c) => c.track === state.selectedClassTrack);
  const scopedChapters = trackPool.length > 0 ? trackPool : JEE_CHAPTERS;
  const completedChapters = scopedChapters.filter((c) => state.chapterProgress[c.id]?.completed).length;
  const completedGoals = state.goals.filter((g) => g.completed).length;
  const trackMeta = EXAM_TRACK_LABELS[state.selectedClassTrack] ?? EXAM_TRACK_LABELS.CLASS_12_BOARD;
  const trackLabel = isHindi ? trackMeta.hi : trackMeta.en;

  // Daily AI Challenge Analytics
  const dailyChallenges = state.dailyChallenges ?? [];
  const completedChallenges = dailyChallenges.filter((c) => c.completed).length;
  const earnedChallengeXp = dailyChallenges
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.xpReward, 0);
  const totalChallengeXp = dailyChallenges.reduce((sum, c) => sum + c.xpReward, 0);

  // Mock Test Analytics
  const totalMockTests = state.testHistory.length;
  const avgMockAccuracy =
    totalMockTests > 0
      ? Math.round(
          state.testHistory.reduce((sum, t) => sum + (t.accuracyPercent || 0), 0) / totalMockTests
        )
      : 0;
  const bestMockScorePct =
    totalMockTests > 0
      ? Math.round(
          Math.max(
            ...state.testHistory.map((t) => (t.maxScore > 0 ? (t.score / t.maxScore) * 100 : 0))
          )
        )
      : 0;

  // Focus Mode & AI Guru Usage Analytics
  const completedFocusCount = state.focusSessions.filter((f) => f.status === 'COMPLETED').length;
  const earlyEndedFocusCount = state.focusSessions.filter((f) => f.status === 'EMERGENCY_UNLOCKED').length;
  const totalFocusMinutesAllTime = state.focusSessions.reduce((sum, f) => sum + (f.actualMinutes || 0), 0);
  const aiQuestionsAsked = state.chatHistory.filter((m) => m.role === 'user').length;
  const aiPhotoQuestions = state.chatHistory.filter((m) => m.role === 'user' && Boolean(m.imageDataUrl)).length;

  const weakChapters = scopedChapters
    .filter((c) => {
      const p = state.chapterProgress[c.id];
      if (!p) return true;
      const acc = p.practiceAttempted > 0 ? (p.practiceCorrect / p.practiceAttempted) * 100 : 0;
      return !p.completed || (p.practiceAttempted > 0 && acc < 60);
    })
    .slice(0, 5);

  const strongChapters = scopedChapters
    .filter((c) => {
      const p = state.chapterProgress[c.id];
      if (!p) return false;
      const acc = p.practiceAttempted > 0 ? (p.practiceCorrect / p.practiceAttempted) * 100 : 100;
      return p.completed && acc >= 75;
    })
    .slice(0, 5);

  const goalLinePct = Math.min(100, (goalHours / maxHoursIn30Days) * 100);

  return (
    <div className="space-y-6">
      {/* Comprehensive Top KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiBox
          label={isHindi ? '30 दिनों का फोकस समय' : '30-Day Focus Hours'}
          value={`${(total30DayMinutes / 60).toFixed(1)}h`}
          sub={`${formatHm(avgDailyMinutes)} ${isHindi ? 'औसत/दिन' : 'avg / active day'}`}
          accent="text-cyan-500"
        />
        <KpiBox
          label={isHindi ? 'डेली AI चैलेंज' : 'Daily AI Challenges'}
          value={`${completedChallenges} / ${dailyChallenges.length}`}
          sub={`${earnedChallengeXp} / ${totalChallengeXp} XP ${isHindi ? 'आज' : 'today'}`}
          accent="text-amber-500"
        />
        <KpiBox
          label={isHindi ? 'मॉक टेस्ट सटीकता' : 'Mock Test Accuracy'}
          value={totalMockTests > 0 ? `${avgMockAccuracy}%` : '—'}
          sub={`${totalMockTests} ${isHindi ? 'टेस्ट पूरे' : 'tests taken'}`}
          accent="text-emerald-500"
        />
        <KpiBox
          label={`${trackLabel} ${isHindi ? 'सिलेबस' : 'Syllabus'}`}
          value={`${completedChapters} / ${scopedChapters.length}`}
          sub={`${completedGoals}/${state.goals.length} ${isHindi ? 'लक्ष्य पूरे' : 'goals done'}`}
          accent="text-slate-900 dark:text-white"
        />
      </div>

      {/* 30-Day Daily Focus Hours Bar Chart */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isHindi
                ? 'पिछले 30 दिनों के दैनिक फोकस घंटे (Daily Focus Hours)'
                : 'Last 30 Days — Daily Focus Hours'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {isHindi
                ? `दैनिक लक्ष्य: ${goalHours} घंटे · लक्ष्य पूर्ण दिन: ${goalMetDays}/30 · सर्वश्रेष्ठ: ${peakDay?.fullDateLabel ?? ''} (${peakDay?.totalHours ?? 0}h)`
                : `Daily Goal: ${goalHours}h · Goal Met: ${goalMetDays}/30 days · Peak: ${peakDay?.fullDateLabel ?? ''} (${peakDay?.totalHours ?? 0}h)`}
            </p>
          </div>

          {selectedDayPoint && (
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800 text-xs tabular-nums">
              <p className="font-bold text-cyan-600 dark:text-cyan-400">{selectedDayPoint.fullDateLabel}</p>
              <p className="text-slate-700 dark:text-slate-200 font-mono">
                {selectedDayPoint.totalHours.toFixed(1)}h ({formatHm(selectedDayPoint.totalMinutes)}) ·{' '}
                {selectedDayPoint.sessionsCount} {isHindi ? 'फोकस सत्र' : 'focus sessions'}
              </p>
            </div>
          )}
        </div>

        {/* Interactive 30-Bar Visualization */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[640px] relative pt-4">
            {/* Daily Goal Dashed Reference Line */}
            <div
              className="absolute left-9 right-0 border-t border-dashed border-amber-400/70 pointer-events-none z-10 flex justify-end"
              style={{ bottom: `calc(28px + ${(goalLinePct / 100) * 160}px)` }}
            >
              <span className="text-[10px] font-mono font-semibold text-amber-500 -mt-4 bg-white dark:bg-[#0A173B] px-1">
                {goalHours}h goal
              </span>
            </div>

            <div className="flex gap-2 items-end">
              {/* Y-Axis Scale */}
              <div className="w-8 h-[160px] flex flex-col justify-between text-[10px] font-mono tabular-nums text-slate-400 pb-1 shrink-0">
                <span>{maxHoursIn30Days.toFixed(0)}h</span>
                <span>{(maxHoursIn30Days / 2).toFixed(1)}h</span>
                <span>0h</span>
              </div>

              {/* 30 Bars */}
              <div className="flex-1 grid grid-cols-[repeat(30,minmax(0,1fr))] gap-1 items-end h-[160px] border-b border-slate-200 dark:border-slate-800 pb-0.5">
                {thirtyDaysData.map((day, idx) => {
                  const pct = Math.min(100, (day.totalHours / maxHoursIn30Days) * 100);
                  const metGoal = day.totalMinutes >= state.dailyGoalMinutes;
                  const isSelected = selectedDayPoint?.dateIso === day.dateIso;
                  const barHeightPx = day.totalMinutes > 0 ? Math.max(6, Math.round((pct / 100) * 154)) : 2;

                  return (
                    <button
                      key={day.dateIso}
                      type="button"
                      onMouseEnter={() => setSelectedDayIso(day.dateIso)}
                      onFocus={() => setSelectedDayIso(day.dateIso)}
                      onClick={() => setSelectedDayIso(day.dateIso)}
                      title={`${day.fullDateLabel}: ${day.totalHours}h (${formatHm(day.totalMinutes)})`}
                      className="h-full flex flex-col items-center justify-end group focus:outline-none"
                    >
                      <div
                        style={{ height: `${barHeightPx}px` }}
                        className={`w-full rounded-t-sm transition-all ${
                          day.totalMinutes === 0
                            ? 'bg-slate-200 dark:bg-slate-800/70'
                            : metGoal
                            ? 'bg-emerald-500 group-hover:bg-emerald-400'
                            : 'bg-cyan-500 group-hover:bg-cyan-400'
                        } ${isSelected ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-white dark:ring-offset-[#0A173B]' : ''}`}
                      />
                      <span
                        className={`sr-only`}
                      >
                        {idx}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* X-Axis Key Date Ticks */}
            <div className="flex gap-2 mt-1.5">
              <div className="w-8 shrink-0" />
              <div className="flex-1 flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-400">
                <span>{thirtyDaysData[0]?.fullDateLabel}</span>
                <span>{thirtyDaysData[9]?.fullDateLabel}</span>
                <span>{thirtyDaysData[19]?.fullDateLabel}</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                  {thirtyDaysData[29]?.fullDateLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App-Wide Analytics Grid: Daily Challenges, Mock Tests, Focus & AI Guru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily AI Challenges Analytics */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isHindi ? 'डेली AI चैलेंज प्रगति' : 'Daily AI Challenges'}
            </h3>
            <span className="font-mono tabular-nums text-xs font-bold text-amber-500">
              {completedChallenges}/{dailyChallenges.length}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all"
              style={{
                width: `${dailyChallenges.length > 0 ? Math.round((completedChallenges / dailyChallenges.length) * 100) : 0}%`,
              }}
            />
          </div>
          <div className="space-y-2">
            {dailyChallenges.map((dc) => (
              <div key={dc.id} className="flex items-center justify-between gap-2 text-xs">
                <span
                  className={`truncate ${
                    dc.completed
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {dc.completed ? '✓ ' : '○ '}
                  {isHindi ? dc.titleHi : dc.titleEn}
                </span>
                <span className="font-mono tabular-nums text-slate-400 shrink-0">+{dc.xpReward} XP</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mock Test Analytics */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isHindi ? 'मॉक टेस्ट विश्लेषण' : 'Mock Test Performance'}
            </h3>
            <span className="font-mono tabular-nums text-xs font-bold text-emerald-500">
              {isHindi ? 'सर्वश्रेष्ठ' : 'Best'}: {bestMockScorePct}%
            </span>
          </div>
          {state.testHistory.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isHindi
                ? 'मॉक टेस्ट देने पर यहाँ आपके स्कोर, सटीकता और समय के ट्रेंड दिखेंगे।'
                : 'Complete a 50-question Mock Test to track score trends, accuracy %, and speed here.'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {state.testHistory.slice(0, 4).map((mt) => (
                <div key={mt.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{mt.title}</span>
                    <span className="font-mono tabular-nums text-cyan-600 dark:text-cyan-400 shrink-0">
                      {Math.round(mt.accuracyPercent)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${Math.min(100, Math.max(4, mt.accuracyPercent))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Focus Shield & AI Guru Usage */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isHindi ? 'फोकस और AI गुरु गतिविधि' : 'Focus Shield & AI Activity'}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs tabular-nums">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400">{isHindi ? 'पूर्ण फोकस सत्र' : 'Completed Focus'}</p>
              <p className="text-xl font-bold font-mono text-cyan-500 mt-0.5">{completedFocusCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400">{isHindi ? 'कुल फोकस समय' : 'Shielded Time'}</p>
              <p className="text-xl font-bold font-mono text-emerald-500 mt-0.5">{formatHm(totalFocusMinutesAllTime)}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400">{isHindi ? 'AI गुरु प्रश्न' : 'AI Guru Doubts'}</p>
              <p className="text-xl font-bold font-mono text-amber-500 mt-0.5">{aiQuestionsAsked}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400">{isHindi ? 'फोटो प्रश्न / जल्दी बंद' : 'Photo Qs / Early Exit'}</p>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {aiPhotoQuestions} / {earlyEndedFocusCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Stacked Bar Chart */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isHindi ? 'साप्ताहिक विषय-वार अध्ययन समय' : 'Weekly Subject Study Breakdown'} ({formatHm(totalWeekMin)})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cyan = Physics · Amber = Chemistry · Emerald = Mathematics
          </p>
        </div>

        <div className="grid grid-cols-7 gap-3 items-end h-52 pt-4">
          {state.weeklyStudy.map((day) => {
            const total = day.physicsMinutes + day.chemistryMinutes + day.mathMinutes;
            const pPct = (day.physicsMinutes / maxDayMin) * 100;
            const cPct = (day.chemistryMinutes / maxDayMin) * 100;
            const mPct = (day.mathMinutes / maxDayMin) * 100;
            return (
              <div key={day.dateIso} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {formatHm(total)}
                </span>
                <div className="w-full max-w-[42px] flex flex-col-reverse rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800/70 h-36">
                  <div style={{ height: `${pPct}%` }} className="bg-cyan-500" title={`Physics: ${day.physicsMinutes}m`} />
                  <div style={{ height: `${cPct}%` }} className="bg-amber-400" title={`Chemistry: ${day.chemistryMinutes}m`} />
                  <div style={{ height: `${mPct}%` }} className="bg-emerald-500" title={`Math: ${day.mathMinutes}m`} />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{day.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weak & Strong Chapter Detection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-3">
          <h3 className="text-base font-bold text-red-600 dark:text-red-400">
            {isHindi ? 'कमज़ोर अध्याय (प्राथमिक पुनरावृत्ति)' : 'Weak Chapters Detected (Priority Revision)'}
          </h3>
          {weakChapters.map((ch) => (
            <div key={ch.id} className="py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm">
              <p className="font-semibold text-slate-900 dark:text-white">{ch.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {ch.subject} · {ch.weightagePercent}% exam weightage
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-3">
          <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">
            {isHindi ? 'मज़बूत अध्याय' : 'Strong Chapters'}
          </h3>
          {strongChapters.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isHindi
                ? 'कम से कम 75% सटीकता के साथ अध्याय पूरे करें ताकि वे यहाँ दिखाई दें।'
                : 'Complete chapters and solve practice questions with >=75% accuracy to unlock Strong Chapter mastery.'}
            </p>
          ) : (
            strongChapters.map((ch) => (
              <div key={ch.id} className="py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm">
                <p className="font-semibold text-slate-900 dark:text-white">{ch.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {ch.subject} · Revisions: {state.chapterProgress[ch.id]?.revisionCount ?? 0}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function KpiBox({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-5">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-2xl font-bold font-mono tabular-nums mt-1 ${accent}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">{sub}</p>}
    </div>
  );
}
