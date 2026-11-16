package com.jee.studyguardian.ui.screens

import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.jee.studyguardian.database.DailyStudyStatEntity
import com.jee.studyguardian.database.FocusSessionEntity
import com.jee.studyguardian.database.MockTestResultEntity
import com.jee.studyguardian.database.StudyAlarmEntity
import com.jee.studyguardian.database.StudyGoalEntity
import com.jee.studyguardian.database.TimetableSlotEntity
import com.jee.studyguardian.models.ChapterStrength
import com.jee.studyguardian.models.Subject
import com.jee.studyguardian.models.SubjectAnalytics
import com.jee.studyguardian.planner.PomodoroUiState
import com.jee.studyguardian.ui.components.GuardianCard
import com.jee.studyguardian.utils.TimeFormatters
import java.util.Locale

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun StudyPlannerScreen(
    goals: List<StudyGoalEntity>,
    timetable: List<TimetableSlotEntity>,
    alarms: List<StudyAlarmEntity>,
    pomodoroState: PomodoroUiState,
    onAddGoal: (String, Subject, Int) -> Unit,
    onToggleGoal: (StudyGoalEntity) -> Unit,
    onDeleteGoal: (Long) -> Unit,
    onAddSlot: (Int, String, String, Subject, String, Boolean) -> Unit,
    onDeleteSlot: (Long) -> Unit,
    onAddAlarm: (Int, Int, String, String, Subject) -> Unit,
    onToggleAlarm: (StudyAlarmEntity) -> Unit,
    onDeleteAlarm: (Long) -> Unit,
    onStartPomodoro: () -> Unit,
    onPausePomodoro: () -> Unit,
    onResetPomodoro: () -> Unit
) {
    var goalTitle by remember { mutableStateOf("") }
    var goalSubject by remember { mutableStateOf(Subject.PHYSICS) }
    var selectedDay by remember { mutableIntStateOf(1) }
    var slotChapter by remember { mutableStateOf("") }
    var slotTime by remember { mutableStateOf("07:00-09:00") }
    var alarmHour by remember { mutableIntStateOf(6) }
    var alarmMinute by remember { mutableIntStateOf(30) }
    var alarmLabel by remember { mutableStateOf("") }
    var alarmSubject by remember { mutableStateOf(Subject.PHYSICS) }

    val dayLabels = listOf(1 to "Mon", 2 to "Tue", 3 to "Wed", 4 to "Thu", 5 to "Fri", 6 to "Sat", 7 to "Sun")

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Pomodoro Study Timer", style = MaterialTheme.typography.titleMedium)
                    Text(
                        "${pomodoroState.phase.name} · ${TimeFormatters.formatCountdownMmSs(pomodoroState.remainingSeconds)}",
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = { if (pomodoroState.isRunning) onPausePomodoro() else onStartPomodoro() }) {
                            Text(if (pomodoroState.isRunning) "Pause" else "Start")
                        }
                        OutlinedButton(onClick = onResetPomodoro) { Text("Reset") }
                    }
                }
            }
        }

        // Study Alarms Card
        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.Alarm, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Text("Study Alarms", style = MaterialTheme.typography.titleMedium)
                    }
                    val period = if (alarmHour >= 12) "PM" else "AM"
                    val h12 = if (alarmHour % 12 == 0) 12 else alarmHour % 12
                    Text(
                        String.format(Locale.US, "%02d:%02d %s", h12, alarmMinute, period),
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(onClick = { alarmHour = (alarmHour + 1) % 24 }, modifier = Modifier.weight(1f)) {
                            Text("+1 Hour")
                        }
                        OutlinedButton(onClick = { alarmMinute = (alarmMinute + 15) % 60 }, modifier = Modifier.weight(1f)) {
                            Text("+15 Min")
                        }
                        OutlinedButton(onClick = { alarmMinute = (alarmMinute + 5) % 60 }, modifier = Modifier.weight(1f)) {
                            Text("+5 Min")
                        }
                    }
                    OutlinedTextField(
                        value = alarmLabel,
                        onValueChange = { alarmLabel = it },
                        label = { Text("Alarm label (e.g. Morning Revision)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Subject.entries.forEach { subj ->
                            FilterChip(
                                selected = alarmSubject == subj,
                                onClick = { alarmSubject = subj },
                                label = { Text(subj.labelEn) }
                            )
                        }
                    }
                    Button(
                        onClick = {
                            onAddAlarm(alarmHour, alarmMinute, alarmLabel.ifBlank { "Study & Revision Alarm" }, "", alarmSubject)
                            alarmLabel = ""
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Save Study Alarm")
                    }
                }
            }
        }

        items(alarms, key = { "alm_${it.id}" }) { alarm ->
            val p = if (alarm.hour >= 12) "PM" else "AM"
            val h = if (alarm.hour % 12 == 0) 12 else alarm.hour % 12
            GuardianCard {
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            String.format(Locale.US, "%02d:%02d %s", h, alarm.minute, p),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text("${alarm.label} · ${alarm.subject}", style = MaterialTheme.typography.labelMedium)
                    }
                    Switch(checked = alarm.isEnabled, onCheckedChange = { onToggleAlarm(alarm) })
                    IconButton(onClick = { onDeleteAlarm(alarm.id) }) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete alarm")
                    }
                }
            }
        }

        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Add Study Goal", style = MaterialTheme.typography.titleMedium)
                    OutlinedTextField(
                        value = goalTitle,
                        onValueChange = { goalTitle = it },
                        label = { Text("Goal (e.g. Solve 40 Rotational MCQs)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Subject.entries.forEach { subj ->
                            FilterChip(
                                selected = goalSubject == subj,
                                onClick = { goalSubject = subj },
                                label = { Text(subj.labelEn) }
                            )
                        }
                    }
                    Button(
                        onClick = {
                            onAddGoal(goalTitle, goalSubject, 60)
                            goalTitle = ""
                        },
                        enabled = goalTitle.isNotBlank()
                    ) { Text("Add Goal") }
                }
            }
        }

        items(goals, key = { it.id }) { goal ->
            GuardianCard {
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = goal.isCompleted, onCheckedChange = { onToggleGoal(goal) })
                    Column(modifier = Modifier.weight(1f)) {
                        Text(goal.title, fontWeight = FontWeight.Medium)
                        Text("${goal.subject} · ${goal.targetMinutes} min", style = MaterialTheme.typography.labelMedium)
                    }
                    IconButton(onClick = { onDeleteGoal(goal.id) }) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete goal")
                    }
                }
            }
        }

        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Weekly Timetable", style = MaterialTheme.typography.titleMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        dayLabels.forEach { (dayNum, label) ->
                            FilterChip(
                                selected = selectedDay == dayNum,
                                onClick = { selectedDay = dayNum },
                                label = { Text(label) }
                            )
                        }
                    }
                    OutlinedTextField(
                        value = slotChapter,
                        onValueChange = { slotChapter = it },
                        label = { Text("Topic / Chapter") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = slotTime,
                        onValueChange = { slotTime = it },
                        label = { Text("Time Range (e.g. 07:00-09:00)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Button(
                        onClick = {
                            val parts = slotTime.split("-")
                            onAddSlot(
                                selectedDay,
                                parts.getOrElse(0) { "07:00" }.trim(),
                                parts.getOrElse(1) { "09:00" }.trim(),
                                goalSubject,
                                slotChapter,
                                false
                            )
                            slotChapter = ""
                        },
                        enabled = slotChapter.isNotBlank()
                    ) { Text("Add Timetable Slot") }
                }
            }
        }

        items(timetable.filter { it.dayOfWeek == selectedDay }, key = { it.id }) { slot ->
            GuardianCard {
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("${slot.startTimeLabel} - ${slot.endTimeLabel} · ${slot.subject}", style = MaterialTheme.typography.labelMedium)
                        Text(slot.chapterTitle, fontWeight = FontWeight.SemiBold)
                    }
                    IconButton(onClick = { onDeleteSlot(slot.id) }) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete slot")
                    }
                }
            }
        }
    }
}

@Composable
fun AnalyticsScreen(
    dailyStats: List<DailyStudyStatEntity>,
    subjectAnalytics: List<SubjectAnalytics>,
    chapterStrengths: Pair<List<ChapterStrength>, List<ChapterStrength>>,
    testHistory: List<MockTestResultEntity>,
    focusSessions: List<FocusSessionEntity>,
    goals: List<StudyGoalEntity>
) {
    val last7 = dailyStats.take(7).reversed()
    val completedGoals = goals.count { it.isCompleted }
    val barColor = MaterialTheme.colorScheme.primary

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Performance Analytics", style = MaterialTheme.typography.titleLarge)
        }

        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Weekly Study Time (Minutes)", style = MaterialTheme.typography.titleMedium)
                    if (last7.isEmpty()) {
                        Text("Complete a study session or Pomodoro cycle to populate your weekly graph.", style = MaterialTheme.typography.bodyMedium)
                    } else {
                        val maxVal = last7.maxOf { it.physicsMinutes + it.chemistryMinutes + it.mathMinutes }.coerceAtLeast(30)
                        Canvas(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(130.dp)
                        ) {
                            val barWidth = size.width / (last7.size * 2f)
                            last7.forEachIndexed { idx, stat ->
                                val total = stat.physicsMinutes + stat.chemistryMinutes + stat.mathMinutes
                                val h = (total.toFloat() / maxVal) * (size.height - 16f)
                                val x = idx * (barWidth * 2f) + barWidth * 0.5f
                                drawRect(
                                    color = barColor,
                                    topLeft = Offset(x, size.height - h),
                                    size = Size(barWidth, h)
                                )
                            }
                        }
                    }
                }
            }
        }

        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Focus & Goal Summary", style = MaterialTheme.typography.titleMedium)
                    Text("Focus Sessions Logged: ${focusSessions.size}")
                    Text("Goals Completed: $completedGoals / ${goals.size}")
                    Text("Mock Tests Taken: ${testHistory.size}")
                    if (testHistory.isNotEmpty()) {
                        val avgAcc = testHistory.map { it.accuracyPercent }.average().toInt()
                        Text("Average Mock Accuracy: $avgAcc%", color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }

        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Subject-Wise Weekly Hours & Accuracy", style = MaterialTheme.typography.titleMedium)
                    subjectAnalytics.forEach { stat ->
                        Text(
                            "${stat.subject.labelEn}: ${TimeFormatters.formatHoursMinutes(stat.studyMinutesThisWeek)} · ${stat.completedChapters}/${stat.totalChapters} chapters · ${stat.avgAccuracyPercent.toInt()}% accuracy"
                        )
                    }
                }
            }
        }

        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Weak Chapters Detected (Priority Revision)", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.error)
                    chapterStrengths.first.forEach { ch ->
                        Text("• ${ch.chapterTitle} (${ch.subject.labelEn}) — ${ch.statusLabel}")
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Strong Chapters", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.tertiary)
                    if (chapterStrengths.second.isEmpty()) {
                        Text("Complete chapters and practice quizzes to build strong chapter mastery.")
                    } else {
                        chapterStrengths.second.forEach { ch ->
                            Text("• ${ch.chapterTitle} (${ch.subject.labelEn}) — ${ch.scoreMetric.toInt()}%")
                        }
                    }
                }
            }
        }
    }
}
