package com.jee.studyguardian.viewmodel

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.jee.studyguardian.ai.AiTutorResponse
import com.jee.studyguardian.analytics.AnalyticsCalculator
import com.jee.studyguardian.application.JeeStudyGuardianApp
import com.jee.studyguardian.blocker.FocusGuardianForegroundService
import com.jee.studyguardian.blocker.UsageStatsHelper
import com.jee.studyguardian.data.JeeContentCatalog
import com.jee.studyguardian.data.UserPreferencesState
import com.jee.studyguardian.database.BlockedAppEntity
import com.jee.studyguardian.database.ChapterProgressEntity
import com.jee.studyguardian.database.ChatMessageEntity
import com.jee.studyguardian.database.DailyStudyStatEntity
import com.jee.studyguardian.database.FilterLogEntity
import com.jee.studyguardian.database.FocusSessionEntity
import com.jee.studyguardian.database.MockTestResultEntity
import com.jee.studyguardian.database.SavedQuestionEntity
import com.jee.studyguardian.database.StudyAlarmEntity
import com.jee.studyguardian.database.StudyGoalEntity
import com.jee.studyguardian.database.StudyNoteEntity
import com.jee.studyguardian.database.TimetableSlotEntity
import com.jee.studyguardian.filters.AiContentFilterEngine
import com.jee.studyguardian.firebase.FirebaseAuthUiState
import com.jee.studyguardian.firebase.FirebaseSyncManager
import com.jee.studyguardian.models.ChapterStrength
import com.jee.studyguardian.models.ExamTrack
import com.jee.studyguardian.models.FilterClassificationResult
import com.jee.studyguardian.models.FilterStrictness
import com.jee.studyguardian.models.InstalledAppInfo
import com.jee.studyguardian.models.LanguageMode
import com.jee.studyguardian.models.MockTestConfig
import com.jee.studyguardian.models.PracticeQuestion
import com.jee.studyguardian.models.StudyLevel
import com.jee.studyguardian.models.Subject
import com.jee.studyguardian.models.SubjectAnalytics
import com.jee.studyguardian.models.ThemeMode
import com.jee.studyguardian.planner.PomodoroPhase
import com.jee.studyguardian.planner.PomodoroTimerManager
import com.jee.studyguardian.planner.PomodoroUiState
import com.jee.studyguardian.planner.StudyAlarmScheduler
import androidx.core.app.NotificationManagerCompat
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class ActiveMockTestState(
    val isActive: Boolean = false,
    val isSubmitted: Boolean = false,
    val config: MockTestConfig = MockTestConfig("JEE Main Quick Mock", ExamTrack.JEE_MAIN),
    val questions: List<PracticeQuestion> = emptyList(),
    val currentIndex: Int = 0,
    val selectedAnswers: Map<String, Int> = emptyMap(),
    val markedForReview: Set<String> = emptySet(),
    val remainingSeconds: Int = 1800,
    val lastResult: MockTestResultEntity? = null
)

data class TutorUiState(
    val isLoading: Boolean = false,
    val selectedSubject: Subject = Subject.PHYSICS,
    val selectedMode: String = "step_by_step",
    val selectedLevel: StudyLevel = StudyLevel.JEE_MAIN,
    val errorMessage: String? = null
)

data class BlockerPermissionStatus(
    val usageStatsGranted: Boolean = false,
    val notificationsGranted: Boolean = true
)

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as JeeStudyGuardianApp
    private val container = app.container

    val preferences: StateFlow<UserPreferencesState> = container.preferencesManager.preferencesFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UserPreferencesState())

    val chapterProgress: StateFlow<List<ChapterProgressEntity>> =
        container.studyRepository.observeChapterProgress()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val studyNotes: StateFlow<List<StudyNoteEntity>> =
        container.studyRepository.observeNotes()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val savedQuestions: StateFlow<List<SavedQuestionEntity>> =
        container.studyRepository.observeSavedQuestions()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val chatHistory: StateFlow<List<ChatMessageEntity>> =
        container.aiTutorRepository.observeChatHistory()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val testHistory: StateFlow<List<MockTestResultEntity>> =
        container.mockTestRepository.observeHistory()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val studyGoals: StateFlow<List<StudyGoalEntity>> =
        container.plannerRepository.observeGoals()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val timetableSlots: StateFlow<List<TimetableSlotEntity>> =
        container.plannerRepository.observeTimetable()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val studyAlarms: StateFlow<List<StudyAlarmEntity>> =
        container.plannerRepository.observeAlarms()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val blockedApps: StateFlow<List<BlockedAppEntity>> =
        container.blockerRepository.observeBlockedApps()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val focusSessions: StateFlow<List<FocusSessionEntity>> =
        container.blockerRepository.observeFocusSessions()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val filterLogs: StateFlow<List<FilterLogEntity>> =
        container.blockerRepository.observeFilterLogs()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val dailyStats: StateFlow<List<DailyStudyStatEntity>> =
        container.studyRepository.observeDailyStats()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val subjectAnalytics: StateFlow<List<SubjectAnalytics>> = combine(
        chapterProgress,
        dailyStats,
        testHistory,
        preferences
    ) { prog, stats, tests, prefs ->
        AnalyticsCalculator.computeSubjectAnalytics(prog, stats, tests, prefs.selectedExamTrack)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val chapterStrengths: StateFlow<Pair<List<ChapterStrength>, List<ChapterStrength>>> =
        combine(chapterProgress, preferences) { prog, prefs ->
            AnalyticsCalculator.detectWeakAndStrongChapters(prog, prefs.selectedExamTrack)
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList<ChapterStrength>() to emptyList())

    private val _tutorState = MutableStateFlow(TutorUiState())
    val tutorState: StateFlow<TutorUiState> = _tutorState.asStateFlow()

    private val _mockTestState = MutableStateFlow(ActiveMockTestState())
    val mockTestState: StateFlow<ActiveMockTestState> = _mockTestState.asStateFlow()

    private val _installedApps = MutableStateFlow<List<InstalledAppInfo>>(emptyList())
    val installedApps: StateFlow<List<InstalledAppInfo>> = _installedApps.asStateFlow()

    private val _permissionStatus = MutableStateFlow(BlockerPermissionStatus())
    val permissionStatus: StateFlow<BlockerPermissionStatus> = _permissionStatus.asStateFlow()

    private val _focusRemainingSeconds = MutableStateFlow(0L)
    val focusRemainingSeconds: StateFlow<Long> = _focusRemainingSeconds.asStateFlow()

    private val _aiFilterPreviewResult = MutableStateFlow<FilterClassificationResult?>(null)
    val aiFilterPreviewResult: StateFlow<FilterClassificationResult?> = _aiFilterPreviewResult.asStateFlow()

    private val _statusBannerMessage = MutableStateFlow<String?>(null)
    val statusBannerMessage: StateFlow<String?> = _statusBannerMessage.asStateFlow()

    private val _authActionLoading = MutableStateFlow(false)
    val authActionLoading: StateFlow<Boolean> = _authActionLoading.asStateFlow()

    private val _authErrorMessage = MutableStateFlow<String?>(null)
    val authErrorMessage: StateFlow<String?> = _authErrorMessage.asStateFlow()

    private val _authSuccessMessage = MutableStateFlow<String?>(null)
    val authSuccessMessage: StateFlow<String?> = _authSuccessMessage.asStateFlow()

    val firebaseAuthState: StateFlow<FirebaseAuthUiState> = FirebaseSyncManager.authState

    val pomodoroManager = PomodoroTimerManager(
        scope = viewModelScope,
        onStudyCycleCompleted = { minutes ->
            viewModelScope.launch {
                container.studyRepository.addStudyMinutesToday(Subject.PHYSICS, minutes)
            }
        },
        onBreakReminder = { phase ->
            _statusBannerMessage.value = if (phase == PomodoroPhase.BREAK) {
                "Pomodoro complete! Take a short hydration break."
            } else {
                "Break complete! Back to JEE focus."
            }
        }
    )
    val pomodoroState: StateFlow<PomodoroUiState> = pomodoroManager.state

    private var mockTestTimerJob: Job? = null
    private var focusTickerJob: Job? = null
    private var lastHydratedUid: String? = null

    init {
        FirebaseSyncManager.initialize(app)
        startFocusTicker()
        viewModelScope.launch {
            val prefs = container.preferencesManager.preferencesFlow.first()
            _tutorState.value = _tutorState.value.copy(
                selectedLevel = prefs.aiDefaultLevel,
                selectedSubject = prefs.aiDefaultSubject
            )
        }
        viewModelScope.launch {
            FirebaseSyncManager.authState.collect { auth ->
                val uid = auth.uid
                if (auth.isSignedIn && !uid.isNullOrBlank() && uid != lastHydratedUid) {
                    lastHydratedUid = uid
                    hydrateAndSyncCloudProfile()
                } else if (!auth.isSignedIn) {
                    lastHydratedUid = null
                }
            }
        }
    }

    fun selectClassTrack(track: ExamTrack) {
        viewModelScope.launch {
            container.preferencesManager.setSelectedExamTrack(track)
            _tutorState.value = _tutorState.value.copy(selectedLevel = track.toStudyLevel())
        }
    }

    fun showNotice(message: String) {
        _statusBannerMessage.value = message
    }

    fun clearBanner() {
        _statusBannerMessage.value = null
    }

    // --- AI TUTOR ---
    fun setTutorSubject(subject: Subject) {
        _tutorState.value = _tutorState.value.copy(selectedSubject = subject)
    }

    fun setTutorMode(mode: String) {
        _tutorState.value = _tutorState.value.copy(selectedMode = mode)
    }

    fun setTutorLevel(level: StudyLevel) {
        _tutorState.value = _tutorState.value.copy(selectedLevel = level)
    }

    fun askAiTutor(question: String) {
        val trimmed = question.trim()
        if (trimmed.isBlank()) return
        viewModelScope.launch {
            val prefs = preferences.value
            _tutorState.value = _tutorState.value.copy(isLoading = true, errorMessage = null)
            val result = container.aiTutorRepository.sendQuestion(
                backendUrl = prefs.aiBackendUrl,
                question = trimmed,
                subject = _tutorState.value.selectedSubject,
                language = prefs.language,
                mode = _tutorState.value.selectedMode,
                level = _tutorState.value.selectedLevel
            )
            when (result) {
                is AiTutorResponse.Success -> {
                    _tutorState.value = _tutorState.value.copy(isLoading = false, errorMessage = null)
                }
                is AiTutorResponse.Error -> {
                    _tutorState.value = _tutorState.value.copy(isLoading = false, errorMessage = result.userMessage)
                }
            }
        }
    }

    fun toggleSaveChatAnswer(id: Long, currentlySaved: Boolean) {
        viewModelScope.launch { container.aiTutorRepository.toggleSaveAnswer(id, !currentlySaved) }
    }

    fun clearChatHistory() {
        viewModelScope.launch { container.aiTutorRepository.clearHistory() }
    }

    // --- JEE PRACTICE & NOTES ---
    fun toggleChapterCompleted(chapterId: String) {
        viewModelScope.launch { container.studyRepository.toggleChapterCompleted(chapterId) }
    }

    fun recordChapterRevision(chapterId: String) {
        viewModelScope.launch {
            container.studyRepository.recordChapterRevision(chapterId)
            _statusBannerMessage.value = "Chapter revision logged!"
        }
    }

    fun recordPracticeAnswer(question: PracticeQuestion, isCorrect: Boolean) {
        viewModelScope.launch { container.studyRepository.recordPracticeAttempt(question.chapterId, isCorrect) }
    }

    fun toggleSaveQuestion(question: PracticeQuestion, currentlySaved: Boolean) {
        viewModelScope.launch { container.studyRepository.toggleSaveQuestion(question, currentlySaved) }
    }

    fun addStudyNote(chapterId: String, subject: Subject, title: String, content: String) {
        if (title.isBlank() || content.isBlank()) return
        viewModelScope.launch {
            container.studyRepository.saveNote(chapterId, subject, title.trim(), content.trim())
            _statusBannerMessage.value = "Note saved locally."
        }
    }

    fun deleteNote(id: Long) {
        viewModelScope.launch { container.studyRepository.deleteNote(id) }
    }

    // --- MOCK TEST ENGINE ---
    fun startMockTest(config: MockTestConfig) {
        val pool = JeeContentCatalog.questions.filter { q ->
            val trackMatch = q.track == config.track ||
                (config.track == ExamTrack.JEE_ADVANCED && q.track == ExamTrack.JEE_MAIN)
            val subjectMatch = config.subjectFilter == null || q.subject == config.subjectFilter
            val chapterMatch = config.chapterIdFilter == null || q.chapterId == config.chapterIdFilter
            trackMatch && subjectMatch && chapterMatch
        }.ifEmpty {
            JeeContentCatalog.questions.filter { q ->
                config.subjectFilter == null || q.subject == config.subjectFilter
            }.ifEmpty { JeeContentCatalog.questions }
        }

        _mockTestState.value = ActiveMockTestState(
            isActive = true,
            isSubmitted = false,
            config = config,
            questions = pool,
            currentIndex = 0,
            selectedAnswers = emptyMap(),
            markedForReview = emptySet(),
            remainingSeconds = config.durationMinutes * 60,
            lastResult = null
        )

        mockTestTimerJob?.cancel()
        mockTestTimerJob = viewModelScope.launch {
            while (_mockTestState.value.isActive && !_mockTestState.value.isSubmitted) {
                delay(1000L)
                val rem = _mockTestState.value.remainingSeconds
                if (rem <= 1) {
                    submitMockTest()
                    break
                } else {
                    _mockTestState.value = _mockTestState.value.copy(remainingSeconds = rem - 1)
                }
            }
        }
    }

    fun selectMockOption(questionId: String, optionIndex: Int) {
        val current = _mockTestState.value
        val updated = current.selectedAnswers.toMutableMap()
        if (updated[questionId] == optionIndex) {
            updated.remove(questionId)
        } else {
            updated[questionId] = optionIndex
        }
        _mockTestState.value = current.copy(selectedAnswers = updated)
    }

    fun toggleMarkForReview(questionId: String) {
        val current = _mockTestState.value
        val next = current.markedForReview.toMutableSet()
        if (!next.add(questionId)) next.remove(questionId)
        _mockTestState.value = current.copy(markedForReview = next)
    }

    fun jumpToMockQuestion(index: Int) {
        val current = _mockTestState.value
        if (index in current.questions.indices) {
            _mockTestState.value = current.copy(currentIndex = index)
        }
    }

    fun submitMockTest() {
        mockTestTimerJob?.cancel()
        val state = _mockTestState.value
        if (!state.isActive || state.isSubmitted) return

        var correct = 0
        var incorrect = 0
        state.questions.forEach { q ->
            val picked = state.selectedAnswers[q.id]
            if (picked != null) {
                if (picked == q.correctOptionIndex) correct++ else incorrect++
            }
        }
        val attempted = correct + incorrect
        val penalty = if (state.config.negativeMarkingEnabled) state.config.negativeMarks else 0
        val score = correct * state.config.positiveMarks - incorrect * penalty
        val maxScore = state.questions.size * state.config.positiveMarks
        val accuracy = if (attempted > 0) (correct * 100f / attempted) else 0f
        val elapsedSeconds = (state.config.durationMinutes * 60 - state.remainingSeconds).coerceAtLeast(1)

        val result = MockTestResultEntity(
            title = state.config.title,
            track = state.config.track.label,
            subjectName = state.config.subjectFilter?.labelEn ?: "Full Syllabus",
            totalQuestions = state.questions.size,
            attempted = attempted,
            correct = correct,
            incorrect = incorrect,
            score = score,
            maxScore = maxScore,
            accuracyPercent = accuracy,
            durationTakenSeconds = elapsedSeconds
        )

        _mockTestState.value = state.copy(isSubmitted = true, lastResult = result)

        viewModelScope.launch {
            container.mockTestRepository.saveResult(result)
            FirebaseSyncManager.logEvent(
                app,
                "mock_test_completed",
                mapOf("track" to state.config.track.name, "score" to score.toString())
            )
            state.questions.forEach { q ->
                val picked = state.selectedAnswers[q.id]
                if (picked != null) {
                    container.studyRepository.recordPracticeAttempt(q.chapterId, picked == q.correctOptionIndex)
                }
            }
            val prefs = preferences.value
            val completedIds = chapterProgress.value.filter { it.isCompleted }.map { it.chapterId }
            val testsCount = container.database.mockTestResultDao().getAllOnce().size
            val computedXp = prefs.bonusXpPoints + completedIds.size * 50 + testsCount * 30
            FirebaseSyncManager.saveMockTestResult(
                result = result,
                selectedExamTrack = prefs.selectedExamTrack.name,
                studyStreakDays = prefs.studyStreakDays,
                xpPoints = computedXp,
                biometricEnabled = prefs.biometricLockEnabled
            )
            syncProgressToCloud(silent = true)
        }
    }

    fun closeMockTest() {
        mockTestTimerJob?.cancel()
        _mockTestState.value = ActiveMockTestState()
    }

    // --- PLANNER ---
    fun addStudyGoal(title: String, subject: Subject, targetMinutes: Int) {
        if (title.isBlank()) return
        viewModelScope.launch { container.plannerRepository.addGoal(title.trim(), subject, targetMinutes) }
    }

    fun toggleGoal(goal: StudyGoalEntity) {
        viewModelScope.launch { container.plannerRepository.toggleGoalCompleted(goal) }
    }

    fun deleteGoal(id: Long) {
        viewModelScope.launch { container.plannerRepository.deleteGoal(id) }
    }

    fun addTimetableSlot(dayOfWeek: Int, start: String, end: String, subject: Subject, chapter: String, isRevision: Boolean) {
        if (chapter.isBlank()) return
        viewModelScope.launch {
            container.plannerRepository.addTimetableSlot(dayOfWeek, start, end, subject, chapter.trim(), isRevision)
        }
    }

    fun deleteTimetableSlot(id: Long) {
        viewModelScope.launch { container.plannerRepository.deleteTimetableSlot(id) }
    }

    fun addStudyAlarm(hour: Int, minute: Int, label: String, daysCsv: String, subject: Subject) {
        viewModelScope.launch {
            val saved = container.plannerRepository.addAlarm(hour, minute, label.ifBlank { "Study Alarm" }, daysCsv, subject)
            StudyAlarmScheduler.schedule(app, saved)
            _statusBannerMessage.value = "Study alarm set!"
        }
    }

    fun toggleStudyAlarm(alarm: StudyAlarmEntity) {
        viewModelScope.launch {
            val updated = container.plannerRepository.toggleAlarm(alarm)
            if (updated.isEnabled) {
                StudyAlarmScheduler.schedule(app, updated)
            } else {
                StudyAlarmScheduler.cancel(app, updated.id)
            }
        }
    }

    fun deleteStudyAlarm(id: Long) {
        viewModelScope.launch {
            StudyAlarmScheduler.cancel(app, id)
            container.plannerRepository.deleteAlarm(id)
        }
    }

    // --- APP BLOCKER, YOUTUBE FILTER, AI CONTENT FILTER & FOCUS MODE ---
    fun refreshInstalledAppsAndPermissions(context: Context) {
        viewModelScope.launch {
            val blocked = container.database.blockedAppDao().getAllOnce()
            val apps = UsageStatsHelper.getInstalledUserApps(context, blocked)
            _installedApps.value = apps
            val notifEnabled = runCatching {
                NotificationManagerCompat.from(context).areNotificationsEnabled()
            }.getOrDefault(true)
            _permissionStatus.value = BlockerPermissionStatus(
                usageStatsGranted = UsageStatsHelper.hasUsageStatsPermission(context),
                notificationsGranted = notifEnabled
            )
        }
    }

    fun toggleBlockedApp(appInfo: InstalledAppInfo, context: Context) {
        viewModelScope.launch {
            container.blockerRepository.toggleBlockedApp(appInfo.packageName, appInfo.appName, appInfo.isBlocked)
            refreshInstalledAppsAndPermissions(context)
        }
    }

    fun startFocusSession(durationMinutes: Int) {
        viewModelScope.launch {
            val now = System.currentTimeMillis()
            val endEpoch = now + durationMinutes * 60_000L
            container.preferencesManager.setBlockerFocusState(
                enabled = true,
                endEpochMs = endEpoch,
                pausedRemainingMs = 0L,
                durationMinutes = durationMinutes
            )
            FocusGuardianForegroundService.start(app, endEpoch)
            _statusBannerMessage.value = "Focus Mode active for $durationMinutes minutes."
        }
    }

    fun pauseFocusSession() {
        viewModelScope.launch {
            val prefs = preferences.value
            val remaining = (prefs.focusEndEpochMs - System.currentTimeMillis()).coerceAtLeast(0L)
            container.preferencesManager.setBlockerFocusState(
                enabled = true,
                endEpochMs = 0L,
                pausedRemainingMs = remaining,
                durationMinutes = prefs.focusDurationMinutes
            )
            FocusGuardianForegroundService.stop(app)
        }
    }

    fun resumeFocusSession() {
        viewModelScope.launch {
            val prefs = preferences.value
            if (prefs.focusPausedRemainingMs > 0L) {
                val endEpoch = System.currentTimeMillis() + prefs.focusPausedRemainingMs
                container.preferencesManager.setBlockerFocusState(
                    enabled = true,
                    endEpochMs = endEpoch,
                    pausedRemainingMs = 0L,
                    durationMinutes = prefs.focusDurationMinutes
                )
                FocusGuardianForegroundService.start(app, endEpoch)
            }
        }
    }

    fun stopFocusSession(emergencyUnlocked: Boolean = false) {
        viewModelScope.launch {
            val prefs = preferences.value
            val now = System.currentTimeMillis()
            val plannedMs = prefs.focusDurationMinutes * 60_000L
            val remainingMs = when {
                prefs.focusPausedRemainingMs > 0L -> prefs.focusPausedRemainingMs
                prefs.focusEndEpochMs > now -> prefs.focusEndEpochMs - now
                else -> 0L
            }
            val actualMin = ((plannedMs - remainingMs) / 60_000L).toInt().coerceAtLeast(1)
            val blockedCount = blockedApps.value.count { it.isEnabled }

            container.blockerRepository.logFocusSession(
                FocusSessionEntity(
                    plannedMinutes = prefs.focusDurationMinutes,
                    actualMinutes = actualMin,
                    blockedAppsCount = blockedCount,
                    youtubeFilterEnabled = prefs.youtubeFilterEnabled,
                    aiFilterEnabled = prefs.aiFilterEnabled,
                    status = if (emergencyUnlocked) "EMERGENCY_UNLOCKED" else "COMPLETED",
                    startedAtEpochMs = now - actualMin * 60_000L,
                    endedAtEpochMs = now
                )
            )
            container.preferencesManager.setBlockerFocusState(
                enabled = false,
                endEpochMs = 0L,
                pausedRemainingMs = 0L,
                durationMinutes = prefs.focusDurationMinutes
            )
            FocusGuardianForegroundService.stop(app)
        }
    }

    fun updateYouTubeFilterConfig(
        enabled: Boolean,
        blockShorts: Boolean,
        blockWholeApp: Boolean,
        keywords: String,
        categories: String
    ) {
        viewModelScope.launch {
            container.preferencesManager.updateYouTubeFilter(enabled, blockShorts, blockWholeApp, keywords, categories)
        }
    }

    fun updateAiFilterConfig(
        enabled: Boolean,
        strictness: FilterStrictness,
        keywords: String,
        categories: String
    ) {
        viewModelScope.launch {
            container.preferencesManager.updateAiFilter(enabled, strictness, keywords, categories)
        }
    }

    fun testAiContentClassifier(sampleText: String) {
        val prefs = preferences.value
        val result = AiContentFilterEngine.classifyText(
            text = sampleText,
            enabled = prefs.aiFilterEnabled,
            strictness = prefs.aiFilterStrictness,
            customKeywordsCsv = prefs.aiFilterKeywords,
            enabledCategoriesCsv = prefs.aiFilterCategories
        )
        _aiFilterPreviewResult.value = result
        if (result.isFlagged) {
            viewModelScope.launch {
                container.blockerRepository.logFilterEvent(
                    source = "AI_CONTENT_FILTER",
                    summary = "${result.category}: ${result.matchedKeywords.joinToString()}",
                    rule = result.classificationType,
                    action = "FLAGGED"
                )
            }
        }
    }

    fun overrideLastFlaggedFilter(summary: String) {
        viewModelScope.launch {
            container.blockerRepository.logFilterEvent(
                source = "AI_CONTENT_FILTER",
                summary = "Manual override applied: $summary",
                rule = "USER_OVERRIDE",
                action = "OVERRIDDEN"
            )
            _aiFilterPreviewResult.value = null
            _statusBannerMessage.value = "Manual override logged locally."
        }
    }

    private fun startFocusTicker() {
        focusTickerJob?.cancel()
        focusTickerJob = viewModelScope.launch {
            while (true) {
                val prefs = preferences.value
                val now = System.currentTimeMillis()
                _focusRemainingSeconds.value = when {
                    !prefs.appBlockerEnabled -> 0L
                    prefs.focusPausedRemainingMs > 0L -> prefs.focusPausedRemainingMs / 1000L
                    prefs.focusEndEpochMs > now -> (prefs.focusEndEpochMs - now) / 1000L
                    else -> 0L
                }
                delay(1000L)
            }
        }
    }

    // --- SETTINGS & BACKUP ---
    fun setLanguage(mode: LanguageMode) = viewModelScope.launch { container.preferencesManager.setLanguage(mode) }
    fun setThemeMode(mode: ThemeMode) = viewModelScope.launch { container.preferencesManager.setThemeMode(mode) }
    fun setNotificationsEnabled(enabled: Boolean) = viewModelScope.launch { container.preferencesManager.setNotificationsEnabled(enabled) }
    fun setAiBackendUrl(url: String) = viewModelScope.launch {
        container.preferencesManager.setAiBackendUrl(url)
        _statusBannerMessage.value = "AI backend URL saved."
    }
    fun setAiModelPreference(model: String) = viewModelScope.launch { container.preferencesManager.setAiModelPreference(model) }
    fun setAiDefaults(level: StudyLevel, subject: Subject) = viewModelScope.launch {
        container.preferencesManager.setAiDefaults(level, subject)
        _tutorState.value = _tutorState.value.copy(selectedLevel = level, selectedSubject = subject)
    }
    fun setAdPreferences(personalized: Boolean, ageAppropriate: Boolean) = viewModelScope.launch {
        container.preferencesManager.setAdPreferences(personalized, ageAppropriate)
    }
    fun setBiometricLockEnabled(enabled: Boolean) = viewModelScope.launch {
        container.preferencesManager.setBiometricLockEnabled(enabled)
        _statusBannerMessage.value = if (enabled) {
            "Fingerprint / Screen Lock enabled."
        } else {
            "Fingerprint / Screen Lock disabled."
        }
    }
    fun awardBonusStudyXp(points: Int) = viewModelScope.launch {
        container.preferencesManager.addBonusXpPoints(points)
        FirebaseSyncManager.logEvent(app, "bonus_xp_earned", mapOf("points" to points.toString()))
        _statusBannerMessage.value = "+$points Bonus Study XP added!"
    }
    fun clearAuthError() {
        _authErrorMessage.value = null
        _authSuccessMessage.value = null
    }

    fun setAuthError(message: String) {
        _authErrorMessage.value = message
    }

    fun signInWithEmail(email: String, password: String) = viewModelScope.launch {
        _authActionLoading.value = true
        _authErrorMessage.value = null
        val result = FirebaseSyncManager.signInWithEmail(email, password)
        _authActionLoading.value = false
        result.fold(
            onSuccess = {
                FirebaseSyncManager.logEvent(app, "firebase_login", mapOf("method" to "email"))
                _statusBannerMessage.value = "Signed in to Firebase!"
            },
            onFailure = { err ->
                val msg = FirebaseSyncManager.friendlyAuthError(err)
                _authErrorMessage.value = msg
                _statusBannerMessage.value = msg
            }
        )
    }

    fun signInWithGoogle(idToken: String) = viewModelScope.launch {
        _authActionLoading.value = true
        _authErrorMessage.value = null
        val result = FirebaseSyncManager.signInWithGoogleCredential(idToken)
        _authActionLoading.value = false
        result.fold(
            onSuccess = {
                FirebaseSyncManager.logEvent(app, "firebase_login", mapOf("method" to "google"))
                _statusBannerMessage.value = "Signed in with Google successfully!"
            },
            onFailure = { err ->
                val msg = FirebaseSyncManager.friendlyAuthError(err)
                _authErrorMessage.value = msg
                _statusBannerMessage.value = msg
            }
        )
    }

    fun registerWithEmail(displayName: String, email: String, password: String) = viewModelScope.launch {
        _authActionLoading.value = true
        _authErrorMessage.value = null
        val result = FirebaseSyncManager.registerWithEmail(displayName, email, password)
        _authActionLoading.value = false
        result.fold(
            onSuccess = {
                FirebaseSyncManager.logEvent(app, "firebase_register", mapOf("method" to "email"))
                _statusBannerMessage.value = "Account created! Your study profile is ready."
            },
            onFailure = { err ->
                val msg = FirebaseSyncManager.friendlyAuthError(err)
                _authErrorMessage.value = msg
                _statusBannerMessage.value = msg
            }
        )
    }

    fun sendPasswordReset(email: String, isHindi: Boolean = false) = viewModelScope.launch {
        _authActionLoading.value = true
        _authErrorMessage.value = null
        _authSuccessMessage.value = null
        val result = FirebaseSyncManager.sendPasswordReset(email)
        _authActionLoading.value = false
        result.fold(
            onSuccess = {
                val successText = if (isHindi) {
                    "पासवर्ड रीसेट लिंक $email पर भेज दिया गया है! कृपया अपना इनबॉक्स और स्पैम (Spam/Junk) फोल्डर चेक करें।"
                } else {
                    "Password reset link sent to $email! Please check your inbox and spam/junk folder."
                }
                _authSuccessMessage.value = successText
                _statusBannerMessage.value = successText
            },
            onFailure = { err ->
                val msg = FirebaseSyncManager.friendlyAuthError(err)
                _authErrorMessage.value = msg
                _statusBannerMessage.value = msg
            }
        )
    }

    fun signOutFirebase() {
        lastHydratedUid = null
        FirebaseSyncManager.signOut()
        _authErrorMessage.value = null
        _statusBannerMessage.value = "Signed out from Firebase."
    }

    fun deleteAccountAndData() = viewModelScope.launch {
        _authActionLoading.value = true
        val result = FirebaseSyncManager.deleteAccountAndCloudData()
        _authActionLoading.value = false
        result.fold(
            onSuccess = {
                lastHydratedUid = null
                container.backupRepository.clearAllLocalData()
                _statusBannerMessage.value = "Account and study data permanently deleted."
            },
            onFailure = { err ->
                val raw = err.localizedMessage.orEmpty()
                val msg = if (raw.contains("recent login", ignoreCase = true) ||
                    raw.contains("CREDENTIAL_TOO_OLD", ignoreCase = true)
                ) {
                    "For security, please Sign Out and Sign In again before deleting your account."
                } else {
                    FirebaseSyncManager.friendlyAuthError(err)
                }
                _statusBannerMessage.value = msg
            }
        )
    }

    fun deleteAccountAndData() = viewModelScope.launch {
        _authActionLoading.value = true
        val result = FirebaseSyncManager.deleteAccountAndCloudData()
        _authActionLoading.value = false
        result.fold(
            onSuccess = {
                lastHydratedUid = null
                container.backupRepository.clearAllLocalData()
                _statusBannerMessage.value = "Account and study data permanently deleted."
            },
            onFailure = { err ->
                val raw = err.localizedMessage.orEmpty()
                val msg = if (raw.contains("recent login", ignoreCase = true) ||
                    raw.contains("CREDENTIAL_TOO_OLD", ignoreCase = true)
                ) {
                    "For security, please Sign Out and Sign In again before deleting your account."
                } else {
                    FirebaseSyncManager.friendlyAuthError(err)
                }
                _statusBannerMessage.value = msg
            }
        )
    }

    private suspend fun hydrateAndSyncCloudProfile() {
        runCatching {
            val cloudSummary = FirebaseSyncManager.fetchCloudStudySummary().getOrNull()
            val cloudTests = FirebaseSyncManager.fetchCloudMockTests().getOrNull().orEmpty()
            if (cloudTests.isNotEmpty()) {
                container.mockTestRepository.mergeCloudResults(cloudTests)
            }
            if (cloudSummary != null && cloudSummary.completedChapterIds.isNotEmpty()) {
                container.studyRepository.markChaptersCompleted(cloudSummary.completedChapterIds)
            }
            syncProgressToCloudInternal(silent = true)
        }
    }

    fun syncProgressToCloud(silent: Boolean = false) = viewModelScope.launch {
        syncProgressToCloudInternal(silent = silent)
    }

    private suspend fun syncProgressToCloudInternal(silent: Boolean) {
        val prefs = preferences.value
        val completedIds = container.database.chapterProgressDao().getAllOnce()
            .filter { it.isCompleted }
            .map { it.chapterId }
        val totalFocusMin = container.database.focusSessionDao().getAllOnce()
            .sumOf { it.actualMinutes }
        val allTests = container.database.mockTestResultDao().getAllOnce()
        val testsCount = allTests.size
        val computedXp = prefs.bonusXpPoints + completedIds.size * 50 + testsCount * 30
        val result = FirebaseSyncManager.syncStudyProgress(
            selectedExamTrack = prefs.selectedExamTrack.name,
            studyStreakDays = prefs.studyStreakDays,
            xpPoints = computedXp,
            biometricEnabled = prefs.biometricLockEnabled,
            dailyGoalMinutes = prefs.dailyGoalMinutes,
            totalFocusMinutes = totalFocusMin,
            totalMockTests = testsCount,
            completedChapterIds = completedIds,
            recentMockTests = allTests
        )
        if (!silent) {
            _statusBannerMessage.value = result.fold(
                onSuccess = {
                    FirebaseSyncManager.logEvent(app, "cloud_sync_completed")
                    "Synced $testsCount tests & profile progress to Firebase!"
                },
                onFailure = { err -> FirebaseSyncManager.friendlyAuthError(err) }
            )
        }
    }
    fun setNegativeMarking(enabled: Boolean) = viewModelScope.launch { container.preferencesManager.setNegativeMarking(enabled) }
    fun setPomodoroDurations(studyMin: Int, breakMin: Int) = viewModelScope.launch {
        container.preferencesManager.setPomodoroDurations(studyMin, breakMin)
        pomodoroManager.configureDurations(studyMin, breakMin)
    }

    suspend fun exportBackupJson(): String = container.backupRepository.exportLocalBackupJson()

    fun restoreBackupJson(json: String) {
        viewModelScope.launch {
            val result = container.backupRepository.restoreFromBackupJson(json)
            _statusBannerMessage.value = result.fold(
                onSuccess = { count -> "Restored $count local study records." },
                onFailure = { err -> "Restore failed: ${err.localizedMessage}" }
            )
        }
    }

    fun clearAllLocalData() {
        viewModelScope.launch {
            container.backupRepository.clearAllLocalData()
            _statusBannerMessage.value = "All local Room & DataStore data cleared."
        }
    }
}
