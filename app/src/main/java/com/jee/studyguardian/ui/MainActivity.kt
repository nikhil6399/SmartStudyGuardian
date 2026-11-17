package com.jee.studyguardian.ui

import android.app.Activity
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.fragment.app.FragmentActivity
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.jee.studyguardian.ads.AdManager
import com.jee.studyguardian.models.MockTestConfig
import com.jee.studyguardian.models.ThemeMode
import com.jee.studyguardian.navigation.BottomTab
import com.jee.studyguardian.navigation.SubRoutes
import com.jee.studyguardian.security.BiometricAuthHelper
import com.jee.studyguardian.ui.components.ClassSelectionDialog
import com.jee.studyguardian.ui.screens.AiTutorScreen
import com.jee.studyguardian.ui.screens.AnalyticsScreen
import com.jee.studyguardian.ui.screens.AuthGateScreen
import com.jee.studyguardian.ui.screens.BlockerAndFocusScreen
import com.jee.studyguardian.ui.screens.HomeDashboardScreen
import com.jee.studyguardian.ui.screens.JeePracticeScreen
import com.jee.studyguardian.ui.screens.MockTestScreen
import com.jee.studyguardian.ui.screens.SettingsScreen
import com.jee.studyguardian.ui.screens.StudyPlannerScreen
import com.jee.studyguardian.ui.theme.JeeStudyGuardianTheme
import com.jee.studyguardian.utils.AppStrings
import com.jee.studyguardian.viewmodel.MainViewModel

class MainActivity : FragmentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            val prefs by viewModel.preferences.collectAsState()
            val isDark = when (prefs.themeMode) {
                ThemeMode.DARK -> true
                ThemeMode.LIGHT -> false
                ThemeMode.SYSTEM -> isSystemInDarkTheme()
            }

            JeeStudyGuardianTheme(darkTheme = isDark) {
                JeeStudyGuardianRoot(viewModel = viewModel)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun JeeStudyGuardianRoot(viewModel: MainViewModel) {
    val navController = rememberNavController()
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    val prefs by viewModel.preferences.collectAsState()
    val dailyStats by viewModel.dailyStats.collectAsState()
    val subjectAnalytics by viewModel.subjectAnalytics.collectAsState()
    val studyGoals by viewModel.studyGoals.collectAsState()
    val chapterProgress by viewModel.chapterProgress.collectAsState()
    val savedQuestions by viewModel.savedQuestions.collectAsState()
    val studyNotes by viewModel.studyNotes.collectAsState()
    val chatHistory by viewModel.chatHistory.collectAsState()
    val tutorState by viewModel.tutorState.collectAsState()
    val mockTestState by viewModel.mockTestState.collectAsState()
    val testHistory by viewModel.testHistory.collectAsState()
    val timetableSlots by viewModel.timetableSlots.collectAsState()
    val studyAlarms by viewModel.studyAlarms.collectAsState()
    val installedApps by viewModel.installedApps.collectAsState()
    val permissionStatus by viewModel.permissionStatus.collectAsState()
    val focusRemainingSeconds by viewModel.focusRemainingSeconds.collectAsState()
    val focusSessions by viewModel.focusSessions.collectAsState()
    val filterLogs by viewModel.filterLogs.collectAsState()
    val pomodoroState by viewModel.pomodoroState.collectAsState()
    val chapterStrengths by viewModel.chapterStrengths.collectAsState()
    val bannerMessage by viewModel.statusBannerMessage.collectAsState()
    val authState by viewModel.firebaseAuthState.collectAsState()
    val authLoading by viewModel.authActionLoading.collectAsState()
    val authError by viewModel.authErrorMessage.collectAsState()
    var showClassDialog by remember { mutableStateOf(false) }

    var hasPassedSessionUnlock by rememberSaveable { mutableStateOf(false) }
    var autoPromptedBiometric by remember { mutableStateOf(false) }
    var biometricErrorMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        (context as? Activity)?.let { act ->
            AdManager.gatherConsentAndInitialize(act, prefs.ageAppropriateAdsOnly)
        }
    }

    LaunchedEffect(prefs.ageAppropriateAdsOnly) {
        AdManager.configureAgeAppropriateRequestConfig(prefs.ageAppropriateAdsOnly)
    }

    val isLocked = authState.isSignedIn && prefs.biometricLockEnabled && !hasPassedSessionUnlock
    LaunchedEffect(isLocked) {
        if (isLocked && !autoPromptedBiometric) {
            autoPromptedBiometric = true
            (context as? FragmentActivity)?.let { fragActivity ->
                BiometricAuthHelper.authenticate(
                    activity = fragActivity,
                    onSuccess = {
                        hasPassedSessionUnlock = true
                        biometricErrorMessage = null
                    },
                    onError = { err -> biometricErrorMessage = err }
                )
            }
        }
    }

    LaunchedEffect(bannerMessage) {
        bannerMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearBanner()
        }
    }

    if (!authState.isAuthInitialized) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    CircularProgressIndicator()
                    Text(
                        text = "Loading student profile...",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
        return
    }

    if (!authState.isSignedIn) {
        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) }
        ) { innerPadding ->
            Box(modifier = Modifier.padding(innerPadding)) {
                AuthGateScreen(
                    language = prefs.language,
                    isLoading = authLoading,
                    authError = authError,
                    onClearError = viewModel::clearAuthError,
                    onChangeLanguage = viewModel::setLanguage,
                    onSignInEmail = viewModel::signInWithEmail,
                    onRegisterEmail = viewModel::registerWithEmail,
                    onSendPasswordReset = viewModel::sendPasswordReset
                )
            }
        }
        return
    }

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: BottomTab.Home.route
    val isBottomTab = BottomTab.allTabs.any { it.route == currentRoute }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            if (!isBottomTab) {
                TopAppBar(
                    title = {
                        Text(
                            when (currentRoute) {
                                SubRoutes.MOCK_TEST -> "Mock Test"
                                SubRoutes.STUDY_PLANNER -> "Study Planner"
                                SubRoutes.ANALYTICS -> "Study Progress"
                                else -> "AI Study Guardian"
                            }
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    }
                )
            }
        },
        bottomBar = {
            if (isBottomTab) {
                NavigationBar {
                    BottomTab.allTabs.forEach { tab ->
                        val label = when (tab) {
                            BottomTab.Home -> AppStrings.navHome(prefs.language)
                            BottomTab.AiTutor -> AppStrings.navTutor(prefs.language)
                            BottomTab.JeePractice -> AppStrings.navPractice(prefs.language)
                            BottomTab.Blocker -> AppStrings.navBlocker(prefs.language)
                            BottomTab.Settings -> AppStrings.navSettings(prefs.language)
                        }
                        NavigationBarItem(
                            selected = currentRoute == tab.route,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = label) },
                            label = { Text(label, maxLines = 1) }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = BottomTab.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(BottomTab.Home.route) {
                HomeDashboardScreen(
                    prefs = prefs,
                    dailyStats = dailyStats,
                    subjectAnalytics = subjectAnalytics,
                    studyGoals = studyGoals,
                    studyAlarms = studyAlarms,
                    chapterProgress = chapterProgress,
                    focusRemainingSeconds = focusRemainingSeconds,
                    onNavigateTab = { route ->
                        navController.navigate(route) {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    onOpenMockTest = {
                        viewModel.startMockTest(
                            MockTestConfig(
                                title = "${prefs.selectedExamTrack.label} Mock Test",
                                track = prefs.selectedExamTrack,
                                durationMinutes = 20,
                                negativeMarkingEnabled = prefs.negativeMarkingEnabled
                            )
                        )
                        navController.navigate(SubRoutes.MOCK_TEST)
                    },
                    onOpenPlanner = { navController.navigate(SubRoutes.STUDY_PLANNER) },
                    onOpenAnalytics = { navController.navigate(SubRoutes.ANALYTICS) },
                    onOpenClassSelector = { showClassDialog = true },
                    onToggleGoal = viewModel::toggleGoal,
                    onWatchRewardedAd = {
                        (context as? Activity)?.let { act ->
                            AdManager.showRewardedAd(
                                activity = act,
                                onRewardEarned = { viewModel.awardBonusStudyXp(25) },
                                onUnavailable = {
                                    viewModel.showNotice("Rewarded ad is still loading. Try again shortly.")
                                }
                            )
                        }
                    }
                )
            }

            composable(BottomTab.AiTutor.route) {
                AiTutorScreen(
                    prefs = prefs,
                    tutorState = tutorState,
                    chatHistory = chatHistory,
                    onSelectSubject = viewModel::setTutorSubject,
                    onSelectMode = viewModel::setTutorMode,
                    onSelectLevel = viewModel::setTutorLevel,
                    onSendQuestion = viewModel::askAiTutor,
                    onToggleSaveAnswer = viewModel::toggleSaveChatAnswer,
                    onClearHistory = viewModel::clearChatHistory
                )
            }

            composable(BottomTab.JeePractice.route) {
                JeePracticeScreen(
                    prefs = prefs,
                    chapterProgress = chapterProgress,
                    savedQuestions = savedQuestions,
                    studyNotes = studyNotes,
                    testHistory = testHistory,
                    onToggleChapterComplete = viewModel::toggleChapterCompleted,
                    onRecordRevision = viewModel::recordChapterRevision,
                    onRecordPracticeAttempt = viewModel::recordPracticeAnswer,
                    onToggleSaveQuestion = viewModel::toggleSaveQuestion,
                    onAddNote = viewModel::addStudyNote,
                    onStartMockTest = { config ->
                        viewModel.startMockTest(config)
                        navController.navigate(SubRoutes.MOCK_TEST)
                    }
                )
            }

            composable(BottomTab.Blocker.route) {
                BlockerAndFocusScreen(
                    prefs = prefs,
                    installedApps = installedApps,
                    permissionStatus = permissionStatus,
                    focusRemainingSeconds = focusRemainingSeconds,
                    focusSessions = focusSessions,
                    filterLogs = filterLogs,
                    pomodoroState = pomodoroState,
                    onRefreshApps = { viewModel.refreshInstalledAppsAndPermissions(context) },
                    onToggleBlockedApp = { app -> viewModel.toggleBlockedApp(app, context) },
                    onStartFocusSession = viewModel::startFocusSession,
                    onPauseFocusSession = viewModel::pauseFocusSession,
                    onResumeFocusSession = viewModel::resumeFocusSession,
                    onStopFocusSession = viewModel::stopFocusSession,
                    onUpdateYouTubeFilter = viewModel::updateYouTubeFilterConfig,
                    onUpdateAiFilter = viewModel::updateAiFilterConfig,
                    onStartPomodoro = viewModel.pomodoroManager::startOrResume,
                    onPausePomodoro = viewModel.pomodoroManager::pause
                )
            }

            composable(BottomTab.Settings.route) {
                SettingsScreen(
                    prefs = prefs,
                    authState = authState,
                    testHistory = testHistory,
                    onSignInEmail = viewModel::signInWithEmail,
                    onRegisterEmail = viewModel::registerWithEmail,
                    onSendPasswordReset = viewModel::sendPasswordReset,
                    onSignOut = viewModel::signOutFirebase,
                    onSyncNow = { viewModel.syncProgressToCloud(silent = false) },
                    onSetBiometricLock = { enabled ->
                        if (enabled) hasPassedSessionUnlock = true
                        viewModel.setBiometricLockEnabled(enabled)
                    },
                    onTestBiometricLock = {
                        (context as? FragmentActivity)?.let { fragActivity ->
                            BiometricAuthHelper.authenticate(
                                activity = fragActivity,
                                onSuccess = { viewModel.showNotice("Fingerprint verification succeeded!") },
                                onError = { err -> viewModel.showNotice(err) }
                            )
                        }
                    },
                    onSetAdPreferences = viewModel::setAdPreferences,
                    onSelectClassTrack = viewModel::selectClassTrack,
                    onSetLanguage = viewModel::setLanguage,
                    onSetTheme = viewModel::setThemeMode,
                    onSetNotifications = viewModel::setNotificationsEnabled,
                    onSetNegativeMarking = viewModel::setNegativeMarking,
                    onSetAiDefaults = viewModel::setAiDefaults,
                    onExportBackup = viewModel::exportBackupJson,
                    onRestoreBackup = viewModel::restoreBackupJson,
                    onClearAllData = viewModel::clearAllLocalData
                )
            }

            composable(SubRoutes.MOCK_TEST) {
                MockTestScreen(
                    state = mockTestState,
                    onSelectOption = viewModel::selectMockOption,
                    onToggleReview = viewModel::toggleMarkForReview,
                    onJumpQuestion = viewModel::jumpToMockQuestion,
                    onSubmit = viewModel::submitMockTest,
                    onClose = {
                        val wasSubmitted = mockTestState.isSubmitted
                        viewModel.closeMockTest()
                        navController.popBackStack()
                        if (wasSubmitted) {
                            (context as? Activity)?.let { act ->
                                AdManager.showInterstitialIfReady(act, isTestOrFocusActive = false)
                            }
                        }
                    }
                )
            }

            composable(SubRoutes.STUDY_PLANNER) {
                StudyPlannerScreen(
                    goals = studyGoals,
                    timetable = timetableSlots,
                    alarms = studyAlarms,
                    pomodoroState = pomodoroState,
                    onAddGoal = viewModel::addStudyGoal,
                    onToggleGoal = viewModel::toggleGoal,
                    onDeleteGoal = viewModel::deleteGoal,
                    onAddSlot = viewModel::addTimetableSlot,
                    onDeleteSlot = viewModel::deleteTimetableSlot,
                    onAddAlarm = viewModel::addStudyAlarm,
                    onToggleAlarm = viewModel::toggleStudyAlarm,
                    onDeleteAlarm = viewModel::deleteStudyAlarm,
                    onStartPomodoro = viewModel.pomodoroManager::startOrResume,
                    onPausePomodoro = viewModel.pomodoroManager::pause,
                    onResetPomodoro = viewModel.pomodoroManager::reset
                )
            }

            composable(SubRoutes.ANALYTICS) {
                AnalyticsScreen(
                    dailyStats = dailyStats,
                    subjectAnalytics = subjectAnalytics,
                    chapterStrengths = chapterStrengths,
                    testHistory = testHistory,
                    focusSessions = focusSessions,
                    goals = studyGoals
                )
            }
        }
    }

    if (!prefs.hasSelectedClass || showClassDialog) {
        ClassSelectionDialog(
            currentTrack = prefs.selectedExamTrack,
            language = prefs.language,
            isInitialSetup = !prefs.hasSelectedClass,
            onSelectTrack = { track ->
                viewModel.selectClassTrack(track)
                showClassDialog = false
            },
            onChangeLanguage = viewModel::setLanguage,
            onDismiss = { showClassDialog = false }
        )
    }

    if (isLocked) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Fingerprint,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "AI Study Guardian Locked",
                        style = MaterialTheme.typography.headlineSmall,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = "Verify your fingerprint or screen lock to access your study workspace.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center
                    )
                    biometricErrorMessage?.let { err ->
                        Text(
                            text = err,
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.error,
                            textAlign = TextAlign.Center
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Button(
                        onClick = {
                            (context as? FragmentActivity)?.let { fragActivity ->
                                BiometricAuthHelper.authenticate(
                                    activity = fragActivity,
                                    onSuccess = {
                                        hasPassedSessionUnlock = true
                                        biometricErrorMessage = null
                                    },
                                    onError = { err -> biometricErrorMessage = err }
                                )
                            }
                        }
                    ) {
                        Icon(Icons.Default.Fingerprint, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Unlock with Fingerprint")
                    }
                }
            }
        }
    }
}
