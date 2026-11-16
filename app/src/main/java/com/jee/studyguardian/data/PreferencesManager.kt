package com.jee.studyguardian.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.jee.studyguardian.BuildConfig
import com.jee.studyguardian.models.ExamTrack
import com.jee.studyguardian.models.FilterStrictness
import com.jee.studyguardian.models.LanguageMode
import com.jee.studyguardian.models.ThemeMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.guardianDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "jee_study_guardian_prefs"
)

data class UserPreferencesState(
    val hasSelectedClass: Boolean = false,
    val selectedExamTrack: ExamTrack = ExamTrack.CLASS_12_BOARD,
    val language: LanguageMode = LanguageMode.ENGLISH,
    val themeMode: ThemeMode = ThemeMode.DARK,
    val notificationsEnabled: Boolean = true,
    val aiBackendUrl: String = BuildConfig.DEFAULT_AI_BACKEND_URL,
    val aiModelPreference: String = "gemini-4-hydrogen",
    val aiDefaultLevel: com.jee.studyguardian.models.StudyLevel = com.jee.studyguardian.models.StudyLevel.CLASS_12_BOARD,
    val aiDefaultSubject: com.jee.studyguardian.models.Subject = com.jee.studyguardian.models.Subject.PHYSICS,
    val personalizedAdsEnabled: Boolean = false,
    val ageAppropriateAdsOnly: Boolean = true,
    val pomodoroMinutes: Int = 50,
    val breakMinutes: Int = 10,
    val negativeMarkingEnabled: Boolean = true,
    val dailyGoalMinutes: Int = 360,
    val studyStreakDays: Int = 1,
    val lastStudyDateIso: String = "",
    // App Blocker & Focus state
    val appBlockerEnabled: Boolean = false,
    val focusEndEpochMs: Long = 0L,
    val focusPausedRemainingMs: Long = 0L,
    val focusDurationMinutes: Int = 120,
    // YouTube Distraction Filter state
    val youtubeFilterEnabled: Boolean = false,
    val youtubeBlockShorts: Boolean = true,
    val youtubeBlockWholeApp: Boolean = false,
    val youtubeBlockedKeywords: String = "shorts,vlog,gaming,roast,prank,trailer,meme",
    val youtubeAllowedCategories: String = "Physics Lectures,Chemistry NCERT,JEE Math,Mock Paper Analysis",
    // AI Content Filter state
    val aiFilterEnabled: Boolean = true,
    val aiFilterStrictness: FilterStrictness = FilterStrictness.BALANCED,
    val aiFilterKeywords: String = "reel,gambling,nsfw,spoiler,gossip,betting",
    val aiFilterCategories: String = "Inappropriate Content,Social Distractions,Gaming & Betting"
)

class PreferencesManager(private val context: Context) {

    private object Keys {
        val HAS_SELECTED_CLASS = booleanPreferencesKey("has_selected_class")
        val SELECTED_EXAM_TRACK = stringPreferencesKey("selected_exam_track")
        val LANGUAGE = stringPreferencesKey("language_code")
        val THEME_MODE = stringPreferencesKey("theme_mode")
        val NOTIFICATIONS_ENABLED = booleanPreferencesKey("notifications_enabled")
        val AI_BACKEND_URL = stringPreferencesKey("ai_backend_url")
        val AI_MODEL_PREF = stringPreferencesKey("ai_model_pref")
        val AI_DEFAULT_LEVEL = stringPreferencesKey("ai_default_level")
        val AI_DEFAULT_SUBJECT = stringPreferencesKey("ai_default_subject")
        val PERSONALIZED_ADS = booleanPreferencesKey("personalized_ads")
        val AGE_APPROPRIATE_ADS = booleanPreferencesKey("age_appropriate_ads")
        val POMODORO_MINUTES = intPreferencesKey("pomodoro_minutes")
        val BREAK_MINUTES = intPreferencesKey("break_minutes")
        val NEGATIVE_MARKING = booleanPreferencesKey("negative_marking")
        val DAILY_GOAL_MINUTES = intPreferencesKey("daily_goal_minutes")
        val STUDY_STREAK_DAYS = intPreferencesKey("study_streak_days")
        val LAST_STUDY_DATE = stringPreferencesKey("last_study_date")

        val APP_BLOCKER_ENABLED = booleanPreferencesKey("app_blocker_enabled")
        val FOCUS_END_EPOCH = longPreferencesKey("focus_end_epoch")
        val FOCUS_PAUSED_REMAINING = longPreferencesKey("focus_paused_remaining")
        val FOCUS_DURATION_MIN = intPreferencesKey("focus_duration_min")

        val YT_FILTER_ENABLED = booleanPreferencesKey("yt_filter_enabled")
        val YT_BLOCK_SHORTS = booleanPreferencesKey("yt_block_shorts")
        val YT_BLOCK_WHOLE_APP = booleanPreferencesKey("yt_block_whole_app")
        val YT_KEYWORDS = stringPreferencesKey("yt_keywords")
        val YT_CATEGORIES = stringPreferencesKey("yt_categories")

        val AI_FILTER_ENABLED = booleanPreferencesKey("ai_filter_enabled")
        val AI_FILTER_STRICTNESS = stringPreferencesKey("ai_filter_strictness")
        val AI_FILTER_KEYWORDS = stringPreferencesKey("ai_filter_keywords")
        val AI_FILTER_CATEGORIES = stringPreferencesKey("ai_filter_categories")
    }

    val preferencesFlow: Flow<UserPreferencesState> = context.guardianDataStore.data.map { p ->
        val selectedTrack = ExamTrack.entries.firstOrNull { it.name == p[Keys.SELECTED_EXAM_TRACK] }
            ?: ExamTrack.CLASS_12_BOARD
        UserPreferencesState(
            hasSelectedClass = p[Keys.HAS_SELECTED_CLASS] ?: false,
            selectedExamTrack = selectedTrack,
            language = LanguageMode.entries.firstOrNull { it.code == p[Keys.LANGUAGE] } ?: LanguageMode.ENGLISH,
            themeMode = ThemeMode.entries.firstOrNull { it.name == p[Keys.THEME_MODE] } ?: ThemeMode.DARK,
            notificationsEnabled = p[Keys.NOTIFICATIONS_ENABLED] ?: true,
            aiBackendUrl = p[Keys.AI_BACKEND_URL] ?: BuildConfig.DEFAULT_AI_BACKEND_URL,
            aiModelPreference = p[Keys.AI_MODEL_PREF] ?: "gemini-4-hydrogen",
            aiDefaultLevel = com.jee.studyguardian.models.StudyLevel.entries.firstOrNull { it.name == p[Keys.AI_DEFAULT_LEVEL] }
                ?: selectedTrack.toStudyLevel(),
            aiDefaultSubject = com.jee.studyguardian.models.Subject.entries.firstOrNull { it.name == p[Keys.AI_DEFAULT_SUBJECT] }
                ?: com.jee.studyguardian.models.Subject.PHYSICS,
            personalizedAdsEnabled = p[Keys.PERSONALIZED_ADS] ?: false,
            ageAppropriateAdsOnly = p[Keys.AGE_APPROPRIATE_ADS] ?: true,
            pomodoroMinutes = p[Keys.POMODORO_MINUTES] ?: 50,
            breakMinutes = p[Keys.BREAK_MINUTES] ?: 10,
            negativeMarkingEnabled = p[Keys.NEGATIVE_MARKING] ?: true,
            dailyGoalMinutes = p[Keys.DAILY_GOAL_MINUTES] ?: 360,
            studyStreakDays = p[Keys.STUDY_STREAK_DAYS] ?: 1,
            lastStudyDateIso = p[Keys.LAST_STUDY_DATE] ?: "",
            appBlockerEnabled = p[Keys.APP_BLOCKER_ENABLED] ?: false,
            focusEndEpochMs = p[Keys.FOCUS_END_EPOCH] ?: 0L,
            focusPausedRemainingMs = p[Keys.FOCUS_PAUSED_REMAINING] ?: 0L,
            focusDurationMinutes = p[Keys.FOCUS_DURATION_MIN] ?: 120,
            youtubeFilterEnabled = p[Keys.YT_FILTER_ENABLED] ?: false,
            youtubeBlockShorts = p[Keys.YT_BLOCK_SHORTS] ?: true,
            youtubeBlockWholeApp = p[Keys.YT_BLOCK_WHOLE_APP] ?: false,
            youtubeBlockedKeywords = p[Keys.YT_KEYWORDS] ?: "shorts,vlog,gaming,roast,prank,trailer,meme",
            youtubeAllowedCategories = p[Keys.YT_CATEGORIES] ?: "Physics Lectures,Chemistry NCERT,JEE Math,Mock Paper Analysis",
            aiFilterEnabled = p[Keys.AI_FILTER_ENABLED] ?: true,
            aiFilterStrictness = FilterStrictness.entries.firstOrNull { it.name == p[Keys.AI_FILTER_STRICTNESS] } ?: FilterStrictness.BALANCED,
            aiFilterKeywords = p[Keys.AI_FILTER_KEYWORDS] ?: "reel,gambling,nsfw,spoiler,gossip,betting",
            aiFilterCategories = p[Keys.AI_FILTER_CATEGORIES] ?: "Inappropriate Content,Social Distractions,Gaming & Betting"
        )
    }

    suspend fun setSelectedExamTrack(track: ExamTrack) = edit {
        it[Keys.HAS_SELECTED_CLASS] = true
        it[Keys.SELECTED_EXAM_TRACK] = track.name
        it[Keys.AI_DEFAULT_LEVEL] = track.toStudyLevel().name
        it[Keys.NEGATIVE_MARKING] = !track.name.startsWith("CLASS_")
    }
    suspend fun setLanguage(mode: LanguageMode) = edit { it[Keys.LANGUAGE] = mode.code }
    suspend fun setThemeMode(mode: ThemeMode) = edit { it[Keys.THEME_MODE] = mode.name }
    suspend fun setNotificationsEnabled(enabled: Boolean) = edit { it[Keys.NOTIFICATIONS_ENABLED] = enabled }
    suspend fun setAiBackendUrl(url: String) = edit { it[Keys.AI_BACKEND_URL] = url.trim() }
    suspend fun setAiModelPreference(model: String) = edit { it[Keys.AI_MODEL_PREF] = model }
    suspend fun setAiDefaults(
        level: com.jee.studyguardian.models.StudyLevel,
        subject: com.jee.studyguardian.models.Subject
    ) = edit {
        it[Keys.AI_DEFAULT_LEVEL] = level.name
        it[Keys.AI_DEFAULT_SUBJECT] = subject.name
    }
    suspend fun setAdPreferences(personalized: Boolean, ageAppropriate: Boolean) = edit {
        it[Keys.PERSONALIZED_ADS] = personalized
        it[Keys.AGE_APPROPRIATE_ADS] = ageAppropriate
    }
    suspend fun setPomodoroDurations(studyMin: Int, breakMin: Int) = edit {
        it[Keys.POMODORO_MINUTES] = studyMin
        it[Keys.BREAK_MINUTES] = breakMin
    }
    suspend fun setNegativeMarking(enabled: Boolean) = edit { it[Keys.NEGATIVE_MARKING] = enabled }
    suspend fun setDailyGoalMinutes(minutes: Int) = edit { it[Keys.DAILY_GOAL_MINUTES] = minutes }
    suspend fun updateStreak(streakDays: Int, dateIso: String) = edit {
        it[Keys.STUDY_STREAK_DAYS] = streakDays
        it[Keys.LAST_STUDY_DATE] = dateIso
    }

    suspend fun setBlockerFocusState(
        enabled: Boolean,
        endEpochMs: Long,
        pausedRemainingMs: Long,
        durationMinutes: Int
    ) = edit {
        it[Keys.APP_BLOCKER_ENABLED] = enabled
        it[Keys.FOCUS_END_EPOCH] = endEpochMs
        it[Keys.FOCUS_PAUSED_REMAINING] = pausedRemainingMs
        it[Keys.FOCUS_DURATION_MIN] = durationMinutes
    }

    suspend fun updateYouTubeFilter(
        enabled: Boolean,
        blockShorts: Boolean,
        blockWholeApp: Boolean,
        keywords: String,
        categories: String
    ) = edit {
        it[Keys.YT_FILTER_ENABLED] = enabled
        it[Keys.YT_BLOCK_SHORTS] = blockShorts
        it[Keys.YT_BLOCK_WHOLE_APP] = blockWholeApp
        it[Keys.YT_KEYWORDS] = keywords
        it[Keys.YT_CATEGORIES] = categories
    }

    suspend fun updateAiFilter(
        enabled: Boolean,
        strictness: FilterStrictness,
        keywords: String,
        categories: String
    ) = edit {
        it[Keys.AI_FILTER_ENABLED] = enabled
        it[Keys.AI_FILTER_STRICTNESS] = strictness.name
        it[Keys.AI_FILTER_KEYWORDS] = keywords
        it[Keys.AI_FILTER_CATEGORIES] = categories
    }

    suspend fun clearAll() {
        context.guardianDataStore.edit { it.clear() }
    }

    private suspend fun edit(block: (androidx.datastore.preferences.core.MutablePreferences) -> Unit) {
        context.guardianDataStore.edit(block)
    }
}
