package com.jee.studyguardian.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.jee.studyguardian.data.UserPreferencesState
import com.jee.studyguardian.database.MockTestResultEntity
import com.jee.studyguardian.firebase.FirebaseAuthUiState
import com.jee.studyguardian.models.ExamTrack
import com.jee.studyguardian.models.LanguageMode
import com.jee.studyguardian.models.StudyLevel
import com.jee.studyguardian.models.Subject
import com.jee.studyguardian.models.ThemeMode
import com.jee.studyguardian.security.BiometricAuthHelper
import com.jee.studyguardian.ui.components.GuardianCard
import com.jee.studyguardian.utils.ClipboardHelper
import kotlinx.coroutines.launch

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SettingsScreen(
    prefs: UserPreferencesState,
    authState: FirebaseAuthUiState = FirebaseAuthUiState(),
    testHistory: List<MockTestResultEntity> = emptyList(),
    onSignInEmail: (String, String) -> Unit = { _, _ -> },
    onRegisterEmail: (String, String, String) -> Unit = { _, _, _ -> },
    onSendPasswordReset: (String) -> Unit = {},
    onSignOut: () -> Unit = {},
    onDeleteAccount: () -> Unit = {},
    onSyncNow: () -> Unit = {},
    onSetBiometricLock: (Boolean) -> Unit = {},
    onTestBiometricLock: () -> Unit = {},
    onSetAdPreferences: (Boolean, Boolean) -> Unit = { _, _ -> },
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
    val biometricSupported = remember(context) { BiometricAuthHelper.canAuthenticate(context) }

    var isRegisterMode by remember { mutableStateOf(false) }
    var displayNameInput by remember { mutableStateOf("") }
    var emailInput by remember { mutableStateOf("") }
    var passwordInput by remember { mutableStateOf("") }
    var authInlineError by remember { mutableStateOf<String?>(null) }

    var restoreJsonInput by remember { mutableStateOf("") }
    var showRestoreDialog by remember { mutableStateOf(false) }
    var showClearDialog by remember { mutableStateOf(false) }
    var showDeleteAccountDialog by remember { mutableStateOf(false) }
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

        // 5. Firebase Cloud Account & Sync
        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        if (isHindi) "Firebase अकाउंट और क्लाउड सिंक" else "Firebase Account & Cloud Sync",
                        style = MaterialTheme.typography.titleMedium
                    )
                    if (authState.isSignedIn) {
                        Text(
                            "${authState.displayName ?: "Student"} (${authState.email ?: authState.uid.orEmpty()})",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            "Connected to smartstudyguadian · Saved Tests: ${testHistory.size}",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        if (testHistory.isNotEmpty()) {
                            Text(
                                if (isHindi) "प्रोफ़ाइल में सहेजे गए हाल के टेस्ट" else "Recent Saved Tests in Profile",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            testHistory.take(5).forEach { test ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            test.title,
                                            style = MaterialTheme.typography.bodySmall,
                                            fontWeight = FontWeight.Medium
                                        )
                                        Text(
                                            "${test.subjectName} · ${test.track}",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Text(
                                        "${test.score}/${test.maxScore} (${test.accuracyPercent.toInt()}%)",
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = onSyncNow,
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.CloudUpload, contentDescription = null)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(if (isHindi) "सिंक करें" else "Sync Now")
                            }
                            OutlinedButton(
                                onClick = onSignOut,
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(if (isHindi) "साइन आउट" else "Sign Out")
                            }
                        }
                        TextButton(
                            onClick = { showDeleteAccountDialog = true },
                            modifier = Modifier.align(Alignment.End)
                        ) {
                            Text(
                                text = if (isHindi) "खाता और क्लाउड डेटा हमेशा के लिए हटाएं" else "Delete Account & Cloud Data",
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                    } else {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            FilterChip(
                                selected = !isRegisterMode,
                                onClick = { isRegisterMode = false; authInlineError = null },
                                label = { Text("Sign In") }
                            )
                            FilterChip(
                                selected = isRegisterMode,
                                onClick = { isRegisterMode = true; authInlineError = null },
                                label = { Text("Create Account") }
                            )
                        }
                        if (isRegisterMode) {
                            OutlinedTextField(
                                value = displayNameInput,
                                onValueChange = { displayNameInput = it },
                                label = { Text("Student Name") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                        OutlinedTextField(
                            value = emailInput,
                            onValueChange = { emailInput = it },
                            label = { Text("Email") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = passwordInput,
                            onValueChange = { passwordInput = it },
                            label = { Text("Password (6+ chars)") },
                            visualTransformation = PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        authInlineError?.let {
                            Text(it, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.error)
                        }
                        Button(
                            onClick = {
                                val email = emailInput.trim()
                                if (email.isBlank() || !email.contains("@")) {
                                    authInlineError = "Enter a valid email address."
                                } else if (passwordInput.length < 6) {
                                    authInlineError = "Password must be at least 6 characters."
                                } else {
                                    authInlineError = null
                                    if (isRegisterMode) {
                                        onRegisterEmail(displayNameInput.trim(), email, passwordInput)
                                    } else {
                                        onSignInEmail(email, passwordInput)
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(if (isRegisterMode) "Create Firebase Account" else "Sign In with Firebase")
                        }
                        if (!isRegisterMode) {
                            TextButton(
                                onClick = {
                                    val email = emailInput.trim()
                                    if (email.isBlank() || !email.contains("@")) {
                                        authInlineError = "Enter your email above to send a reset link."
                                    } else {
                                        authInlineError = null
                                        onSendPasswordReset(email)
                                    }
                                },
                                modifier = Modifier.align(Alignment.CenterHorizontally)
                            ) {
                                Text("Forgot Password?")
                            }
                        }
                    }
                }
            }
        }

        // 6. Fingerprint & App Lock
        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        if (isHindi) "फिंगरप्रिंट और ऐप लॉक" else "Fingerprint & App Lock",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(if (isHindi) "फिंगरप्रिंट / स्क्रीन लॉक" else "Fingerprint / Screen Lock")
                            Text(
                                if (biometricSupported) "Protect study progress on launch"
                                else "Set a device PIN or fingerprint in Android Settings",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Switch(
                            checked = prefs.biometricLockEnabled,
                            onCheckedChange = onSetBiometricLock
                        )
                    }
                    FilledTonalButton(
                        onClick = onTestBiometricLock,
                        enabled = biometricSupported,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Fingerprint, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(if (isHindi) "फिंगरप्रिंट टेस्ट करें" else "Test Fingerprint Unlock")
                    }
                }
            }
        }

        // 7. Ad Preferences (AdMob + Unity Ads)
        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        if (isHindi) "विज्ञापन प्राथमिकताएं" else "Ad & Privacy Controls",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("Personalized Study Ads")
                        Switch(
                            checked = prefs.personalizedAdsEnabled,
                            onCheckedChange = { onSetAdPreferences(it, prefs.ageAppropriateAdsOnly) }
                        )
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("Student-Safe Ads Only")
                        Switch(
                            checked = prefs.ageAppropriateAdsOnly,
                            onCheckedChange = { onSetAdPreferences(prefs.personalizedAdsEnabled, it) }
                        )
                    }
                }
            }
        }

        // 8. AI Tutor Preferences
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

    if (showDeleteAccountDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteAccountDialog = false },
            title = { Text(if (isHindi) "खाता हमेशा के लिए हटाएं?" else "Delete Account Permanently?") },
            text = {
                Text(
                    if (isHindi) "यह आपका Firebase छात्र खाता, सहेजे गए मॉक टेस्ट और इस डिवाइस का सभी डेटा हमेशा के लिए हटा देगा।"
                    else "This permanently deletes your Firebase student account, synced mock tests, cloud study state, and local device data. This action cannot be undone."
                )
            },
            confirmButton = {
                Button(onClick = {
                    showDeleteAccountDialog = false
                    onDeleteAccount()
                }) {
                    Text(if (isHindi) "हाँ, हटाएं" else "Delete Account")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteAccountDialog = false }) {
                    Text(if (isHindi) "रद्द करें" else "Cancel")
                }
            }
        )
    }

    if (showPrivacyDialog) {
        AlertDialog(
            onDismissRequest = { showPrivacyDialog = false },
            title = { Text("Privacy Policy") },
            text = {
                Text("Smart Study Guardian saves your chapter progress, streaks, and completed mock test records directly to your signed-in Firebase student profile while caching notes on your device. Focus Shield uses Android Usage Access only on-device to show screen time and remind you when selected distracting apps open during Focus Mode. Passwords, private messages, and screen contents are never read or uploaded. You can delete your account and cloud data anytime in Settings.")
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
