import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  GraduationCap,
  HelpCircle,
  History,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { EXAM_TRACK_LABELS, JEE_CHAPTERS } from '../data/jeeCatalog';
import {
  DailyAiQuestionSet,
  ExamTrack,
  MockTestResult,
  PersistedAppState,
  PracticeQuestion,
  Subject,
} from '../types';
import { formatMmSs } from '../utils/localStorageState';
import { MathText } from './MathRenderer';

interface PracticeAndTestTabProps {
  state: PersistedAppState;
  isMockTestOpen: boolean;
  onOpenMockTest: () => void;
  onCloseMockTest: () => void;
  onSaveMockTestResult: (result: MockTestResult) => void;
  onSaveDailyAiSet: (set: DailyAiQuestionSet) => void;
  onRecordPracticeAttempt?: (chapterId: string, correct: boolean) => void;
  onToggleSaveQuestion?: (questionId: string) => void;
  onToggleChapterComplete?: (chapterId: string) => void;
  onLogRevision?: (chapterId: string) => void;
  onAddNote?: (chapterId: string, subject: Subject, title: string, content: string) => void;
}

const ALL_TRACKS: ExamTrack[] = [
  'CLASS_9',
  'CLASS_10_BOARD',
  'CLASS_11',
  'CLASS_12_BOARD',
  'JEE_MAIN',
  'JEE_ADVANCED',
  'NEET',
  'CUET_NDA',
];

interface ActiveMockSession {
  title: string;
  track: ExamTrack;
  subject: Subject;
  chapterName: string;
  questions: PracticeQuestion[];
  totalSeconds: number;
}

export function PracticeAndTestTab({
  state,
  isMockTestOpen,
  onOpenMockTest,
  onCloseMockTest,
  onSaveMockTestResult,
  onSaveDailyAiSet,
  onRecordPracticeAttempt,
}: PracticeAndTestTabProps) {
  const isHindi = state.language === 'hi';

  // Creation form state: Class Track + Subject + Chapter Name
  const [selectedTrack, setSelectedTrack] = useState<ExamTrack>(state.selectedClassTrack);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(state.aiDefaultSubject || 'PHYSICS');
  const [chapterInput, setChapterInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Active Mock Test Session state
  const [activeSession, setActiveSession] = useState<ActiveMockSession | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [remainingSec, setRemainingSec] = useState(3600);
  const [submittedResult, setSubmittedResult] = useState<MockTestResult | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Sync selected track when user switches class in top bar
  useEffect(() => {
    setSelectedTrack(state.selectedClassTrack);
  }, [state.selectedClassTrack]);

  // Timer loop for active mock test
  useEffect(() => {
    if (!activeSession || !isMockTestOpen || submittedResult) return;
    const interval = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeSession, isMockTestOpen, submittedResult]);

  // Auto-submit when time expires
  useEffect(() => {
    if (activeSession && isMockTestOpen && !submittedResult && remainingSec === 0) {
      handleFinalizeTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSec, activeSession, isMockTestOpen, submittedResult]);

  // Quick chapter suggestions from syllabus for selected Class & Subject
  const chapterSuggestions = JEE_CHAPTERS.filter(
    (c) =>
      c.subject === selectedSubject &&
      (c.track === selectedTrack ||
        (selectedTrack.includes('BOARD') && c.track.includes('BOARD')) ||
        (!selectedTrack.includes('BOARD') && !c.track.includes('BOARD')))
  ).slice(0, 10);

  // Fallback popular topics if syllabus catalog has fewer items
  const defaultPopularChapters: Record<Subject, string[]> = {
    PHYSICS: [
      'Kinematics',
      'Laws of Motion',
      'Work, Energy & Power',
      'Gravitation',
      'Thermodynamics',
      'Electrostatics',
      'Current Electricity',
      'Ray Optics',
      'Wave Optics',
      'Modern Physics',
    ],
    CHEMISTRY: [
      'Chemical Bonding',
      'Thermodynamics',
      'Equilibrium',
      'Electrochemistry',
      'Chemical Kinetics',
      'Coordination Compounds',
      'Organic Chemistry Mechanisms',
      'Aldehydes & Ketones',
      'Periodic Trends',
      'Solutions',
    ],
    MATHEMATICS: [
      'Quadratic Equations',
      'Matrices & Determinants',
      'Definite Integrals',
      'Differential Equations',
      'Coordinate Geometry',
      'Vectors & 3D Geometry',
      'Limits & Continuity',
      'Probability',
      'Trigonometric Functions',
      'Complex Numbers',
    ],
  };

  const displayChips =
    chapterSuggestions.length > 0
      ? chapterSuggestions.map((c) => c.title)
      : defaultPopularChapters[selectedSubject];

  const handleLaunchSession = (
    questions: PracticeQuestion[],
    track: ExamTrack,
    subject: Subject,
    chapter: string
  ) => {
    if (questions.length === 0) return;
    const sessionSeconds = Math.min(7200, Math.max(1800, questions.length * 72)); // 60 mins for 50 Qs
    setActiveSession({
      title: `${chapter} — Mock Test`,
      track,
      subject,
      chapterName: chapter,
      questions,
      totalSeconds: sessionSeconds,
    });
    setAnswers({});
    setMarkedForReview({});
    setCurrentQIndex(0);
    setRemainingSec(sessionSeconds);
    setSubmittedResult(null);
    setShowConfirmSubmit(false);
    onOpenMockTest();
  };

  const handleStartMockTest = async (targetChapter?: string) => {
    const rawChapter = targetChapter ?? chapterInput;
    const cleanChapter = rawChapter.trim();

    if (cleanChapter.length < 2) {
      setGenError(
        isHindi
          ? 'कृपया मॉक टेस्ट बनाने के लिए अध्याय का नाम लिखें या नीचे दिए गए किसी अध्याय पर क्लिक करें।'
          : 'Please enter a chapter name or select a suggestion below to create your mock test.'
      );
      return;
    }

    setGenError(null);

    // 1. Check if user already generated this chapter for today
    const todayIso = new Date().toISOString().slice(0, 10);
    const existing = state.dailyAiSets.find(
      (s) =>
        s.dateIso === todayIso &&
        s.track === selectedTrack &&
        s.subject === selectedSubject &&
        s.chapterName.toLowerCase() === cleanChapter.toLowerCase() &&
        Array.isArray(s.questions) &&
        s.questions.length >= 10
    );

    if (existing) {
      handleLaunchSession(existing.questions, existing.track, existing.subject, existing.chapterName);
      return;
    }

    // 2. Generate 50 distinct questions for selected Class & Chapter Name
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/chapter-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(state.customGeminiApiKey ? { 'X-Gemini-Api-Key': state.customGeminiApiKey } : {}),
        },
        body: JSON.stringify({
          chapterName: cleanChapter,
          subject: selectedSubject,
          track: selectedTrack,
          language: state.language,
          customApiKey: state.customGeminiApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.set || !Array.isArray(data.set.questions) || data.set.questions.length === 0) {
        setGenError(
          res.status === 429
            ? isHindi
              ? 'AI सेवा अभी व्यस्त है। कृपया कुछ सेकंड प्रतीक्षा करें और पुनः प्रयास करें।'
              : 'AI generator is busy right now. Please wait a few seconds and try again.'
            : isHindi
            ? 'मॉक टेस्ट के 50 प्रश्न तैयार नहीं हो सके। कृपया पुनः प्रयास करें।'
            : 'Could not generate 50 mock test questions right now. Please try again.'
        );
        return;
      }

      const savedSet: DailyAiQuestionSet = data.set;
      onSaveDailyAiSet(savedSet);
      handleLaunchSession(savedSet.questions, savedSet.track, savedSet.subject, savedSet.chapterName);
    } catch {
      setGenError(
        isHindi
          ? 'इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।'
          : 'Network connection unavailable. Please check your connection and try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalizeTest = () => {
    if (!activeSession || submittedResult) return;
    const questions = activeSession.questions;
    let correct = 0;
    let incorrect = 0;

    questions.forEach((q) => {
      const ans = answers[q.id];
      if (ans !== undefined) {
        const isCorrect = ans === q.correctOptionIndex;
        if (isCorrect) correct++;
        else incorrect++;
        if (onRecordPracticeAttempt) {
          onRecordPracticeAttempt(q.chapterId, isCorrect);
        }
      }
    });

    const attempted = correct + incorrect;
    const isBoardExam = activeSession.track.includes('BOARD');
    const negativeMark = state.negativeMarkingEnabled && !isBoardExam ? 1 : 0;
    const score = correct * 4 - incorrect * negativeMark;
    const maxScore = questions.length * 4;
    const accuracyPercent = attempted > 0 ? (correct / attempted) * 100 : 0;
    const durationSeconds = Math.max(1, activeSession.totalSeconds - remainingSec);

    const result: MockTestResult = {
      id: `mt_${Date.now()}`,
      title: activeSession.title,
      track: activeSession.track,
      subjectLabel: activeSession.subject,
      totalQuestions: questions.length,
      attempted,
      correct,
      incorrect,
      score,
      maxScore,
      accuracyPercent,
      durationSeconds,
      timestamp: Date.now(),
    };

    setSubmittedResult(result);
    onSaveMockTestResult(result);
    setShowConfirmSubmit(false);
  };

  const handleQuitMockTest = () => {
    setActiveSession(null);
    setSubmittedResult(null);
    onCloseMockTest();
  };

  const selectedTrackMeta = EXAM_TRACK_LABELS[selectedTrack] ?? EXAM_TRACK_LABELS.CLASS_12_BOARD;
  const selectedTrackName = isHindi ? selectedTrackMeta.hi : selectedTrackMeta.en;

  // ==========================================
  // VIEW 1: ACTIVE MOCK TEST SESSION (TIMED EXAM)
  // ==========================================
  if (isMockTestOpen && activeSession) {
    const questions = activeSession.questions;
    const totalCount = questions.length;
    const currentQ = questions[currentQIndex] ?? questions[0];
    const pickedOption = currentQ ? answers[currentQ.id] : undefined;
    const isMarked = currentQ ? Boolean(markedForReview[currentQ.id]) : false;
    const answeredCount = Object.keys(answers).length;
    const markedCount = Object.keys(markedForReview).filter((k) => markedForReview[k]).length;
    const unattemptedCount = Math.max(0, totalCount - answeredCount);

    // SUB-VIEW: SUBMITTED TEST RESULTS
    if (submittedResult) {
      return (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 mb-2">
                  <Award className="w-3.5 h-3.5" />
                  <span>{activeSession.track} · {activeSession.subject}</span>
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {submittedResult.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isHindi
                    ? 'आपका मॉक टेस्ट पूर्ण हुआ। नीचे अपना स्कोर, सटीकता व प्रत्येक प्रश्न का हल देखें।'
                    : 'Mock test completed. Review your score, accuracy, and detailed solutions below.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuitMockTest}
                  className="min-h-[44px] px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm inline-flex items-center gap-2 shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isHindi ? 'नया मॉक टेस्ट बनाएं' : 'Create New Mock Test'}</span>
                </button>
              </div>
            </div>

            {/* Scorecard Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isHindi ? 'कुल स्कोर' : 'Total Score'}
                </p>
                <p className="text-3xl font-black font-mono text-cyan-600 dark:text-cyan-400 mt-1">
                  {submittedResult.score}{' '}
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    / {submittedResult.maxScore}
                  </span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isHindi ? 'सटीकता (Accuracy)' : 'Accuracy'}
                </p>
                <p className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
                  {Math.round(submittedResult.accuracyPercent)}%
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isHindi ? 'सही / गलत' : 'Correct / Wrong'}
                </p>
                <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {submittedResult.correct}{' '}
                  <span className="text-sm font-medium text-red-500">
                    / {submittedResult.incorrect}
                  </span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isHindi ? 'लिया गया समय' : 'Time Taken'}
                </p>
                <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
                  {formatMmSs(submittedResult.durationSeconds)}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Question-by-Question Solution Review */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-500" />
              <span>{isHindi ? 'सभी 50 प्रश्नों का विस्तृत समाधान (Solutions)' : 'Detailed Solutions (All 50 Questions)'}</span>
            </h3>

            {questions.map((q, idx) => {
              const userAns = answers[q.id];
              const isAttempted = userAns !== undefined;
              const isCorrect = userAns === q.correctOptionIndex;

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {q.difficulty}
                      </span>
                    </div>

                    <div>
                      {isCorrect ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isHindi ? 'सही (+4)' : 'Correct (+4)'}</span>
                        </span>
                      ) : isAttempted ? (
                        <span className="text-xs font-bold text-red-600 dark:text-red-400 inline-flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          <span>{isHindi ? 'गलत (-1)' : 'Incorrect (-1)'}</span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-400 inline-flex items-center gap-1">
                          <HelpCircle className="w-4 h-4" />
                          <span>{isHindi ? 'छोड़ा गया (0)' : 'Unattempted (0)'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    <MathText text={q.prompt} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIdx) => {
                      const isCorrectSlot = optIdx === q.correctOptionIndex;
                      const isChosenSlot = optIdx === userAns;
                      let badgeStyle =
                        'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#06102B]/60 text-slate-700 dark:text-slate-300';

                      if (isCorrectSlot) {
                        badgeStyle =
                          'border-emerald-500/80 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-semibold';
                      } else if (isChosenSlot && !isCorrectSlot) {
                        badgeStyle =
                          'border-red-500/80 bg-red-500/15 text-red-900 dark:text-red-200 font-semibold';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${badgeStyle}`}
                        >
                          <span className="font-bold shrink-0">{String.fromCharCode(65 + optIdx)}.</span>
                          <span className="min-w-0">
                            <MathText text={opt} />
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#06102B] border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">
                      {isHindi ? 'हल व स्पष्टीकरण:' : 'Solution & Explanation:'}
                    </span>
                    <div className="text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                      <MathText text={q.explanation} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ACTIVE TEST TAKING INTERFACE
    return (
      <div className="space-y-5">
        {/* Top Floating Exam Control Bar */}
        <div className="sticky top-20 z-20 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0A173B]/95 backdrop-blur-md p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {activeSession.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isHindi ? 'प्रश्न' : 'Question'} {currentQIndex + 1} / {totalCount} · {currentQ.difficulty}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`min-h-[40px] px-3.5 rounded-xl border font-mono text-sm font-bold inline-flex items-center gap-1.5 ${
                remainingSec < 300
                  ? 'border-red-500 bg-red-500/15 text-red-600 dark:text-red-400 animate-pulse'
                  : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{formatMmSs(remainingSec)}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="min-h-[40px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
            >
              {isHindi ? 'टेस्ट सबमिट करें' : 'Submit Test'}
            </button>
          </div>
        </div>

        {/* Main Exam Grid: Question Body (Left 8 Cols) + Question Palette (Right 4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Question Display Card */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {isHindi ? 'प्रश्न संख्या' : 'Question No.'} {currentQIndex + 1}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setMarkedForReview((prev) => ({
                      ...prev,
                      [currentQ.id]: !prev[currentQ.id],
                    }))
                  }
                  className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold border transition-colors ${
                    isMarked
                      ? 'border-amber-500 bg-amber-500 text-slate-950'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isMarked
                    ? isHindi
                      ? '★ समीक्षा के लिए चिह्नित'
                      : '★ Marked for Review'
                    : isHindi
                    ? '☆ समीक्षा के लिए रखें'
                    : '☆ Mark for Review'}
                </button>
              </div>

              {/* Question Text */}
              <div className="text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                <MathText text={currentQ.prompt} />
              </div>

              {/* 4 Interactive Option Cards */}
              <div className="space-y-3">
                {currentQ.options.map((optionText, optIdx) => {
                  const isSelected = pickedOption === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }))}
                      className={`w-full text-left min-h-[50px] p-3.5 rounded-xl border text-sm font-medium transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/15 text-slate-900 dark:text-white ring-2 ring-cyan-500/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-[#06102B]/60 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span
                        className={`h-6 w-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="min-w-0 pt-0.5">
                        <MathText text={optionText} />
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={pickedOption === undefined}
                  onClick={() => {
                    setAnswers((prev) => {
                      const next = { ...prev };
                      delete next[currentQ.id];
                      return next;
                    });
                  }}
                  className="min-h-[40px] px-3.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                >
                  {isHindi ? 'उत्तर हटाएं' : 'Clear Choice'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
                    className="min-h-[40px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-30"
                  >
                    {isHindi ? 'पिछला' : 'Previous'}
                  </button>

                  <button
                    type="button"
                    disabled={currentQIndex >= totalCount - 1}
                    onClick={() => setCurrentQIndex((i) => Math.min(totalCount - 1, i + 1))}
                    className="min-h-[40px] px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold disabled:opacity-30"
                  >
                    {isHindi ? 'अगला प्रश्न' : 'Next Question'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Question Palette Sidebar (All 50 Questions Jump Grid) */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isHindi ? 'प्रश्न पैलेट (1-50)' : 'Question Palette (1-50)'}
            </h3>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <span>{isHindi ? 'उत्तर दिया' : 'Answered'}: {answeredCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                <span>{isHindi ? 'शेष प्रश्न' : 'Unanswered'}: {unattemptedCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                <span>{isHindi ? 'समीक्षा' : 'Review'}: {markedCount}</span>
              </div>
            </div>

            {/* 50-Grid Buttons */}
            <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isAns = answers[q.id] !== undefined;
                const isRev = Boolean(markedForReview[q.id]);
                const isCurrent = idx === currentQIndex;

                let btnClass =
                  'bg-slate-100 dark:bg-[#06102B] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
                if (isAns && isRev) {
                  btnClass = 'bg-amber-500 text-slate-950 border-amber-600 font-bold';
                } else if (isAns) {
                  btnClass = 'bg-emerald-500 text-slate-950 border-emerald-600 font-bold';
                } else if (isRev) {
                  btnClass = 'bg-amber-400/30 text-amber-500 border-amber-500 font-bold';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-9 rounded-lg border text-xs font-mono font-bold flex items-center justify-center transition-all ${btnClass} ${
                      isCurrent ? 'ring-2 ring-cyan-500 ring-offset-1' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="w-full min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
            >
              {isHindi ? 'टेस्ट समाप्त व सबमिट करें' : 'Finish & Submit Test'}
            </button>
          </div>
        </div>

        {/* Confirmation Modal before Final Submit */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isHindi ? 'मॉक टेस्ट सबमिट करें?' : 'Submit Mock Test?'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-2xl font-bold font-mono text-emerald-500">{answeredCount}</p>
                  <p className="text-[11px] text-slate-500">{isHindi ? 'हल किए' : 'Answered'}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <p className="text-2xl font-bold font-mono text-slate-600 dark:text-slate-300">
                    {unattemptedCount}
                  </p>
                  <p className="text-[11px] text-slate-500">{isHindi ? 'शेष' : 'Left'}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <p className="text-2xl font-bold font-mono text-amber-500">{markedCount}</p>
                  <p className="text-[11px] text-slate-500">{isHindi ? 'समीक्षा' : 'Review'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  {isHindi ? 'टेस्ट जारी रखें' : 'Keep Answering'}
                </button>
                <button
                  type="button"
                  onClick={handleFinalizeTest}
                  className="flex-1 min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  {isHindi ? 'हाँ, सबमिट करें' : 'Confirm Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: MOCK TEST SETUP PORTAL
  // Tests are created ONLY by selecting Class + entering Chapter Name
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
                {isHindi ? 'कस्टम AI मॉक टेस्ट पोर्टल' : 'Custom AI Mock Test Portal'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {isHindi ? 'मॉक टेस्ट जनरेटर' : 'Mock Test Generator'}
            </h1>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">{isHindi ? 'सक्रिय कक्षा:' : 'Active Class:'} </span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400">{selectedTrackName}</span>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          {isHindi
            ? 'अपनी कक्षा का चयन करें और किसी भी अध्याय का नाम डालें — AI उस अध्याय के पाठ्यक्रम के अनुसार तुरंत 50 अलग-अलग प्रश्नों का संपूर्ण टाइमर-आधारित मॉक टेस्ट बनाएगा।'
            : 'Select your class and enter any chapter name — AI will generate 50 unique questions strictly calibrated to your exam track and launch a full timed mock test.'}
        </p>
      </div>

      {/* Main Creation Card: 1. Class -> 2. Subject -> 3. Chapter Name -> 4. Start */}
      <div className="rounded-2xl border border-cyan-500/35 bg-white dark:bg-[#0A173B] p-6 space-y-6 shadow-sm">
        {/* Step 1: Select Class / Exam Track */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-cyan-500" />
            <span>{isHindi ? '1. कक्षा / परीक्षा का चयन करें:' : '1. Select Class & Exam Track:'}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_TRACKS.map((tr) => {
              const meta = EXAM_TRACK_LABELS[tr];
              const isSelected = selectedTrack === tr;
              return (
                <button
                  key={tr}
                  type="button"
                  onClick={() => setSelectedTrack(tr)}
                  className={`min-h-[40px] px-3.5 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500 text-slate-950 shadow-sm font-bold scale-[1.02]'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#06102B] text-slate-700 dark:text-slate-300 hover:border-cyan-500/50'
                  }`}
                >
                  {isHindi ? meta.hi : meta.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Subject */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>{isHindi ? '2. विषय चुनें:' : '2. Select Subject:'}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {(['PHYSICS', 'CHEMISTRY', 'MATHEMATICS'] as Subject[]).map((subj) => {
              const isSelected = selectedSubject === subj;
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSelectedSubject(subj)}
                  className={`min-h-[40px] px-5 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#06102B] text-slate-700 dark:text-slate-300 hover:border-amber-400/50'
                  }`}
                >
                  {subj === 'PHYSICS'
                    ? isHindi
                      ? 'भौतिक विज्ञान (Physics)'
                      : 'Physics'
                    : subj === 'CHEMISTRY'
                    ? isHindi
                      ? 'रसायन विज्ञान (Chemistry)'
                      : 'Chemistry'
                    : isHindi
                    ? 'गणित (Mathematics)'
                    : 'Mathematics'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Enter Chapter Name */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span>{isHindi ? '3. अध्याय का नाम लिखें:' : '3. Enter Chapter Name:'}</span>
          </label>

          <div className="relative">
            <input
              type="text"
              value={chapterInput}
              onChange={(e) => {
                setChapterInput(e.target.value);
                if (genError) setGenError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleStartMockTest();
                }
              }}
              placeholder={
                isHindi
                  ? 'अध्याय का नाम लिखें (जैसे: Kinematics, Thermodynamics, Electrostatics, Chemical Bonding, Calculus)...'
                  : 'Enter chapter name (e.g., Kinematics, Thermodynamics, Electrostatics, Chemical Bonding, Integrals)...'
              }
              className="w-full min-h-[50px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {chapterInput.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setChapterInput('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Syllabus Chapter Suggestions Chips */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {isHindi ? 'या त्वरित चयन के लिए किसी अध्याय पर क्लिक करें:' : 'Or click any chapter suggestion below:'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {displayChips.map((chipTitle) => (
                <button
                  key={chipTitle}
                  type="button"
                  onClick={() => {
                    setChapterInput(chipTitle);
                    if (genError) setGenError(null);
                  }}
                  className={`min-h-[30px] px-2.5 rounded-lg text-xs transition-colors border ${
                    chapterInput === chipTitle
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#06102B] text-slate-600 dark:text-slate-300 hover:border-cyan-500/40'
                  }`}
                >
                  {chipTitle}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error message */}
        {genError && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{genError}</span>
          </div>
        )}

        {/* Step 4: Primary Launch CTA */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => handleStartMockTest()}
            className="w-full min-h-[54px] rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 font-black text-sm inline-flex items-center justify-center gap-2 shadow-md transition-transform active:scale-[0.99]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {isHindi
                    ? `AI "${chapterInput || 'अध्याय'}" के 50 नए प्रश्न तैयार कर रहा है...`
                    : `Generating 50 distinct questions for "${chapterInput || 'Chapter'}"...`}
                </span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>
                  {isHindi
                    ? `50 प्रश्नों का मॉक टेस्ट शुरू करें (${selectedTrackName})`
                    : `Start 50-Question Mock Test (${selectedTrackName})`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Chapter Mock Tests (Ready to Re-attempt) */}
      {state.dailyAiSets.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span>{isHindi ? 'तैयार किए गए अध्याय मॉक टेस्ट' : 'Generated Chapter Mock Tests'}</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {state.dailyAiSets.length} {isHindi ? 'टेस्ट उपलब्ध' : 'tests ready'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.dailyAiSets.map((set) => {
              const tMeta = EXAM_TRACK_LABELS[set.track] ?? EXAM_TRACK_LABELS.CLASS_12_BOARD;
              return (
                <div
                  key={set.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#06102B] space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                        {isHindi ? tMeta.hi : tMeta.en}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {set.questions.length} Qs
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {set.chapterName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {set.subject} · {set.dateIso}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleLaunchSession(set.questions, set.track, set.subject, set.chapterName)
                    }
                    className="w-full min-h-[38px] rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isHindi ? 'मॉक टेस्ट दें' : 'Take Mock Test'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Mock Test Results History */}
      {state.testHistory.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-500" />
              <span>{isHindi ? 'मॉक टेस्ट स्कोर इतिहास' : 'Mock Test Score History'}</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {state.testHistory.length} {isHindi ? 'रिकॉर्ड' : 'records'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {state.testHistory.slice(0, 8).map((record) => (
              <div
                key={record.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{record.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {record.subjectLabel} · {new Date(record.timestamp).toLocaleDateString()} ·{' '}
                    {formatMmSs(record.durationSeconds)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-mono tabular-nums font-black text-cyan-600 dark:text-cyan-400 text-base">
                    {record.score} / {record.maxScore}
                  </p>
                  <p className="text-xs font-semibold text-amber-500">
                    {Math.round(record.accuracyPercent)}% {isHindi ? 'सटीकता' : 'accuracy'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
