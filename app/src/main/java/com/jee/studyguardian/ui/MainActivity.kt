package com.jee.studyguardian.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.jee.studyguardian.models.MockTestConfig
import com.jee.studyguardian.models.ThemeMode
import com.jee.studyguardian.navigation.BottomTab
import com.jee.studyguardian.navigation.SubRoutes
import com.jee.studyguardian.ui.components.ClassSelectionDialog
import com.jee.studyguardian.ui.screens.AiTutorScreen
import com.jee.studyguardian.ui.screens.AnalyticsScreen
import com.jee.studyguardian.ui.screens.BlockerAndFocusScreen
import com.jee.studyguardian.ui.screens.HomeDashboardScreen
import com.jee.studyguardian.ui.screens.JeePracticeScreen
import com.jee.studyguardian.ui.screens.MockTestScreen
import com.jee.studyguardian.ui.screens.SettingsScreen
import com.jee.studyguardian.ui.screens.StudyPlannerScreen
import com.jee.studyguardian.ui.theme.JeeStudyGuardianTheme
import com.jee.studyguardian.utils.AppStrings
import com.jee.studyguardian.viewmodel.MainViewModel

class MainActivity : ComponentActivity() {

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
    var showClassDialog by remember { mutableStateOf(false) }

    LaunchedEffect(bannerMessage) {
        bannerMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearBanner()
        }
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
                    onToggleGoal = viewModel::toggleGoal
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
                        viewModel.closeMockTest()
                        navController.popBackStack()
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
}
