import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, GraduationCap } from 'lucide-react';
import { EXAM_TRACK_LABELS } from '../data/jeeCatalog';
import { ExamTrack, LanguageMode } from '../types';
import { StudyGuardianMascot } from './MascotEmblem';

const TRACK_ORDER: ExamTrack[] = [
  'CLASS_9',
  'CLASS_10_BOARD',
  'CLASS_11',
  'CLASS_12_BOARD',
  'JEE_MAIN',
  'JEE_ADVANCED',
  'NEET',
  'CUET_NDA',
];

export function ClassSelectionModal({
  currentTrack,
  language,
  isInitialSetup,
  onSelectTrack,
  onChangeLanguage,
  onClose,
}: {
  currentTrack: ExamTrack;
  language: LanguageMode;
  isInitialSetup: boolean;
  onSelectTrack: (track: ExamTrack) => void;
  onChangeLanguage: (lang: LanguageMode) => void;
  onClose?: () => void;
}) {
  const safeInitial = currentTrack in EXAM_TRACK_LABELS ? currentTrack : 'CLASS_12_BOARD';
  const [picked, setPicked] = useState<ExamTrack>(safeInitial);
  const isHindi = language === 'hi';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl border border-cyan-500/30 bg-white dark:bg-[#08153B] p-6 sm:p-8 space-y-6 shadow-2xl my-auto">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <StudyGuardianMascot size={56} />
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                <GraduationCap className="w-4 h-4" />
                <span>{isHindi ? 'पहले अपनी कक्षा या परीक्षा चुनें' : 'Step 1 · Choose Your Class or Exam'}</span>
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {isHindi ? 'आप किस कक्षा / परीक्षा की तैयारी कर रहे हैं?' : 'What are you preparing for?'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#050C24] border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => onChangeLanguage('en')}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold ${
                language === 'en' ? 'bg-white dark:bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onChangeLanguage('hi')}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold ${
                language === 'hi' ? 'bg-white dark:bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          {isHindi
            ? 'आपके चयन के अनुसार होम डैशबोर्ड, AI स्टडी ट्यूटर, पाठ्यक्रम, सूत्र और मॉक टेस्ट अपने आप सेट हो जाएंगे।'
            : 'Your Dashboard, AI Study Tutor, Syllabus, Formulas, and Mock Tests will automatically adapt to your selected class or exam.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TRACK_ORDER.map((track) => {
            const meta = EXAM_TRACK_LABELS[track];
            const selected = picked === track;
            return (
              <button
                key={track}
                onClick={() => setPicked(track)}
                className={`min-h-[68px] p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                  selected
                    ? 'border-cyan-500 bg-cyan-500/12 ring-2 ring-cyan-500/25'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#050C24]/70 hover:border-cyan-500/50'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {isHindi ? meta.hi : meta.en}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isHindi ? meta.tagHi : meta.tagEn}
                  </p>
                </div>
                {selected && <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          {!isInitialSetup && onClose && (
            <button
              onClick={onClose}
              className="min-h-[44px] px-5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              {isHindi ? 'रद्द करें' : 'Cancel'}
            </button>
          )}
          <button
            onClick={() => onSelectTrack(picked)}
            className="min-h-[46px] px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm inline-flex items-center gap-2"
          >
            <span>
              {isHindi
                ? `${(EXAM_TRACK_LABELS[picked] ?? EXAM_TRACK_LABELS.CLASS_12_BOARD).hi} के साथ शुरू करें`
                : `Continue with ${(EXAM_TRACK_LABELS[picked] ?? EXAM_TRACK_LABELS.CLASS_12_BOARD).en}`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
