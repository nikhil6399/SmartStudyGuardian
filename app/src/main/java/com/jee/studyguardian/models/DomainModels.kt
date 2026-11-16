package com.jee.studyguardian.models

enum class Subject(val labelEn: String, val labelHi: String) {
    PHYSICS("Physics", "भौतिक विज्ञान"),
    CHEMISTRY("Chemistry", "रसायन विज्ञान"),
    MATHEMATICS("Mathematics", "गणित")
}

enum class ExamTrack(val label: String, val labelHi: String) {
    CLASS_9("Class 9", "कक्षा 9"),
    CLASS_10_BOARD("Class 10 Board", "कक्षा 10 बोर्ड"),
    CLASS_11("Class 11", "कक्षा 11"),
    CLASS_12_BOARD("Class 12 Board", "कक्षा 12 बोर्ड"),
    JEE_MAIN("JEE Main", "JEE Main"),
    JEE_ADVANCED("JEE Advanced", "JEE Advanced"),
    NEET("NEET UG", "NEET UG"),
    CUET_NDA("CUET / NDA", "CUET / NDA");

    fun toStudyLevel(): StudyLevel = when (this) {
        CLASS_9 -> StudyLevel.CLASS_9
        CLASS_10_BOARD -> StudyLevel.CLASS_10_BOARD
        CLASS_11 -> StudyLevel.CLASS_11
        CLASS_12_BOARD -> StudyLevel.CLASS_12_BOARD
        JEE_MAIN -> StudyLevel.JEE_MAIN
        JEE_ADVANCED -> StudyLevel.JEE_ADVANCED
        NEET -> StudyLevel.NEET
        CUET_NDA -> StudyLevel.CUET_NDA
    }
}

enum class StudyLevel(val apiValue: String, val labelEn: String, val labelHi: String) {
    CLASS_9("CLASS_9", "Class 9", "कक्षा 9"),
    CLASS_10_BOARD("CLASS_10_BOARD", "Class 10 Board", "कक्षा 10 बोर्ड"),
    CLASS_11("CLASS_11", "Class 11", "कक्षा 11"),
    CLASS_12_BOARD("CLASS_12_BOARD", "Class 12 Board", "कक्षा 12 बोर्ड"),
    JEE_MAIN("JEE_MAIN", "JEE Main", "JEE Main"),
    JEE_ADVANCED("JEE_ADVANCED", "JEE Advanced", "JEE Advanced"),
    NEET("NEET", "NEET UG", "NEET UG"),
    CUET_NDA("CUET_NDA", "CUET / NDA", "CUET / NDA")
}

data class StructuredAiAnswer(
    val given: String,
    val formula: String,
    val steps: List<String>,
    val finalAnswer: String,
    val keyNote: String = ""
)

enum class LanguageMode(val code: String, val displayName: String) {
    ENGLISH("en", "English"),
    HINDI("hi", "हिन्दी")
}

enum class ThemeMode(val labelEn: String, val labelHi: String) {
    SYSTEM("System", "सिस्टम"),
    DARK("Dark", "डार्क"),
    LIGHT("Light", "लाइट")
}

enum class FilterStrictness(val label: String, val threshold: Int) {
    RELAXED("Relaxed", 3),
    BALANCED("Balanced", 2),
    STRICT("Strict", 1)
}

enum class QuestionOrigin(val label: String) {
    SAMPLE_PRACTICE("Sample Practice"),
    REFERENCE_CONCEPT("Reference Concept"),
    PYQ_ARCHIVE("Verified PYQ Reference")
}

data class ChapterItem(
    val id: String,
    val subject: Subject,
    val track: ExamTrack,
    val unitName: String,
    val title: String,
    val weightagePercent: Int,
    val topics: List<String>,
    val revisionNotes: String,
    val formulas: List<FormulaItem>,
    val importantPoints: List<String>,
    val isCompleted: Boolean = false,
    val revisionCount: Int = 0,
    val lastRevisedEpochMs: Long = 0L
)

data class FormulaItem(
    val id: String,
    val title: String,
    val expression: String,
    val variablesNote: String
)

data class PracticeQuestion(
    val id: String,
    val subject: Subject,
    val chapterId: String,
    val track: ExamTrack,
    val origin: QuestionOrigin,
    val yearOrSourceNote: String,
    val prompt: String,
    val options: List<String>,
    val correctOptionIndex: Int,
    val explanation: String,
    val difficulty: String
)

data class MockTestConfig(
    val title: String,
    val track: ExamTrack,
    val subjectFilter: Subject? = null,
    val chapterIdFilter: String? = null,
    val durationMinutes: Int = 30,
    val positiveMarks: Int = 4,
    val negativeMarks: Int = 1,
    val negativeMarkingEnabled: Boolean = true
)

data class MockTestResultSummary(
    val id: Long = 0,
    val title: String,
    val track: String,
    val subjectName: String,
    val totalQuestions: Int,
    val attempted: Int,
    val correct: Int,
    val incorrect: Int,
    val score: Int,
    val maxScore: Int,
    val accuracyPercent: Float,
    val durationTakenSeconds: Int,
    val timestampEpochMs: Long
)

data class InstalledAppInfo(
    val packageName: String,
    val appName: String,
    val isBlocked: Boolean,
    val dailyMinutesUsed: Int
)

data class FilterClassificationResult(
    val isFlagged: Boolean,
    val category: String,
    val matchedKeywords: List<String>,
    val confidenceNote: String,
    val classificationType: String // "Inappropriate", "Distracting", or "AI-Pattern Heuristic"
)

data class SubjectAnalytics(
    val subject: Subject,
    val completedChapters: Int,
    val totalChapters: Int,
    val avgAccuracyPercent: Float,
    val studyMinutesThisWeek: Int
)

data class ChapterStrength(
    val chapterId: String,
    val chapterTitle: String,
    val subject: Subject,
    val statusLabel: String,
    val scoreMetric: Float
)
