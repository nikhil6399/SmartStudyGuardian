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
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.jee.studyguardian.data.UserPreferencesState
import com.jee.studyguardian.database.ChatMessageEntity
import com.jee.studyguardian.models.LanguageMode
import com.jee.studyguardian.models.StudyLevel
import com.jee.studyguardian.models.Subject
import com.jee.studyguardian.ui.components.GuardianCard
import com.jee.studyguardian.ui.components.MathSolutionCard
import com.jee.studyguardian.utils.ClipboardHelper
import com.jee.studyguardian.viewmodel.TutorUiState

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AiTutorScreen(
    prefs: UserPreferencesState,
    tutorState: TutorUiState,
    chatHistory: List<ChatMessageEntity>,
    onSelectSubject: (Subject) -> Unit,
    onSelectMode: (String) -> Unit,
    onSelectLevel: (StudyLevel) -> Unit,
    onSendQuestion: (String) -> Unit,
    onToggleSaveAnswer: (Long, Boolean) -> Unit,
    onClearHistory: () -> Unit
) {
    val context = LocalContext.current
    val isHindi = prefs.language == LanguageMode.HINDI
    var promptText by remember { mutableStateOf("") }
    var copiedNotice by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    if (isHindi) "AI स्टडी ट्यूटर" else "AI Study Tutor",
                    style = MaterialTheme.typography.titleLarge
                )
                Text(
                    if (isHindi) "भाषा: ${prefs.language.displayName} · सरल चरण-दर-चरण हल"
                    else "Language: ${prefs.language.displayName} · Step-by-Step Solutions",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (chatHistory.isNotEmpty()) {
                IconButton(onClick = onClearHistory) {
                    Icon(Icons.Default.DeleteSweep, contentDescription = "Clear history")
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Subject.entries.forEach { subj ->
                FilterChip(
                    selected = tutorState.selectedSubject == subj,
                    onClick = { onSelectSubject(subj) },
                    label = { Text(if (isHindi) subj.labelHi else subj.labelEn) }
                )
            }
        }

        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StudyLevel.entries.forEach { lvl ->
                FilterChip(
                    selected = tutorState.selectedLevel == lvl,
                    onClick = { onSelectLevel(lvl) },
                    label = { Text(if (isHindi) lvl.labelHi else lvl.labelEn) }
                )
            }
        }

        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(
                "step_by_step" to if (isHindi) "चरण-दर-चरण" else "Step-by-Step",
                "numerical" to if (isHindi) "संख्यात्मक" else "Numerical",
                "concept" to if (isHindi) "कॉन्सेप्ट" else "Concept",
                "doubt" to if (isHindi) "शंका समाधान" else "Doubt"
            ).forEach { (key, label) ->
                FilterChip(
                    selected = tutorState.selectedMode == key,
                    onClick = { onSelectMode(key) },
                    label = { Text(label) }
                )
            }
        }

        tutorState.errorMessage?.let { err ->
            Spacer(modifier = Modifier.height(6.dp))
            GuardianCard {
                Text(err, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
            }
        }

        copiedNotice?.let {
            Text(it, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
        }

        Spacer(modifier = Modifier.height(8.dp))

        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(vertical = 4.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (chatHistory.isEmpty()) {
                item {
                    GuardianCard {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                if (isHindi) "Physics, Chemistry या Maths का कोई भी प्रश्न पूछें"
                                else "Ask any Physics, Chemistry, or Mathematics question",
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                if (isHindi) {
                                    "कक्षा 9–12 बोर्ड, NCERT, JEE Main, JEE Advanced, NEET और CUET के लिए आसान हिंदी या अंग्रेज़ी में हल पाएं।"
                                } else {
                                    "Get clean equations and step-by-step explanations for Class 9–12 Boards, NCERT, JEE Main, JEE Advanced, NEET, and CUET."
                                },
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            items(chatHistory, key = { it.id }) { msg ->
                GuardianCard {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "${if (msg.role == "user") (if (isHindi) "आप" else "You") else "AI Tutor"} · ${msg.subjectTag}",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = if (msg.role == "user") MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.primary
                            )
                            if (msg.role == "assistant") {
                                Row {
                                    IconButton(onClick = {
                                        ClipboardHelper.copyText(context, "Study Solution", msg.content)
                                        copiedNotice = if (isHindi) "उत्तर कॉपी हो गया।" else "Solution copied."
                                    }) {
                                        Icon(Icons.Default.ContentCopy, contentDescription = "Copy")
                                    }
                                    IconButton(onClick = { onToggleSaveAnswer(msg.id, msg.isSavedAnswer) }) {
                                        Icon(
                                            if (msg.isSavedAnswer) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                                            contentDescription = "Save"
                                        )
                                    }
                                }
                            }
                        }

                        if (msg.role == "assistant") {
                            MathSolutionCard(
                                structuredJson = msg.structuredJson,
                                plainFallbackText = msg.content,
                                languageCode = msg.languageCode
                            )
                        } else {
                            Text(msg.content, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            }
        }

        if (tutorState.isLoading) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                CircularProgressIndicator(modifier = Modifier.height(22.dp).width(22.dp), strokeWidth = 2.dp)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    if (isHindi) "हल तैयार किया जा रहा है..." else "Preparing step-by-step solution...",
                    style = MaterialTheme.typography.labelMedium
                )
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = promptText,
                onValueChange = { promptText = it },
                modifier = Modifier.weight(1f),
                placeholder = {
                    Text(if (isHindi) "अपना प्रश्न लिखें..." else "Ask your question or numerical...")
                },
                maxLines = 3
            )
            Button(
                onClick = {
                    val q = promptText
                    promptText = ""
                    onSendQuestion(q)
                },
                enabled = !tutorState.isLoading && promptText.isNotBlank()
            ) {
                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send")
            }
        }
    }
}
