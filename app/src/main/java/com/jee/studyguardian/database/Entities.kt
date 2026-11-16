package com.jee.studyguardian.database

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "chapter_progress")
data class ChapterProgressEntity(
    @PrimaryKey val chapterId: String,
    val isCompleted: Boolean = false,
    val revisionCount: Int = 0,
    val lastRevisedEpochMs: Long = 0L,
    val nextRevisionEpochMs: Long = 0L,
    val practiceCorrect: Int = 0,
    val practiceAttempted: Int = 0
)

@Entity(tableName = "study_notes")
data class StudyNoteEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val chapterId: String,
    val subject: String,
    val title: String,
    val content: String,
    val updatedAtEpochMs: Long = System.currentTimeMillis()
)

@Entity(tableName = "saved_questions")
data class SavedQuestionEntity(
    @PrimaryKey val questionId: String,
    val subject: String,
    val chapterId: String,
    val prompt: String,
    val explanation: String,
    val savedAtEpochMs: Long = System.currentTimeMillis()
)

@Entity(tableName = "chat_messages")
data class ChatMessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val role: String, // "user" or "assistant"
    val subjectTag: String,
    val languageCode: String,
    val content: String,
    val structuredJson: String = "",
    val isSavedAnswer: Boolean = false,
    val timestampEpochMs: Long = System.currentTimeMillis()
)

@Entity(tableName = "mock_test_results")
data class MockTestResultEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
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
    val timestampEpochMs: Long = System.currentTimeMillis()
)

@Entity(tableName = "study_goals")
data class StudyGoalEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val subject: String,
    val targetMinutes: Int,
    val completedMinutes: Int = 0,
    val isCompleted: Boolean = false,
    val dueDateIso: String
)

@Entity(tableName = "timetable_slots")
data class TimetableSlotEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val dayOfWeek: Int, // 1=Mon .. 7=Sun
    val startTimeLabel: String,
    val endTimeLabel: String,
    val subject: String,
    val chapterTitle: String,
    val isRevisionSlot: Boolean = false
)

@Entity(tableName = "blocked_apps")
data class BlockedAppEntity(
    @PrimaryKey val packageName: String,
    val appName: String,
    val isEnabled: Boolean = true,
    val scheduleStartHour: Int = 0,
    val scheduleEndHour: Int = 23,
    val blockCountToday: Int = 0
)

@Entity(tableName = "focus_sessions")
data class FocusSessionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val plannedMinutes: Int,
    val actualMinutes: Int,
    val blockedAppsCount: Int,
    val youtubeFilterEnabled: Boolean,
    val aiFilterEnabled: Boolean,
    val status: String, // "COMPLETED", "EMERGENCY_UNLOCKED", "CANCELLED"
    val startedAtEpochMs: Long,
    val endedAtEpochMs: Long
)

@Entity(tableName = "filter_logs")
data class FilterLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val source: String, // "APP_BLOCKER", "YOUTUBE_FILTER", "AI_CONTENT_FILTER"
    val summary: String,
    val matchedRule: String,
    val actionTaken: String, // "BLOCKED", "FLAGGED", "OVERRIDDEN"
    val timestampEpochMs: Long = System.currentTimeMillis()
)

@Entity(tableName = "daily_study_stats")
data class DailyStudyStatEntity(
    @PrimaryKey val dateIso: String, // yyyy-MM-dd
    val physicsMinutes: Int = 0,
    val chemistryMinutes: Int = 0,
    val mathMinutes: Int = 0,
    val focusSessionsCompleted: Int = 0,
    val questionsSolved: Int = 0
)

@Entity(tableName = "study_alarms")
data class StudyAlarmEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val hour: Int,
    val minute: Int,
    val label: String,
    val daysCsv: String = "", // e.g. "1,2,3,4,5,6" or "" for every day
    val isEnabled: Boolean = true,
    val subject: String = "PHYSICS"
)
