import {
  AppBlockerItem,
  ChatMessage,
  DailyAiQuestionSet,
  DailyStudyDay,
  ExamTrack,
  FilterLogItem,
  FilterStrictness,
  FocusSessionRecord,
  LanguageMode,
  PersistedAppState,
  PracticeQuestion,
  StudyAlarm,
  StudyGoal,
  StudyNote,
  Subject,
  TimetableSlot,
  MockTestResult,
} from '../types';
import { EXAM_TRACK_LABELS, INITIAL_APP_STATE } from '../data/jeeCatalog';

const STORAGE_KEY = 'jee_ai_study_guardian_state_v1';

const VALID_SUBJECTS = new Set<Subject>(['PHYSICS', 'CHEMISTRY', 'MATHEMATICS']);
const VALID_STRICTNESS = new Set<FilterStrictness>(['RELAXED', 'BALANCED', 'STRICT']);
const VALID_TONES = new Set<StudyAlarm['tone']>(['bell', 'chime', 'focus']);

export function normalizeExamTrack(value: unknown, fallback: ExamTrack = INITIAL_APP_STATE.selectedClassTrack): ExamTrack {
  if (typeof value === 'string') {
    if (value in EXAM_TRACK_LABELS) return value as ExamTrack;
    if (value === 'NCERT') return 'CLASS_12_BOARD';
  }
  return fallback;
}

export function normalizeSubject(value: unknown, fallback: Subject = 'PHYSICS'): Subject {
  if (typeof value === 'string' && VALID_SUBJECTS.has(value as Subject)) {
    return value as Subject;
  }
  return fallback;
}

function safePositiveNumber(value: unknown, fallback: number, min = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min ? value : fallback;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function sanitizePersistedState(rawInput: unknown): PersistedAppState {
  if (!isPlainRecord(rawInput)) return INITIAL_APP_STATE;
  const parsed = rawInput as Partial<PersistedAppState>;

  const selectedClassTrack = normalizeExamTrack(
    parsed.selectedClassTrack ?? parsed.aiDefaultLevel,
    INITIAL_APP_STATE.selectedClassTrack
  );
  const aiDefaultLevel = normalizeExamTrack(parsed.aiDefaultLevel, selectedClassTrack);

  const chapterProgress: PersistedAppState['chapterProgress'] = {};
  if (isPlainRecord(parsed.chapterProgress)) {
    for (const [key, val] of Object.entries(parsed.chapterProgress)) {
      if (isPlainRecord(val)) {
        chapterProgress[key] = {
          completed: Boolean(val.completed),
          revisionCount: safePositiveNumber(val.revisionCount, 0),
          practiceAttempted: safePositiveNumber(val.practiceAttempted, 0),
          practiceCorrect: safePositiveNumber(val.practiceCorrect, 0),
        };
      }
    }
  } else {
    Object.assign(chapterProgress, INITIAL_APP_STATE.chapterProgress);
  }

  const alarms: StudyAlarm[] = Array.isArray(parsed.alarms)
    ? parsed.alarms
        .filter((a): a is StudyAlarm => isPlainRecord(a) && typeof a.id === 'string' && typeof a.time === 'string')
        .map((a) => ({
          id: a.id,
          time: a.time,
          label: typeof a.label === 'string' ? a.label : 'Study Alarm',
          days: Array.isArray(a.days)
            ? a.days.filter((d): d is number => typeof d === 'number' && Number.isInteger(d) && d >= 1 && d <= 7)
            : [],
          enabled: Boolean(a.enabled),
          tone: VALID_TONES.has(a.tone) ? a.tone : 'chime',
          subject: a.subject ? normalizeSubject(a.subject) : undefined,
        }))
    : INITIAL_APP_STATE.alarms;

  const chatHistory: ChatMessage[] = Array.isArray(parsed.chatHistory)
    ? parsed.chatHistory
        .filter((m): m is ChatMessage => isPlainRecord(m) && typeof m.id === 'string' && typeof m.content === 'string')
        .map((m) => ({
          id: m.id,
          role: m.role === 'user' ? 'user' : 'assistant',
          subject: normalizeSubject(m.subject),
          language: m.language === 'hi' ? 'hi' : 'en',
          level: m.level ? normalizeExamTrack(m.level, selectedClassTrack) : undefined,
          content: m.content,
          structured: isPlainRecord(m.structured)
            ? {
                given: typeof m.structured.given === 'string' ? m.structured.given : '',
                formula: typeof m.structured.formula === 'string' ? m.structured.formula : '',
                steps: Array.isArray(m.structured.steps)
                  ? m.structured.steps.map((s) => String(s ?? '')).filter(Boolean)
                  : [],
                finalAnswer: typeof m.structured.finalAnswer === 'string' ? m.structured.finalAnswer : '',
                keyNote: typeof m.structured.keyNote === 'string' ? m.structured.keyNote : undefined,
              }
            : undefined,
          saved: Boolean(m.saved),
          timestamp: safePositiveNumber(m.timestamp, Date.now()),
        }))
    : INITIAL_APP_STATE.chatHistory;

  const testHistory: MockTestResult[] = Array.isArray(parsed.testHistory)
    ? parsed.testHistory
        .filter((r): r is MockTestResult => isPlainRecord(r) && typeof r.id === 'string' && typeof r.title === 'string')
        .map((r) => ({
          ...r,
          track: normalizeExamTrack(r.track, selectedClassTrack),
          subjectLabel: typeof r.subjectLabel === 'string' ? r.subjectLabel : 'Full Syllabus',
          totalQuestions: safePositiveNumber(r.totalQuestions, 0),
          attempted: safePositiveNumber(r.attempted, 0),
          correct: safePositiveNumber(r.correct, 0),
          incorrect: safePositiveNumber(r.incorrect, 0),
          score: typeof r.score === 'number' && Number.isFinite(r.score) ? r.score : 0,
          maxScore: safePositiveNumber(r.maxScore, 0),
          accuracyPercent: safePositiveNumber(r.accuracyPercent, 0),
          durationSeconds: safePositiveNumber(r.durationSeconds, 0),
          timestamp: safePositiveNumber(r.timestamp, Date.now()),
        }))
    : INITIAL_APP_STATE.testHistory;

  const goals: StudyGoal[] = Array.isArray(parsed.goals)
    ? parsed.goals
        .filter((g): g is StudyGoal => isPlainRecord(g) && typeof g.id === 'string' && typeof g.title === 'string')
        .map((g) => ({
          id: g.id,
          title: g.title,
          subject: normalizeSubject(g.subject),
          targetMinutes: safePositiveNumber(g.targetMinutes, 60, 1),
          completed: Boolean(g.completed),
        }))
    : INITIAL_APP_STATE.goals;

  const timetable: TimetableSlot[] = Array.isArray(parsed.timetable)
    ? parsed.timetable.filter(
        (t): t is TimetableSlot =>
          isPlainRecord(t) && typeof t.id === 'string' && typeof t.chapterTitle === 'string'
      )
    : INITIAL_APP_STATE.timetable;

  const notes: StudyNote[] = Array.isArray(parsed.notes)
    ? parsed.notes.filter(
        (n): n is StudyNote => isPlainRecord(n) && typeof n.id === 'string' && typeof n.title === 'string'
      )
    : INITIAL_APP_STATE.notes;

  const savedQuestionIds: string[] = Array.isArray(parsed.savedQuestionIds)
    ? parsed.savedQuestionIds.filter((id): id is string => typeof id === 'string')
    : INITIAL_APP_STATE.savedQuestionIds;

  const focusSessions: FocusSessionRecord[] = Array.isArray(parsed.focusSessions)
    ? parsed.focusSessions.filter((fs): fs is FocusSessionRecord => isPlainRecord(fs) && typeof fs.id === 'string')
    : INITIAL_APP_STATE.focusSessions;

  const filterLogs: FilterLogItem[] = Array.isArray(parsed.filterLogs)
    ? parsed.filterLogs.filter((fl): fl is FilterLogItem => isPlainRecord(fl) && typeof fl.id === 'string')
    : INITIAL_APP_STATE.filterLogs;

  const weeklyStudy: DailyStudyDay[] =
    Array.isArray(parsed.weeklyStudy) && parsed.weeklyStudy.length > 0
      ? parsed.weeklyStudy
          .filter((d): d is DailyStudyDay => isPlainRecord(d) && typeof d.dateIso === 'string')
          .map((d) => ({
            dateIso: d.dateIso,
            label: typeof d.label === 'string' ? d.label : d.dateIso,
            physicsMinutes: safePositiveNumber(d.physicsMinutes, 0),
            chemistryMinutes: safePositiveNumber(d.chemistryMinutes, 0),
            mathMinutes: safePositiveNumber(d.mathMinutes, 0),
          }))
      : INITIAL_APP_STATE.weeklyStudy;

  const apps: AppBlockerItem[] =
    Array.isArray(parsed.apps) && parsed.apps.length > 0
      ? parsed.apps
          .filter((a): a is AppBlockerItem => isPlainRecord(a) && typeof a.packageName === 'string')
          .map((a) => ({
            packageName: a.packageName,
            appName: typeof a.appName === 'string' ? a.appName : a.packageName,
            dailyMinutesUsed: safePositiveNumber(a.dailyMinutesUsed, 0),
            blocked: Boolean(a.blocked),
          }))
      : INITIAL_APP_STATE.apps;

  const dailyAiSets: DailyAiQuestionSet[] = Array.isArray(parsed.dailyAiSets)
    ? parsed.dailyAiSets
        .filter(
          (set): set is DailyAiQuestionSet =>
            isPlainRecord(set) &&
            typeof set.id === 'string' &&
            typeof set.dateIso === 'string' &&
            typeof set.chapterName === 'string' &&
            Array.isArray(set.questions)
        )
        .map((set) => {
          const track = normalizeExamTrack(set.track, selectedClassTrack);
          const subject = normalizeSubject(set.subject);
          const questions: PracticeQuestion[] = set.questions
            .filter(
              (q): q is PracticeQuestion =>
                isPlainRecord(q) &&
                typeof q.id === 'string' &&
                typeof q.prompt === 'string' &&
                Array.isArray(q.options) &&
                q.options.length >= 2
            )
            .map((q) => ({
              id: q.id,
              subject: normalizeSubject(q.subject, subject),
              chapterId: typeof q.chapterId === 'string' ? q.chapterId : set.id,
              track: normalizeExamTrack(q.track, track),
              originLabel: q.originLabel === 'Reference Concept' ? 'Reference Concept' : 'Sample Practice',
              prompt: q.prompt,
              options: q.options.map((o) => String(o ?? '')),
              correctOptionIndex:
                typeof q.correctOptionIndex === 'number' &&
                q.correctOptionIndex >= 0 &&
                q.correctOptionIndex < q.options.length
                  ? q.correctOptionIndex
                  : 0,
              explanation: typeof q.explanation === 'string' ? q.explanation : '',
              difficulty: q.difficulty === 'Easy' || q.difficulty === 'Hard' ? q.difficulty : 'Medium',
            }));
          const language: LanguageMode = set.language === 'hi' ? 'hi' : 'en';
          return {
            id: set.id,
            dateIso: set.dateIso,
            track,
            subject,
            chapterName: set.chapterName,
            language,
            questions,
            createdAt: safePositiveNumber(set.createdAt, Date.now()),
          };
        })
        .filter((set) => set.questions.length > 0)
        .slice(0, 7)
    : INITIAL_APP_STATE.dailyAiSets;

  const customRevisions = Array.isArray(parsed.customRevisions)
    ? parsed.customRevisions
        .filter((r): r is { id: string; title: string; subject: Subject; time: string } =>
          isPlainRecord(r) && typeof r.id === 'string' && typeof r.title === 'string' && typeof r.time === 'string'
        )
        .map((r) => ({
          id: r.id,
          title: r.title.trim(),
          subject: normalizeSubject(r.subject),
          time: r.time,
        }))
    : INITIAL_APP_STATE.customRevisions;

  return {
    ...INITIAL_APP_STATE,
    hasSelectedClass: typeof parsed.hasSelectedClass === 'boolean' ? parsed.hasSelectedClass : false,
    selectedClassTrack,
    language: parsed.language === 'hi' ? 'hi' : 'en',
    theme: parsed.theme === 'light' ? 'light' : 'dark',
    notificationsEnabled: typeof parsed.notificationsEnabled === 'boolean' ? parsed.notificationsEnabled : INITIAL_APP_STATE.notificationsEnabled,
    negativeMarkingEnabled: typeof parsed.negativeMarkingEnabled === 'boolean' ? parsed.negativeMarkingEnabled : INITIAL_APP_STATE.negativeMarkingEnabled,
    aiDefaultLevel,
    aiDefaultSubject: normalizeSubject(parsed.aiDefaultSubject, INITIAL_APP_STATE.aiDefaultSubject),
    dailyGoalMinutes: safePositiveNumber(parsed.dailyGoalMinutes, INITIAL_APP_STATE.dailyGoalMinutes, 30),
    studyStreakDays: safePositiveNumber(parsed.studyStreakDays, INITIAL_APP_STATE.studyStreakDays),
    pomodoroStudyMin: safePositiveNumber(parsed.pomodoroStudyMin, INITIAL_APP_STATE.pomodoroStudyMin, 5),
    pomodoroBreakMin: safePositiveNumber(parsed.pomodoroBreakMin, INITIAL_APP_STATE.pomodoroBreakMin, 1),
    chapterProgress,
    savedQuestionIds,
    notes,
    chatHistory,
    testHistory,
    goals,
    timetable,
    alarms,
    apps,
    focusActiveUntil: safePositiveNumber(parsed.focusActiveUntil, 0),
    focusPausedRemainingMs: safePositiveNumber(parsed.focusPausedRemainingMs, 0),
    focusDurationMinutes: safePositiveNumber(parsed.focusDurationMinutes, INITIAL_APP_STATE.focusDurationMinutes, 1),
    youtubeFilterEnabled: typeof parsed.youtubeFilterEnabled === 'boolean' ? parsed.youtubeFilterEnabled : INITIAL_APP_STATE.youtubeFilterEnabled,
    youtubeBlockShorts: typeof parsed.youtubeBlockShorts === 'boolean' ? parsed.youtubeBlockShorts : INITIAL_APP_STATE.youtubeBlockShorts,
    youtubeBlockWholeApp: typeof parsed.youtubeBlockWholeApp === 'boolean' ? parsed.youtubeBlockWholeApp : INITIAL_APP_STATE.youtubeBlockWholeApp,
    youtubeKeywords: typeof parsed.youtubeKeywords === 'string' ? parsed.youtubeKeywords : INITIAL_APP_STATE.youtubeKeywords,
    youtubeAllowedCategories: typeof parsed.youtubeAllowedCategories === 'string' ? parsed.youtubeAllowedCategories : INITIAL_APP_STATE.youtubeAllowedCategories,
    aiFilterEnabled: typeof parsed.aiFilterEnabled === 'boolean' ? parsed.aiFilterEnabled : INITIAL_APP_STATE.aiFilterEnabled,
    aiFilterStrictness: VALID_STRICTNESS.has(parsed.aiFilterStrictness as FilterStrictness)
      ? (parsed.aiFilterStrictness as FilterStrictness)
      : INITIAL_APP_STATE.aiFilterStrictness,
    aiFilterKeywords: typeof parsed.aiFilterKeywords === 'string' ? parsed.aiFilterKeywords : INITIAL_APP_STATE.aiFilterKeywords,
    aiFilterCategories: typeof parsed.aiFilterCategories === 'string' ? parsed.aiFilterCategories : INITIAL_APP_STATE.aiFilterCategories,
    focusSessions,
    filterLogs,
    weeklyStudy: weeklyStudy.length > 0 ? weeklyStudy : INITIAL_APP_STATE.weeklyStudy,
    dailyAiSets,
    customGeminiApiKey: typeof parsed.customGeminiApiKey === 'string' ? parsed.customGeminiApiKey.trim() : '',
    customRevisions,
  };
}

export function loadPersistedState(): PersistedAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_APP_STATE;
    const parsed = JSON.parse(raw) as unknown;
    return sanitizePersistedState(parsed);
  } catch {
    return INITIAL_APP_STATE;
  }
}

export function savePersistedState(state: PersistedAppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors cleanly
  }
}

export function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function formatHms(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export function formatMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatHm(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export interface LocalFilterClassification {
  isFlagged: boolean;
  category: string;
  classificationType: string;
  matchedKeywords: string[];
  confidenceNote: string;
}

const INAPPROPRIATE_LEXICON = ['nsfw', 'gambling', 'betting', 'casino', 'explicit', 'adult', 'porn', 'lottery', 'stake'];
const DISTRACTING_LEXICON = ['reel', 'reels', 'shorts', 'prank', 'roast', 'meme', 'memes', 'gossip', 'spoiler', 'trailer', 'clickbait', 'giveaway', 'celebrity', 'pubg', 'bgmi', 'freefire'];
const AI_BOILERPLATE = [
  'as an ai language model',
  'delve into the tapestry',
  'in conclusion, it is important to note',
  "let's embark on a journey",
  'a testament to the multifaceted',
];

export function classifyContentLocally(
  text: string,
  enabled: boolean,
  strictness: FilterStrictness,
  customKeywordsCsv: string,
  enabledCategories: string
): LocalFilterClassification {
  if (!enabled || !text.trim()) {
    return {
      isFlagged: false,
      category: 'None',
      classificationType: 'None',
      matchedKeywords: [],
      confidenceNote: 'Filter inactive or empty text',
    };
  }

  const normalized = text.toLowerCase();
  const tokens = new Set(normalized.split(/[^a-z0-9_]+/).filter(Boolean));
  const customKeywords = customKeywordsCsv
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length >= 2);

  const inappropriateHits = INAPPROPRIATE_LEXICON.filter((w) => tokens.has(w) || normalized.includes(w));
  const distractingHits = DISTRACTING_LEXICON.filter((w) => tokens.has(w) || normalized.includes(w));
  const customHits = customKeywords.filter((w) => normalized.includes(w));
  const aiHits = AI_BOILERPLATE.filter((p) => normalized.includes(p));

  const threshold = strictness === 'STRICT' ? 1 : strictness === 'BALANCED' ? 2 : 3;
  const score = inappropriateHits.length * 2 + distractingHits.length + customHits.length * 2;

  if (inappropriateHits.length > 0 && enabledCategories.toLowerCase().includes('inappropriate')) {
    return {
      isFlagged: true,
      category: 'Inappropriate Content',
      classificationType: 'Inappropriate Content Classification',
      matchedKeywords: Array.from(new Set([...inappropriateHits, ...customHits])),
      confidenceNote: `Matched ${inappropriateHits.length} unsafe keyword cue(s) locally`,
    };
  }

  if (score >= threshold) {
    return {
      isFlagged: true,
      category: customHits.length > 0 ? 'Custom Blocked Rule' : 'Study Distraction',
      classificationType: 'Distracting Content Classification',
      matchedKeywords: Array.from(new Set([...distractingHits, ...customHits])),
      confidenceNote: `Triggered at ${strictness} strictness (score ${score} >= ${threshold})`,
    };
  }

  if (aiHits.length > 0) {
    return {
      isFlagged: true,
      category: 'AI-Pattern Heuristic',
      classificationType: 'AI-Generated Pattern Heuristic',
      matchedKeywords: aiHits,
      confidenceNote: 'Heuristic boilerplate match (probabilistic signal, not definitive proof of AI authorship)',
    };
  }

  return {
    isFlagged: false,
    category: 'Study Safe',
    classificationType: 'Clear',
    matchedKeywords: [],
    confidenceNote: 'No distracting or inappropriate rules matched',
  };
}
