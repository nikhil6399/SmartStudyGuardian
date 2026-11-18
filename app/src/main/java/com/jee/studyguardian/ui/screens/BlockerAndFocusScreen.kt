package com.jee.studyguardian.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.jee.studyguardian.data.UserPreferencesState
import com.jee.studyguardian.database.FilterLogEntity
import com.jee.studyguardian.database.FocusSessionEntity
import com.jee.studyguardian.filters.YouTubeCheckResult
import com.jee.studyguardian.models.FilterClassificationResult
import com.jee.studyguardian.models.FilterStrictness
import com.jee.studyguardian.models.InstalledAppInfo
import com.jee.studyguardian.models.LanguageMode
import com.jee.studyguardian.planner.PomodoroUiState
import com.jee.studyguardian.ui.components.GuardianCard
import com.jee.studyguardian.ui.components.PermissionRationaleDialog
import com.jee.studyguardian.utils.PermissionIntents
import com.jee.studyguardian.utils.TimeFormatters
import com.jee.studyguardian.viewmodel.BlockerPermissionStatus

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun BlockerAndFocusScreen(
    prefs: UserPreferencesState,
    installedApps: List<InstalledAppInfo>,
    permissionStatus: BlockerPermissionStatus,
    focusRemainingSeconds: Long,
    focusSessions: List<FocusSessionEntity>,
    filterLogs: List<FilterLogEntity>,
    pomodoroState: PomodoroUiState,
    onRefreshApps: () -> Unit,
    onToggleBlockedApp: (InstalledAppInfo) -> Unit,
    onStartFocusSession: (Int) -> Unit,
    onPauseFocusSession: () -> Unit,
    onResumeFocusSession: () -> Unit,
    onStopFocusSession: (Boolean) -> Unit,
    onUpdateYouTubeFilter: (Boolean, Boolean, Boolean, String, String) -> Unit,
    onUpdateAiFilter: (Boolean, FilterStrictness, String, String) -> Unit,
    onStartPomodoro: () -> Unit,
    onPausePomodoro: () -> Unit,
    aiFilterPreviewResult: FilterClassificationResult? = null,
    youtubePreviewResult: YouTubeCheckResult? = null,
    onTestAiClassifier: (String) -> Unit = {},
    onOverrideAiFilter: (String) -> Unit = {},
    onTestYouTubeFilter: (String) -> Unit = {}
) {
    val context = LocalContext.current
    val isHindi = prefs.language == LanguageMode.HINDI
    var selectedSubTab by remember { mutableIntStateOf(0) }
    var selectedFocusDuration by remember { mutableIntStateOf(120) }
    var showUsageRationale by remember { mutableStateOf(false) }
    var showNotificationRationale by remember { mutableStateOf(false) }

    val blockingConfirmedActive = prefs.appBlockerEnabled && permissionStatus.usageStatsGranted
    val selectedAppsCount = installedApps.count { it.isBlocked }

    LaunchedEffect(Unit) {
        onRefreshApps()
    }

    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(selectedTabIndex = selectedSubTab) {
            listOf(
                if (isHindi) "फोकस मोड" else "Focus Mode",
                if (isHindi) "ऐप ब्लॉकर" else "App Blocker",
                "YouTube",
                if (isHindi) "AI फ़िल्टर" else "Content Filter"
            ).forEachIndexed { idx, title ->
                Tab(
                    selected = selectedSubTab == idx,
                    onClick = { selectedSubTab = idx },
                    text = { Text(title, maxLines = 1) }
                )
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            when (selectedSubTab) {
                // 1. SMART STUDY FOCUS MODE
                0 -> {
                    item {
                        GuardianCard {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Text(
                                    if (isHindi) "स्मार्ट स्टडी फोकस" else "Study Focus Mode",
                                    style = MaterialTheme.typography.titleLarge
                                )
                                Text(
                                    if (isHindi) "पढ़ाई के दौरान ध्यान भटकाने वाले ऐप्स को रोकें और पोमोडोरो टाइमर के साथ एकाग्र रहें।"
                                    else "Stay focused with your Pomodoro timer and distraction shields.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )

                                if (!permissionStatus.usageStatsGranted) {
                                    Text(
                                        if (isHindi) "ऐप ब्लॉकिंग और स्क्रीन टाइम चालू करने के लिए नीचे 'फोकस अनुमति दें' पर टैप करें।"
                                        else "Usage Access permission is required to detect and shield distracting apps during Focus sessions.",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.secondary
                                    )
                                    OutlinedButton(onClick = { showUsageRationale = true }) {
                                        Text(if (isHindi) "फोकस अनुमति दें" else "Grant Focus Shield Permission")
                                    }
                                }

                                if (prefs.appBlockerEnabled) {
                                    Text(
                                        when {
                                            prefs.focusPausedRemainingMs > 0L ->
                                                "Paused · ${TimeFormatters.formatCountdownHms(focusRemainingSeconds)}"
                                            blockingConfirmedActive ->
                                                "Active Shield · ${TimeFormatters.formatCountdownHms(focusRemainingSeconds)}"
                                            else ->
                                                "Timer Running (Permission Pending) · ${TimeFormatters.formatCountdownHms(focusRemainingSeconds)}"
                                        },
                                        style = MaterialTheme.typography.headlineMedium,
                                        color = MaterialTheme.colorScheme.secondary
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        if (prefs.focusPausedRemainingMs > 0L) {
                                            Button(onClick = onResumeFocusSession, modifier = Modifier.weight(1f)) {
                                                Text(if (isHindi) "फिर शुरू करें" else "Resume")
                                            }
                                        } else {
                                            OutlinedButton(onClick = onPauseFocusSession, modifier = Modifier.weight(1f)) {
                                                Text(if (isHindi) "थोड़ा रुकें" else "Pause")
                                            }
                                        }
                                        Button(onClick = { onStopFocusSession(false) }, modifier = Modifier.weight(1f)) {
                                            Text(if (isHindi) "सत्र समाप्त" else "End Session")
                                        }
                                    }
                                } else {
                                    Text(
                                        if (isHindi) "फोकस समय चुनें" else "Select Focus Duration",
                                        style = MaterialTheme.typography.labelMedium
                                    )
                                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        listOf(60 to "1 Hour", 120 to "2 Hours", 180 to "3 Hours", 240 to "4 Hours").forEach { (min, label) ->
                                            FilterChip(
                                                selected = selectedFocusDuration == min,
                                                onClick = { selectedFocusDuration = min },
                                                label = { Text(label) }
                                            )
                                        }
                                    }
                                    Button(
                                        onClick = {
                                            onStartFocusSession(selectedFocusDuration)
                                            onStartPomodoro()
                                        },
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(if (isHindi) "फोकस मोड शुरू करें" else "Start Study Focus")
                                    }
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        "Pomodoro (${pomodoroState.phase.name}): ${TimeFormatters.formatCountdownMmSs(pomodoroState.remainingSeconds)}",
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    OutlinedButton(onClick = {
                                        if (pomodoroState.isRunning) onPausePomodoro() else onStartPomodoro()
                                    }) {
                                        Text(if (pomodoroState.isRunning) "Pause" else "Start")
                                    }
                                }
                            }
                        }
                    }

                    item { Text(if (isHindi) "पिछले फोकस सत्र" else "Focus History", style = MaterialTheme.typography.titleMedium) }
                    items(focusSessions.take(5)) { session ->
                        GuardianCard {
                            Column {
                                Text("${session.actualMinutes}/${session.plannedMinutes} min · ${session.status}", fontWeight = FontWeight.SemiBold)
                                Text(
                                    "${session.blockedAppsCount} apps selected",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }

                // 2. APP BLOCKER
                1 -> {
                    item {
                        GuardianCard {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(
                                    if (isHindi) "ऐप अनुमतियाँ" else "Required Permissions",
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Text(
                                    if (isHindi) "आपका व्यक्तिगत डेटा, संदेश और पासवर्ड कभी नहीं पढ़े जाते। अनुमति केवल चुने गए ऐप्स को पढ़ाई के समय रोकने के लिए है।"
                                    else "Your messages, passwords, and screen contents stay private. Permissions are only used to show daily screen time and pause apps you select.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = if (blockingConfirmedActive) {
                                        "$selectedAppsCount apps selected · Focus Shield ACTIVE"
                                    } else {
                                        "$selectedAppsCount apps selected · Start Study Focus in tab 1 to activate shield"
                                    },
                                    style = MaterialTheme.typography.labelMedium,
                                    color = if (blockingConfirmedActive) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.secondary
                                )
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedButton(
                                        onClick = { showUsageRationale = true },
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text(if (permissionStatus.usageStatsGranted) "App Shield: ON" else "Enable App Shield")
                                    }
                                    OutlinedButton(
                                        onClick = { showNotificationRationale = true },
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text(if (permissionStatus.notificationsGranted) "Alerts: ON" else "Enable Alerts")
                                    }
                                }
                            }
                        }
                    }

                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                if (isHindi) "ब्लॉक करने के लिए ऐप्स चुनें" else "Choose Apps to Block",
                                style = MaterialTheme.typography.titleMedium
                            )
                            OutlinedButton(onClick = onRefreshApps) { Text("Refresh") }
                        }
                    }

                    items(installedApps, key = { it.packageName }) { appInfo ->
                        GuardianCard {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = appInfo.isBlocked,
                                    onCheckedChange = { onToggleBlockedApp(appInfo) }
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(appInfo.appName, fontWeight = FontWeight.Medium)
                                    Text(
                                        "Today's usage: ${appInfo.dailyMinutesUsed} min",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    val appBlockLogs = filterLogs.filter { it.source == "APP_BLOCKER" }.take(5)
                    if (appBlockLogs.isNotEmpty()) {
                        item {
                            Text(
                                if (isHindi) "हाल ही में रोके गए ऐप्स" else "Recent App Shield Events",
                                style = MaterialTheme.typography.titleMedium
                            )
                        }
                        items(appBlockLogs) { log ->
                            GuardianCard {
                                Text("${log.actionTaken}: ${log.summary}", style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                }

                // 3. YOUTUBE STUDY MODE
                2 -> {
                    item {
                        var ytEnabled by remember(prefs.youtubeFilterEnabled) { mutableStateOf(prefs.youtubeFilterEnabled) }
                        var blockShorts by remember(prefs.youtubeBlockShorts) { mutableStateOf(prefs.youtubeBlockShorts) }
                        var blockWhole by remember(prefs.youtubeBlockWholeApp) { mutableStateOf(prefs.youtubeBlockWholeApp) }
                        var ytKeywords by remember(prefs.youtubeBlockedKeywords) { mutableStateOf(prefs.youtubeBlockedKeywords) }
                        var ytCategories by remember(prefs.youtubeAllowedCategories) { mutableStateOf(prefs.youtubeAllowedCategories) }

                        GuardianCard {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Text("YouTube Study Control", style = MaterialTheme.typography.titleLarge)
                                Text(
                                    "Reduce Shorts and distracting topics during study hours, or block YouTube completely while Focus Mode is active.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )

                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Text("Enable YouTube Study Filter")
                                    Switch(checked = ytEnabled, onCheckedChange = {
                                        ytEnabled = it
                                        onUpdateYouTubeFilter(ytEnabled, blockShorts, blockWhole, ytKeywords, ytCategories)
                                    })
                                }
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Text("Hide YouTube Shorts")
                                    Switch(checked = blockShorts, onCheckedChange = {
                                        blockShorts = it
                                        onUpdateYouTubeFilter(ytEnabled, blockShorts, blockWhole, ytKeywords, ytCategories)
                                    })
                                }
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Text("Block YouTube During Focus")
                                    Switch(checked = blockWhole, onCheckedChange = {
                                        blockWhole = it
                                        onUpdateYouTubeFilter(ytEnabled, blockShorts, blockWhole, ytKeywords, ytCategories)
                                    })
                                }
                                OutlinedTextField(
                                    value = ytKeywords,
                                    onValueChange = { ytKeywords = it },
                                    label = { Text("Distracting Topics to Block") },
                                    modifier = Modifier.fillMaxWidth()
                                )
                                OutlinedTextField(
                                    value = ytCategories,
                                    onValueChange = { ytCategories = it },
                                    label = { Text("Study Topics") },
                                    modifier = Modifier.fillMaxWidth()
                                )
                                Button(
                                    onClick = { onUpdateYouTubeFilter(ytEnabled, blockShorts, blockWhole, ytKeywords, ytCategories) },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("Save Preferences")
                                }
                            }
                        }
                    }

                    item {
                        var sampleYtText by remember { mutableStateOf("") }
                        GuardianCard {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("Test YouTube Video / Topic Filter", style = MaterialTheme.typography.titleMedium)
                                OutlinedTextField(
                                    value = sampleYtText,
                                    onValueChange = { sampleYtText = it },
                                    label = { Text("Paste video title or #shorts link") },
                                    modifier = Modifier.fillMaxWidth()
                                )
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    listOf(
                                        "BGMI live gaming vlog",
                                        "Viral #shorts prank",
                                        "Rotational Motion JEE Physics"
                                    ).forEach { preset ->
                                        FilterChip(
                                            selected = sampleYtText == preset,
                                            onClick = {
                                                sampleYtText = preset
                                                onTestYouTubeFilter(preset)
                                            },
                                            label = { Text(preset) }
                                        )
                                    }
                                }
                                OutlinedButton(
                                    onClick = {
                                        if (sampleYtText.isNotBlank()) onTestYouTubeFilter(sampleYtText)
                                    },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("Check Video Safety")
                                }
                                youtubePreviewResult?.let { ytResult ->
                                    Text(
                                        text = if (ytResult.shouldBlock) "BLOCKED: ${ytResult.reason}" else "ALLOWED: ${ytResult.reason}",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = if (ytResult.shouldBlock) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.tertiary
                                    )
                                }
                            }
                        }
                    }

                    items(filterLogs.filter { it.source == "YOUTUBE_FILTER" }.take(8)) { log ->
                        GuardianCard {
                            Text("${log.actionTaken}: ${log.summary}", style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }

                // 4. CONTENT SAFETY FILTER
                3 -> {
                    item {
                        var aiEnabled by remember(prefs.aiFilterEnabled) { mutableStateOf(prefs.aiFilterEnabled) }
                        var strictness by remember(prefs.aiFilterStrictness) { mutableStateOf(prefs.aiFilterStrictness) }
                        var keywords by remember(prefs.aiFilterKeywords) { mutableStateOf(prefs.aiFilterKeywords) }
                        var categories by remember(prefs.aiFilterCategories) { mutableStateOf(prefs.aiFilterCategories) }

                        GuardianCard {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Text("AI Content Safety Filter", style = MaterialTheme.typography.titleLarge)
                                Text(
                                    "Automatically shields distracting social, gaming, and unsafe apps during Focus sessions and classifies pasted titles or links on-device.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )

                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Text("Enable Content Filter")
                                    Switch(checked = aiEnabled, onCheckedChange = {
                                        aiEnabled = it
                                        onUpdateAiFilter(aiEnabled, strictness, keywords, categories)
                                    })
                                }

                                Text("Strictness", style = MaterialTheme.typography.labelMedium)
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    FilterStrictness.entries.forEach { level ->
                                        FilterChip(
                                            selected = strictness == level,
                                            onClick = {
                                                strictness = level
                                                onUpdateAiFilter(aiEnabled, strictness, keywords, categories)
                                            },
                                            label = { Text(level.label) }
                                        )
                                    }
                                }

                                OutlinedTextField(
                                    value = keywords,
                                    onValueChange = { keywords = it },
                                    label = { Text("Blocked Keywords") },
                                    modifier = Modifier.fillMaxWidth()
                                )
                                OutlinedTextField(
                                    value = categories,
                                    onValueChange = { categories = it },
                                    label = { Text("Filter Categories") },
                                    modifier = Modifier.fillMaxWidth()
                                )
                                Button(
                                    onClick = { onUpdateAiFilter(aiEnabled, strictness, keywords, categories) },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("Save Filter Settings")
                                }
                            }
                        }
                    }

                    item {
                        var sampleContent by remember { mutableStateOf("") }
                        GuardianCard {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("AI Content Analyzer & Block Test", style = MaterialTheme.typography.titleMedium)
                                Text(
                                    "Test how AI recognizes apps, titles, or websites and decides whether to block them:",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                OutlinedTextField(
                                    value = sampleContent,
                                    onValueChange = { sampleContent = it },
                                    label = { Text("Enter app name, title, or URL to test") },
                                    modifier = Modifier.fillMaxWidth()
                                )
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    listOf(
                                        "Instagram Reels",
                                        "BGMI Tournament",
                                        "Best casino betting",
                                        "Gauss Law JEE Physics"
                                    ).forEach { sample ->
                                        FilterChip(
                                            selected = sampleContent == sample,
                                            onClick = {
                                                sampleContent = sample
                                                onTestAiClassifier(sample)
                                            },
                                            label = { Text(sample) }
                                        )
                                    }
                                }
                                Button(
                                    onClick = {
                                        if (sampleContent.isNotBlank()) onTestAiClassifier(sampleContent)
                                    },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("Analyze & Check Block")
                                }

                                aiFilterPreviewResult?.let { result ->
                                    GuardianCard {
                                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                            Text(
                                                text = if (result.isFlagged) {
                                                    "BLOCKED / FLAGGED · ${result.category}"
                                                } else {
                                                    "STUDY SAFE · ${result.category}"
                                                },
                                                style = MaterialTheme.typography.titleSmall,
                                                fontWeight = FontWeight.Bold,
                                                color = if (result.isFlagged) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.tertiary
                                            )
                                            Text(
                                                text = result.classificationType,
                                                style = MaterialTheme.typography.labelMedium
                                            )
                                            if (result.matchedKeywords.isNotEmpty()) {
                                                Text(
                                                    text = "Matched: ${result.matchedKeywords.joinToString(", ")}",
                                                    style = MaterialTheme.typography.bodySmall
                                                )
                                            }
                                            Text(
                                                text = result.confidenceNote,
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                            if (result.isFlagged) {
                                                OutlinedButton(
                                                    onClick = {
                                                        onOverrideAiFilter("${result.category}: ${result.matchedKeywords.joinToString()}")
                                                    },
                                                    modifier = Modifier.fillMaxWidth()
                                                ) {
                                                    Text("Apply Manual Override Once")
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    val aiLogs = filterLogs.filter { it.source == "AI_CONTENT_FILTER" }.take(8)
                    if (aiLogs.isNotEmpty()) {
                        item {
                            Text(
                                if (isHindi) "AI फ़िल्टर ब्लॉक लॉग" else "AI Content Filter Logs",
                                style = MaterialTheme.typography.titleMedium
                            )
                        }
                        items(aiLogs) { log ->
                            GuardianCard {
                                Text("${log.actionTaken}: ${log.summary}", style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                }
            }
        }
    }

    if (showUsageRationale) {
        PermissionRationaleDialog(
            title = if (isHindi) "स्क्रीन टाइम व फोकस शील्ड अनुमति" else "Screen Time & App Shield Permission",
            explanation = if (isHindi) "यह अनुमति केवल आपके फ़ोन पर आज का ऐप उपयोग समय दिखाने और पढ़ाई के समय चुने गए ध्यान भटकाने वाले ऐप्स को रोकने के लिए उपयोग होती है। पासवर्ड या निजी संदेश कभी नहीं पढ़े जाते।"
            else "Used strictly on your device to track daily app usage time and alert/shield apps you select during active Focus sessions. Passwords, chats, and screen contents are never read.",
            confirmLabel = if (isHindi) "सेटिंग्स खोलें" else "Continue to Settings",
            onConfirm = {
                showUsageRationale = false
                PermissionIntents.openUsageAccessSettings(context)
            },
            onDismiss = { showUsageRationale = false }
        )
    }

    if (showNotificationRationale) {
        PermissionRationaleDialog(
            title = if (isHindi) "नोटिफिकेशन अनुमति" else "Study & Focus Alerts",
            explanation = if (isHindi) "फोकस टाइमर, स्टडी अलार्म और ध्यान भटकाने वाले ऐप्स की चेतावनी दिखाने के लिए नोटिफिकेशन अनुमति चालू रखें।"
            else "Required to display active Focus session timers, Study Alarms, and distraction shield reminders.",
            confirmLabel = if (isHindi) "सेटिंग्स खोलें" else "Open Notification Settings",
            onConfirm = {
                showNotificationRationale = false
                PermissionIntents.openNotificationSettings(context)
            },
            onDismiss = { showNotificationRationale = false }
        )
    }
}
