import React, { useState } from 'react';
import { AlarmClock, Bell, BellOff, Plus, Trash2, Volume2 } from 'lucide-react';
import { LanguageMode, StudyAlarm, Subject } from '../types';
import { formatTime12h, getNextAlarmSummary, playAlarmChimeOnce } from '../utils/alarmAudio';

const WEEKDAYS = [
  { num: 1, en: 'Mon', hi: 'सोम' },
  { num: 2, en: 'Tue', hi: 'मंगल' },
  { num: 3, en: 'Wed', hi: 'बुध' },
  { num: 4, en: 'Thu', hi: 'गुरु' },
  { num: 5, en: 'Fri', hi: 'शुक्र' },
  { num: 6, en: 'Sat', hi: 'शनि' },
  { num: 7, en: 'Sun', hi: 'रवि' },
];

export function AlarmsView({
  alarms,
  language,
  onAddAlarm,
  onToggleAlarm,
  onDeleteAlarm,
}: {
  alarms: StudyAlarm[];
  language: LanguageMode;
  onAddAlarm: (alarm: Omit<StudyAlarm, 'id'>) => void;
  onToggleAlarm: (id: string) => void;
  onDeleteAlarm: (id: string) => void;
}) {
  const isHindi = language === 'hi';
  const [time, setTime] = useState('06:30');
  const [label, setLabel] = useState('');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [tone, setTone] = useState<StudyAlarm['tone']>('chime');
  const [subject, setSubject] = useState<Subject>('PHYSICS');

  const nextSummary = getNextAlarmSummary(alarms, isHindi);

  const toggleDay = (dayNum: number) => {
    setDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum].sort((a, b) => a - b)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel =
      label.trim() ||
      (isHindi ? 'अध्ययन और रिवीजन अलार्म' : 'Study & Revision Alarm');
    onAddAlarm({
      time,
      label: cleanLabel,
      days,
      enabled: true,
      tone,
      subject,
    });
    setLabel('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Add Study Alarm Card */}
      <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <AlarmClock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isHindi ? 'नया अध्ययन अलार्म लगाएं' : 'Set a Study Alarm'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isHindi
                ? 'सुबह उठने, रिवीजन और मॉक टेस्ट के समय पर रिंग अलार्म पाएं।'
                : 'Schedule wake-up, chapter revision, or mock test ring reminders.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                {isHindi ? 'अलार्म समय' : 'Alarm Time'}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-base font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                {isHindi ? 'विषय (Subject)' : 'Subject'}
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-xs font-semibold"
              >
                <option value="PHYSICS">{isHindi ? 'भौतिक विज्ञान' : 'Physics'}</option>
                <option value="CHEMISTRY">{isHindi ? 'रसायन विज्ञान' : 'Chemistry'}</option>
                <option value="MATHEMATICS">{isHindi ? 'गणित' : 'Mathematics'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              {isHindi ? 'अलार्म का नाम / लक्ष्य' : 'Alarm Label'}
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={
                isHindi ? 'जैसे: सुबह बोर्ड फॉर्मूला रिवीजन' : 'e.g., Morning Formula Revision'
              }
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {isHindi ? 'दोहराने के दिन (खाली = रोज़ाना)' : 'Repeat Days (empty = Every day)'}
              </span>
              <button
                type="button"
                onClick={() => setDays([])}
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                {isHindi ? 'रोज़ाना' : 'Every day'}
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((d) => {
                const active = days.includes(d.num);
                return (
                  <button
                    type="button"
                    key={d.num}
                    onClick={() => toggleDay(d.num)}
                    className={`min-h-[38px] rounded-lg text-xs font-semibold border transition-colors ${
                      active
                        ? 'border-cyan-500 bg-cyan-500 text-slate-950'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isHindi ? d.hi : d.en}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {isHindi ? 'अलार्म टोन' : 'Alarm Sound'}
              </span>
              <button
                type="button"
                onClick={() => playAlarmChimeOnce(tone)}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1 hover:underline"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isHindi ? 'आवाज़ सुनें' : 'Test Sound'}</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'chime', en: 'Bright Chime', hi: 'मधुर घंटी' },
                  { id: 'bell', en: 'Classic Bell', hi: 'क्लासिक बेल' },
                  { id: 'focus', en: 'Soft Focus', hi: 'फोकस टोन' },
                ] as const
              ).map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`min-h-[38px] rounded-xl border text-xs font-semibold ${
                    tone === t.id
                      ? 'border-amber-400 bg-amber-400/15 text-amber-700 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isHindi ? t.hi : t.en}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="min-h-[46px] w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isHindi ? 'अलार्म सेव करें' : 'Save Study Alarm'}</span>
          </button>
        </form>
      </div>

      {/* Saved Alarms List */}
      <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isHindi ? 'आपके अध्ययन अलार्म' : 'Your Study Alarms'}
            </h2>
            <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium mt-0.5">
              {nextSummary ?? (isHindi ? 'कोई सक्रिय अलार्म नहीं है' : 'No active alarms scheduled')}
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {alarms.filter((a) => a.enabled).length} / {alarms.length} {isHindi ? 'सक्रिय' : 'active'}
          </span>
        </div>

        {alarms.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
            {isHindi
              ? 'अभी कोई अलार्म नहीं है। बाईं ओर से अपना पहला अध्ययन अलार्म जोड़ें।'
              : 'No study alarms yet. Add your first wake-up or revision alarm on the left.'}
          </div>
        ) : (
          <div className="space-y-3">
            {alarms.map((alarm) => {
              const alarmDays = Array.isArray(alarm.days) ? alarm.days : [];
              const dayText =
                alarmDays.length === 0 || alarmDays.length === 7
                  ? isHindi
                    ? 'रोज़ाना'
                    : 'Every day'
                  : alarmDays
                      .map((num) => {
                        const found = WEEKDAYS.find((w) => w.num === num);
                        return found ? (isHindi ? found.hi : found.en) : '';
                      })
                      .filter(Boolean)
                      .join(', ');

              return (
                <div
                  key={alarm.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-colors ${
                    alarm.enabled
                      ? 'bg-slate-50 dark:bg-[#06102B] border-cyan-500/40'
                      : 'bg-slate-50/50 dark:bg-[#06102B]/50 border-slate-200 dark:border-slate-800 opacity-75'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                        {formatTime12h(alarm.time)}
                      </span>
                      {alarm.subject && (
                        <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                          {alarm.subject}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                      {alarm.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{dayText}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onToggleAlarm(alarm.id)}
                      className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
                        alarm.enabled
                          ? 'bg-cyan-500 text-slate-950'
                          : 'border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {alarm.enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                      <span>{alarm.enabled ? (isHindi ? 'चालू' : 'ON') : isHindi ? 'बंद' : 'OFF'}</span>
                    </button>
                    <button
                      onClick={() => onDeleteAlarm(alarm.id)}
                      className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 flex items-center justify-center"
                      aria-label="Delete alarm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
