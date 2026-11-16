import React, { useState } from 'react';
import { AlarmClock, Plus, Trash2 } from 'lucide-react';
import { EXAM_TRACK_LABELS, JEE_CHAPTERS } from '../data/jeeCatalog';
import { PersistedAppState, Subject } from '../types';
import { formatHm, formatMmSs } from '../utils/localStorageState';

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
  const trackLabel = state.language === 'hi' ? trackMeta.hi : trackMeta.en;

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

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiBox label="Weekly Study Time" value={formatHm(totalWeekMin)} accent="text-cyan-500" />
        <KpiBox
          label={`${trackLabel} Syllabus`}
          value={`${completedChapters} / ${scopedChapters.length}`}
          accent="text-amber-500"
        />
        <KpiBox
          label="Goals Completed"
          value={`${completedGoals} / ${state.goals.length}`}
          accent="text-emerald-500"
        />
        <KpiBox
          label="Focus Sessions"
          value={String(state.focusSessions.length)}
          accent="text-slate-900 dark:text-white"
        />
      </div>

      {/* Weekly Stacked Bar Chart */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Weekly Study Time Graph</h2>
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
            Weak Chapters Detected (Priority Revision)
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
          <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">Strong Chapters</h3>
          {strongChapters.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Complete chapters and solve practice questions with &ge;75% accuracy to unlock Strong Chapter mastery.
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

function KpiBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-5">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-2xl font-bold font-mono tabular-nums mt-1 ${accent}`}>{value}</p>
    </div>
  );
}
