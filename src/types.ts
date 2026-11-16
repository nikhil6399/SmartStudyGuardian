export type Subject = 'PHYSICS' | 'CHEMISTRY' | 'MATHEMATICS';
export type ExamTrack =
  | 'CLASS_9'
  | 'CLASS_10_BOARD'
  | 'CLASS_11'
  | 'CLASS_12_BOARD'
  | 'JEE_MAIN'
  | 'JEE_ADVANCED'
  | 'NEET'
  | 'CUET_NDA';

export type StudyLevel = ExamTrack;

export type LanguageMode = 'en' | 'hi';
export type ThemeMode = 'dark' | 'light';
export type FilterStrictness = 'RELAXED' | 'BALANCED' | 'STRICT';
export type MainTab = 'home' | 'tutor' | 'practice' | 'blocker' | 'settings';
export type SubView = 'none' | 'mock_test' | 'planner' | 'analytics' | 'alarms';

export interface StudyAlarm {
  id: string;
  time: string; // "HH:MM" 24-hour format
  label: string;
  days: number[]; // 1=Mon .. 7=Sun; empty = Every day
  enabled: boolean;
  tone: 'bell' | 'chime' | 'focus';
  subject?: Subject;
}

export interface StructuredAiAnswer {
  given: string;
  formula: string;
  steps: string[];
  finalAnswer: string;
  keyNote?: string;
}

export interface FormulaItem {
  id: string;
  title: string;
  expression: string;
  variablesNote: string;
}

export interface ChapterItem {
  id: string;
  subject: Subject;
  track: ExamTrack;
  unitName: string;
  title: string;
  weightagePercent: number;
  topics: string[];
  revisionNotes: string;
  formulas: FormulaItem[];
  importantPoints: string[];
}

export interface PracticeQuestion {
  id: string;
  subject: Subject;
  chapterId: string;
  track: ExamTrack;
  originLabel: 'Sample Practice' | 'Reference Concept';
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface DailyAiQuestionSet {
  id: string;
  dateIso: string;
  track: ExamTrack;
  subject: Subject;
  chapterName: string;
  language: LanguageMode;
  questions: PracticeQuestion[];
  createdAt: number;
}

export interface ChapterProgress {
  completed: boolean;
  revisionCount: number;
  practiceAttempted: number;
  practiceCorrect: number;
}

export interface StudyNote {
  id: string;
  chapterId: string;
  subject: Subject;
  title: string;
  content: string;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  subject: Subject;
  language: LanguageMode;
  level?: StudyLevel;
  content: string;
  structured?: StructuredAiAnswer;
  saved: boolean;
  timestamp: number;
}

export interface MockTestResult {
  id: string;
  title: string;
  track: ExamTrack;
  subjectLabel: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  score: number;
  maxScore: number;
  accuracyPercent: number;
  durationSeconds: number;
  timestamp: number;
}

export interface StudyGoal {
  id: string;
  title: string;
  subject: Subject;
  targetMinutes: number;
  completed: boolean;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 1=Mon..7=Sun
  startTime: string;
  endTime: string;
  subject: Subject;
  chapterTitle: string;
  isRevision: boolean;
}

export interface AppBlockerItem {
  packageName: string;
  appName: string;
  dailyMinutesUsed: number;
  blocked: boolean;
}

export interface FocusSessionRecord {
  id: string;
  plannedMinutes: number;
  actualMinutes: number;
  blockedAppsCount: number;
  youtubeFilterEnabled: boolean;
  aiFilterEnabled: boolean;
  status: 'COMPLETED' | 'EMERGENCY_UNLOCKED';
  timestamp: number;
}

export interface FilterLogItem {
  id: string;
  source: 'APP_BLOCKER' | 'YOUTUBE_FILTER' | 'AI_CONTENT_FILTER';
  summary: string;
  action: 'BLOCKED' | 'FLAGGED' | 'OVERRIDDEN';
  timestamp: number;
}

export interface DailyStudyDay {
  dateIso: string;
  label: string;
  physicsMinutes: number;
  chemistryMinutes: number;
  mathMinutes: number;
}

export interface PersistedAppState {
  hasSelectedClass: boolean;
  selectedClassTrack: ExamTrack;
  language: LanguageMode;
  theme: ThemeMode;
  notificationsEnabled: boolean;
  negativeMarkingEnabled: boolean;
  aiDefaultLevel: StudyLevel;
  aiDefaultSubject: Subject;
  dailyGoalMinutes: number;
  studyStreakDays: number;
  pomodoroStudyMin: number;
  pomodoroBreakMin: number;
  chapterProgress: Record<string, ChapterProgress>;
  savedQuestionIds: string[];
  notes: StudyNote[];
  chatHistory: ChatMessage[];
  testHistory: MockTestResult[];
  goals: StudyGoal[];
  timetable: TimetableSlot[];
  alarms: StudyAlarm[];
  apps: AppBlockerItem[];
  focusActiveUntil: number;
  focusPausedRemainingMs: number;
  focusDurationMinutes: number;
  youtubeFilterEnabled: boolean;
  youtubeBlockShorts: boolean;
  youtubeBlockWholeApp: boolean;
  youtubeKeywords: string;
  youtubeAllowedCategories: string;
  aiFilterEnabled: boolean;
  aiFilterStrictness: FilterStrictness;
  aiFilterKeywords: string;
  aiFilterCategories: string;
  focusSessions: FocusSessionRecord[];
  filterLogs: FilterLogItem[];
  weeklyStudy: DailyStudyDay[];
  dailyAiSets: DailyAiQuestionSet[];
  customGeminiApiKey: string;
  customRevisions: { id: string; title: string; subject: Subject; time: string }[];
}
