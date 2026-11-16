package com.jee.studyguardian.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.jee.studyguardian.data.UserPreferencesState
import com.jee.studyguardian.models.ExamTrack
import com.jee.studyguardian.models.LanguageMode
import com.jee.studyguardian.models.StudyLevel
import com.jee.studyguardian.models.Subject
import com.jee.studyguardian.models.ThemeMode
import com.jee.studyguardian.ui.components.GuardianCard
import com.jee.studyguardian.utils.ClipboardHelper
import kotlinx.coroutines.launch

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SettingsScreen(
    prefs: UserPreferencesState,
    onSelectClassTrack: (ExamTrack) -> Unit,
    onSetLanguage: (LanguageMode) -> Unit,
    onSetTheme: (ThemeMode) -> Unit,
    onSetNotifications: (Boolean) -> Unit,
    onSetNegativeMarking: (Boolean) -> Unit,
    onSetAiDefaults: (StudyLevel, Subject) -> Unit,
    onExportBackup: suspend () -> String,
    onRestoreBackup: (String) -> Unit,
    onClearAllData: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val isHindi = prefs.language == LanguageMode.HINDI

    var restoreJsonInput by remember { mutableStateOf("") }
    var showRestoreDialog by remember { mutableStateOf(false) }
    var showClearDialog by remember { mutableStateOf(false) }
    var showPrivacyDialog by remember { mutableStateOf(false) }
    var showHelpDialog by remember { mutableStateOf(false) }
    var backupNotice by remember { mutableStateOf<String?>(null) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                if (isHindi) "सेटिंग्स" else "Settings",
                style = MaterialTheme.typography.titleLarge
            )
        }

        // 1. Language & 2. Light/Dark Theme
        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(if (isHindi) "भाषा (Language)" else "Language", style = MaterialTheme.typography.titleMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        LanguageMode.entries.forEach { lang ->
                            FilterChip(
                                selected = prefs.language == lang,
                                onClick = { onSetLanguage(lang) },
                                label = { Text(lang.displayName) }
                            )
                        }
                    }

                    Text(if (isHindi) "थीम (Theme)" else "Light / Dark Theme", style = MaterialTheme.typography.titleMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ThemeMode.entries.forEach { mode ->
                            FilterChip(
                                selected = prefs.themeMode == mode,
                                onClick = { onSetTheme(mode) },
                                label = { Text(if (isHindi) mode.labelHi else mode.labelEn) }
                            )
                        }
                    }

                    Text(
                        if (isHindi) "चुनी हुई कक्षा / परीक्षा" else "Active Class Board / Exam",
                        style = MaterialTheme.typography.titleMedium
                    )
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ExamTrack.entries.forEach { track ->
                            FilterChip(
                                selected = prefs.selectedExamTrack == track,
                                onClick = { onSelectClassTrack(track) },
                                label = { Text(if (isHindi) track.labelHi else track.label) }
                            )
                        }
                    }
                }
            }
        }

        // 3. Notifications & 4. Study Preferences
        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        if (isHindi) "सूचनाएं और अध्ययन प्राथमिकताएं" else "Notifications & Study Preferences",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(if (isHindi) "अध्ययन और ब्रेक रिमाइंडर" else "Study & Break Reminders")
                        Switch(checked = prefs.notificationsEnabled, onCheckedChange = onSetNotifications)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(if (isHindi) "मॉक टेस्ट नेगेटिव मार्किंग (-1)" else "Mock Test Negative Marking (-1)")
                        Switch(checked = prefs.negativeMarkingEnabled, onCheckedChange = onSetNegativeMarking)
                    }
                }
            }
        }

        // 5. AI Tutor Preferences
        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        if (isHindi) "AI ट्यूटर प्राथमिकताएं" else "AI Tutor Preferences",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        if (isHindi) "डिफ़ॉल्ट कक्षा / परीक्षा स्तर" else "Default Class Board / Exam Level",
                        style = MaterialTheme.typography.labelMedium
                    )
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        StudyLevel.entries.forEach { lvl ->
                            FilterChip(
                                selected = prefs.aiDefaultLevel == lvl,
                                onClick = { onSetAiDefaults(lvl, prefs.aiDefaultSubject) },
                                label = { Text(if (isHindi) lvl.labelHi else lvl.labelEn) }
                            )
                        }
                    }
                    Text(
                        if (isHindi) "डिफ़ॉल्ट विषय" else "Default Subject",
                        style = MaterialTheme.typography.labelMedium
                    )
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Subject.entries.forEach { subj ->
                            FilterChip(
                                selected = prefs.aiDefaultSubject == subj,
                                onClick = { onSetAiDefaults(prefs.aiDefaultLevel, subj) },
                                label = { Text(if (isHindi) subj.labelHi else subj.labelEn) }
                            )
                        }
                    }
                }
            }
        }

        // 6. Backup and Restore
        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        if (isHindi) "बैकअप और रिस्टोर" else "Backup and Restore",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                scope.launch {
                                    val json = onExportBackup()
                                    ClipboardHelper.copyText(context, "Study Backup", json)
                                    backupNotice = if (isHindi) "बैकअप कॉपी हो गया।" else "Backup copied to clipboard."
                                }
                            },
                            modifier = Modifier.weight(1f)
                        ) { Text(if (isHindi) "बैकअप लें" else "Export Backup") }
                        OutlinedButton(
                            onClick = { showRestoreDialog = true },
                            modifier = Modifier.weight(1f)
                        ) { Text(if (isHindi) "रिस्टोर करें" else "Restore") }
                    }
                    backupNotice?.let { Text(it, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary) }
                    OutlinedButton(onClick = { showClearDialog = true }, modifier = Modifier.fillMaxWidth()) {
                        Text(if (isHindi) "अध्ययन डेटा साफ़ करें" else "Reset Local Data", color = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }

        // 7. Privacy Policy & 8. Help and Support
        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        if (isHindi) "गोपनीयता और सहायता" else "Privacy & Support",
                        style = MaterialTheme.typography.titleMedium
                    )
                    TextButton(onClick = { showPrivacyDialog = true }) {
                        Text(if (isHindi) "गोपनीयता नीति (Privacy Policy)" else "Privacy Policy")
                    }
                    TextButton(onClick = { showHelpDialog = true }) {
                        Text(if (isHindi) "सहायता और समर्थन (Help & Support)" else "Help and Support")
                    }
                }
            }
        }
    }

    if (showRestoreDialog) {
        AlertDialog(
            onDismissRequest = { showRestoreDialog = false },
            title = { Text("Restore Backup") },
            text = {
                OutlinedTextField(
                    value = restoreJsonInput,
                    onValueChange = { restoreJsonInput = it },
                    label = { Text("Paste saved backup") },
                    minLines = 4
                )
            },
            confirmButton = {
                Button(onClick = {
                    onRestoreBackup(restoreJsonInput)
                    showRestoreDialog = false
                }) { Text("Restore") }
            },
            dismissButton = { TextButton(onClick = { showRestoreDialog = false }) { Text("Cancel") } }
        )
    }

    if (showClearDialog) {
        AlertDialog(
            onDismissRequest = { showClearDialog = false },
            title = { Text("Reset Local Data?") },
            text = { Text("This deletes your saved progress, notes, mock test scores, and preferences from this device.") },
            confirmButton = {
                Button(onClick = {
                    onClearAllData()
                    showClearDialog = false
                }) { Text("Reset") }
            },
            dismissButton = { TextButton(onClick = { showClearDialog = false }) { Text("Cancel") } }
        )
    }

    if (showPrivacyDialog) {
        AlertDialog(
            onDismissRequest = { showPrivacyDialog = false },
            title = { Text("Privacy Policy") },
            text = {
                Text("AI Study Guardian keeps your notes, chapter progress, timetable, and practice scores stored privately on your device. No account or login is required. App Blocker permissions are strictly used to pause distracting apps you select during Focus Mode and never read passwords, chats, or screenshots.")
            },
            confirmButton = { Button(onClick = { showPrivacyDialog = false }) { Text("Close") } }
        )
    }

    if (showHelpDialog) {
        AlertDialog(
            onDismissRequest = { showHelpDialog = false },
            title = { Text("Help and Support") },
            text = {
                Text("1. Use AI Tutor to solve Physics, Chemistry, and Math doubts in Hindi or English across Class 9–12 Boards, NCERT, JEE, NEET, and CUET.\n2. Use Practice to track chapters, formulas, and timed mock tests.\n3. Enable Focus Shield permissions in the Blocker tab to pause distracting apps during study sessions.")
            },
            confirmButton = { Button(onClick = { showHelpDialog = false }) { Text("Got it") } }
        )
    }
}
