package com.jee.studyguardian.ui.screens

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.jee.studyguardian.data.JeeContentCatalog
import com.jee.studyguardian.data.UserPreferencesState
import com.jee.studyguardian.database.ChapterProgressEntity
import com.jee.studyguardian.database.MockTestResultEntity
import com.jee.studyguardian.database.SavedQuestionEntity
import com.jee.studyguardian.database.StudyNoteEntity
import com.jee.studyguardian.models.ExamTrack
import com.jee.studyguardian.models.LanguageMode
import com.jee.studyguardian.models.MockTestConfig
import com.jee.studyguardian.models.PracticeQuestion
import com.jee.studyguardian.models.Subject
import com.jee.studyguardian.ui.components.AdaptiveStudyBannerAd
import com.jee.studyguardian.ui.components.GuardianCard
import com.jee.studyguardian.utils.TimeFormatters
import com.jee.studyguardian.viewmodel.ActiveMockTestState

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun JeePracticeScreen(
    prefs: UserPreferencesState,
    chapterProgress: List<ChapterProgressEntity>,
    savedQuestions: List<SavedQuestionEntity>,
    studyNotes: List<StudyNoteEntity>,
    testHistory: List<MockTestResultEntity>,
    onToggleChapterComplete: (String) -> Unit,
    onRecordRevision: (String) -> Unit,
    onRecordPracticeAttempt: (PracticeQuestion, Boolean) -> Unit,
    onToggleSaveQuestion: (PracticeQuestion, Boolean) -> Unit,
    onAddNote: (String, Subject, String, String) -> Unit,
    onStartMockTest: (MockTestConfig) -> Unit
) {
    val isHindi = prefs.language == LanguageMode.HINDI
    var searchQuery by remember { mutableStateOf("") }
    var selectedSubject by remember { mutableStateOf<Subject?>(null) }
    var selectedTrack by remember { mutableStateOf<ExamTrack?>(prefs.selectedExamTrack) }
    var expandedChapterId by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(prefs.selectedExamTrack) {
        selectedTrack = prefs.selectedExamTrack
    }
    var noteTargetChapter by remember { mutableStateOf<String?>(null) }
    var noteTitle by remember { mutableStateOf("") }
    var noteContent by remember { mutableStateOf("") }

    val selectedPracticeOptions = remember { mutableStateMapOf<String, Int>() }
    val checkedPracticeIds = remember { mutableStateMapOf<String, Boolean>() }

    val progressMap = chapterProgress.associateBy { it.chapterId }
    val savedIdSet = savedQuestions.map { it.questionId }.toSet()

    val filteredChapters = JeeContentCatalog.chapters.filter { ch ->
        val subjectMatch = selectedSubject == null || ch.subject == selectedSubject
        val trackMatch = selectedTrack == null || ch.track == selectedTrack
        val queryMatch = searchQuery.isBlank() ||
            ch.title.contains(searchQuery, ignoreCase = true) ||
            ch.revisionNotes.contains(searchQuery, ignoreCase = true) ||
            ch.topics.any { it.contains(searchQuery, ignoreCase = true) } ||
            ch.formulas.any { it.title.contains(searchQuery, ignoreCase = true) }
        subjectMatch && trackMatch && queryMatch
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                if (isHindi) "बोर्ड व परीक्षा पाठ्यक्रम, नोट्स और मॉक टेस्ट"
                else "Board & Exam Syllabus, Notes & Mock Tests",
                style = MaterialTheme.typography.titleLarge
            )
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                placeholder = { Text(if (isHindi) "अध्याय, सूत्र या विषय खोजें..." else "Search chapters, formulas, topics...") },
                singleLine = true
            )
        }

        item {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = selectedSubject == null,
                    onClick = { selectedSubject = null },
                    label = { Text(if (isHindi) "सभी विषय" else "All Subjects") }
                )
                Subject.entries.forEach { subj ->
                    FilterChip(
                        selected = selectedSubject == subj,
                        onClick = { selectedSubject = if (selectedSubject == subj) null else subj },
                        label = { Text(if (isHindi) subj.labelHi else subj.labelEn) }
                    )
                }
            }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = selectedTrack == null,
                    onClick = { selectedTrack = null },
                    label = { Text(if (isHindi) "सभी परीक्षाएं" else "All Boards & Exams") }
                )
                ExamTrack.entries.forEach { tr ->
                    FilterChip(
                        selected = selectedTrack == tr,
                        onClick = { selectedTrack = if (selectedTrack == tr) null else tr },
                        label = { Text(tr.label) }
                    )
                }
            }
        }

        // Mock Test Launcher Card
        item {
            val activeLaunchTrack = selectedTrack ?: prefs.selectedExamTrack
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(if (isHindi) "मॉक टेस्ट केंद्र" else "Mock Test Practice", style = MaterialTheme.typography.titleMedium)
                    Text(
                        if (isHindi) "टाइमर, रिव्यू मार्क और स्वचालित स्कोर के साथ शांत वातावरण में अभ्यास करें।"
                        else "Timed practice tests with question palette, review flags, and instant score breakdown.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                onStartMockTest(
                                    MockTestConfig(
                                        title = "${activeLaunchTrack.label} Mock Test",
                                        track = activeLaunchTrack,
                                        subjectFilter = selectedSubject,
                                        durationMinutes = 20,
                                        negativeMarkingEnabled = prefs.negativeMarkingEnabled
                                    )
                                )
                            },
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Quiz, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("${activeLaunchTrack.label} Test", maxLines = 1)
                        }
                        OutlinedButton(
                            onClick = {
                                onStartMockTest(
                                    MockTestConfig(
                                        title = "Class 12 Board Mock Test",
                                        track = ExamTrack.CLASS_12_BOARD,
                                        subjectFilter = selectedSubject,
                                        durationMinutes = 20,
                                        negativeMarkingEnabled = false
                                    )
                                )
                            },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Board Mock", maxLines = 1)
                        }
                    }
                    if (testHistory.isNotEmpty()) {
                        val last = testHistory.first()
                        Text(
                            "Last Test: ${last.title} · Score ${last.score}/${last.maxScore} · Accuracy ${last.accuracyPercent.toInt()}%",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }

        // Expandable Chapter Cards
        items(filteredChapters, key = { it.id }) { chapter ->
            val progress = progressMap[chapter.id]
            val isExpanded = expandedChapterId == chapter.id
            val chapterQuestions = JeeContentCatalog.questions.filter { it.chapterId == chapter.id }
            val chapterNotes = studyNotes.filter { it.chapterId == chapter.id }

            GuardianCard {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = progress?.isCompleted == true,
                            onCheckedChange = { onToggleChapterComplete(chapter.id) }
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(chapter.title, style = MaterialTheme.typography.titleMedium)
                            Text(
                                "${chapter.subject.labelEn} · ${chapter.track.label} · Revisions: ${progress?.revisionCount ?: 0}",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        IconButton(onClick = {
                            expandedChapterId = if (isExpanded) null else chapter.id
                        }) {
                            Icon(
                                if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                contentDescription = "Expand chapter"
                            )
                        }
                    }

                    AnimatedVisibility(visible = isExpanded) {
                        Column(
                            modifier = Modifier.padding(top = 10.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text("Topics: ${chapter.topics.joinToString(" · ")}", style = MaterialTheme.typography.bodyMedium)
                            Text("Revision Notes", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.labelMedium)
                            Text(chapter.revisionNotes, style = MaterialTheme.typography.bodyMedium)

                            Text("Formula Library", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.labelMedium)
                            chapter.formulas.forEach { formula ->
                                Text("• ${formula.title}: ${formula.expression} (${formula.variablesNote})", style = MaterialTheme.typography.bodyMedium)
                            }

                            if (chapterNotes.isNotEmpty()) {
                                Text("Your Saved Notes", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.labelMedium)
                                chapterNotes.forEach { note ->
                                    Text("• ${note.title}: ${note.content}", style = MaterialTheme.typography.bodyMedium)
                                }
                            }

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedButton(onClick = { onRecordRevision(chapter.id) }) {
                                    Text("Log Revision")
                                }
                                OutlinedButton(onClick = { noteTargetChapter = chapter.id }) {
                                    Text("Add Note")
                                }
                                OutlinedButton(onClick = {
                                    onStartMockTest(
                                        MockTestConfig(
                                            title = "${chapter.title} Chapter Test",
                                            track = chapter.track,
                                            chapterIdFilter = chapter.id,
                                            durationMinutes = 10,
                                            negativeMarkingEnabled = prefs.negativeMarkingEnabled
                                        )
                                    )
                                }) {
                                    Text("Chapter Quiz")
                                }
                            }

                            chapterQuestions.forEach { q ->
                                val picked = selectedPracticeOptions[q.id]
                                val checked = checkedPracticeIds[q.id] == true
                                val isSaved = q.id in savedIdSet
                                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            "${q.origin.label} · ${q.difficulty}",
                                            style = MaterialTheme.typography.labelMedium,
                                            color = MaterialTheme.colorScheme.secondary
                                        )
                                        IconButton(onClick = { onToggleSaveQuestion(q, isSaved) }) {
                                            Icon(
                                                if (isSaved) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                                                contentDescription = "Save question"
                                            )
                                        }
                                    }
                                    Text(q.prompt, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                                    q.options.forEachIndexed { idx, opt ->
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            RadioButton(
                                                selected = picked == idx,
                                                onClick = { selectedPracticeOptions[q.id] = idx }
                                            )
                                            Text(opt, style = MaterialTheme.typography.bodyMedium)
                                        }
                                    }
                                    Button(
                                        onClick = {
                                            if (picked != null) {
                                                checkedPracticeIds[q.id] = true
                                                onRecordPracticeAttempt(q, picked == q.correctOptionIndex)
                                            }
                                        },
                                        enabled = picked != null
                                    ) {
                                        Text("Check Answer")
                                    }
                                    if (checked) {
                                        val isCorrect = picked == q.correctOptionIndex
                                        Text(
                                            if (isCorrect) "Correct! ${q.explanation}" else "Incorrect. ${q.explanation}",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = if (isCorrect) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.error
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        item {
            AdaptiveStudyBannerAd(personalizedAdsEnabled = prefs.personalizedAdsEnabled)
        }
    }

    noteTargetChapter?.let { chId ->
        val chapterObj = JeeContentCatalog.chapters.first { it.id == chId }
        AlertDialog(
            onDismissRequest = { noteTargetChapter = null },
            title = { Text("Add Note · ${chapterObj.title}") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = noteTitle,
                        onValueChange = { noteTitle = it },
                        label = { Text("Note Title") },
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = noteContent,
                        onValueChange = { noteContent = it },
                        label = { Text("Key Concept or Trick") },
                        minLines = 3
                    )
                }
            },
            confirmButton = {
                Button(onClick = {
                    onAddNote(chId, chapterObj.subject, noteTitle, noteContent)
                    noteTitle = ""
                    noteContent = ""
                    noteTargetChapter = null
                }) { Text("Save") }
            },
            dismissButton = {
                TextButton(onClick = { noteTargetChapter = null }) { Text("Cancel") }
            }
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun MockTestScreen(
    state: ActiveMockTestState,
    onSelectOption: (String, Int) -> Unit,
    onToggleReview: (String) -> Unit,
    onJumpQuestion: (Int) -> Unit,
    onSubmit: () -> Unit,
    onClose: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (state.isSubmitted && state.lastResult != null) {
            val res = state.lastResult
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Mock Test Result · ${res.title}", style = MaterialTheme.typography.titleLarge)
                    Text(
                        "Score: ${res.score} / ${res.maxScore} · Accuracy: ${res.accuracyPercent.toInt()}%",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text("Correct: ${res.correct} · Incorrect: ${res.incorrect} · Attempted: ${res.attempted}/${res.totalQuestions}")
                    Button(onClick = onClose, modifier = Modifier.fillMaxWidth()) { Text("Done") }
                }
            }

            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(state.questions) { q ->
                    val picked = state.selectedAnswers[q.id]
                    GuardianCard {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text("${q.subject.labelEn} · ${q.origin.label}", style = MaterialTheme.typography.labelMedium)
                            Text(q.prompt, fontWeight = FontWeight.SemiBold)
                            Text("Correct Option: ${q.options[q.correctOptionIndex]}", color = MaterialTheme.colorScheme.tertiary)
                            if (picked != null && picked != q.correctOptionIndex) {
                                Text("Your Answer: ${q.options[picked]}", color = MaterialTheme.colorScheme.error)
                            }
                            Text(q.explanation, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            }
            return
        }

        val currentQuestion = state.questions.getOrNull(state.currentIndex) ?: return

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(state.config.title, style = MaterialTheme.typography.titleMedium)
            Text(
                TimeFormatters.formatCountdownMmSs(state.remainingSeconds),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.secondary
            )
        }

        // Question Palette Navigation
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            state.questions.forEachIndexed { idx, q ->
                val isMarked = q.id in state.markedForReview
                val isAnswered = q.id in state.selectedAnswers
                FilterChip(
                    selected = idx == state.currentIndex,
                    onClick = { onJumpQuestion(idx) },
                    label = {
                        Text(
                            when {
                                isMarked -> "${idx + 1}*"
                                isAnswered -> "${idx + 1}✓"
                                else -> "${idx + 1}"
                            }
                        )
                    }
                )
            }
        }

        GuardianCard(modifier = Modifier.weight(1f)) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    "Q${state.currentIndex + 1} · ${currentQuestion.subject.labelEn} · ${currentQuestion.origin.label}",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.secondary
                )
                Text(currentQuestion.prompt, style = MaterialTheme.typography.titleMedium)
                currentQuestion.options.forEachIndexed { idx, opt ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(
                            selected = state.selectedAnswers[currentQuestion.id] == idx,
                            onClick = { onSelectOption(currentQuestion.id, idx) }
                        )
                        Text(opt, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(onClick = { onToggleReview(currentQuestion.id) }) {
                Text(if (currentQuestion.id in state.markedForReview) "Unmark Review" else "Mark Review")
            }
            OutlinedButton(
                onClick = { onJumpQuestion((state.currentIndex + 1).coerceAtMost(state.questions.lastIndex)) },
                modifier = Modifier.weight(1f)
            ) {
                Text("Next")
            }
            Button(onClick = onSubmit) {
                Text("Submit")
            }
        }
    }
}
