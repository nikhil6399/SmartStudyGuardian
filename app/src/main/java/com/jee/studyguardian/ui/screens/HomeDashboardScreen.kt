package com.jee.studyguardian.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.jee.studyguardian.data.JeeContentCatalog
import com.jee.studyguardian.data.UserPreferencesState
import com.jee.studyguardian.database.ChapterProgressEntity
import com.jee.studyguardian.database.DailyStudyStatEntity
import com.jee.studyguardian.database.StudyAlarmEntity
import com.jee.studyguardian.database.StudyGoalEntity
import com.jee.studyguardian.models.Subject
import com.jee.studyguardian.models.SubjectAnalytics
import com.jee.studyguardian.ui.components.AdaptiveStudyBannerAd
import com.jee.studyguardian.ui.components.GuardianCard
import com.jee.studyguardian.ui.components.SubjectProgressRow
import com.jee.studyguardian.utils.AppStrings
import com.jee.studyguardian.utils.TimeFormatters

@Composable
fun HomeDashboardScreen(
    prefs: UserPreferencesState,
    dailyStats: List<DailyStudyStatEntity>,
    subjectAnalytics: List<SubjectAnalytics>,
    studyGoals: List<StudyGoalEntity>,
    studyAlarms: List<StudyAlarmEntity>,
    chapterProgress: List<ChapterProgressEntity>,
    focusRemainingSeconds: Long,
    onNavigateTab: (String) -> Unit,
    onOpenMockTest: () -> Unit,
    onOpenPlanner: () -> Unit,
    onOpenAnalytics: () -> Unit,
    onOpenClassSelector: () -> Unit,
    onToggleGoal: (StudyGoalEntity) -> Unit,
    onWatchRewardedAd: () -> Unit = {}
) {
    val todayIso = TimeFormatters.todayIso()
    val todayStat = dailyStats.firstOrNull { it.dateIso == todayIso }
    val todayMinutes = (todayStat?.physicsMinutes ?: 0) +
        (todayStat?.chemistryMinutes ?: 0) +
        (todayStat?.mathMinutes ?: 0)
    val dailyFraction = (todayMinutes.toFloat() / prefs.dailyGoalMinutes.coerceAtLeast(1)).coerceIn(0f, 1f)

    val isHindi = prefs.language.code == "hi"
    val activeTrackLabel = if (isHindi) prefs.selectedExamTrack.labelHi else prefs.selectedExamTrack.label
    val completedMap = chapterProgress.associateBy { it.chapterId }
    val trackChapters = JeeContentCatalog.chapters.filter { it.track == prefs.selectedExamTrack }
    val revisionPool = if (trackChapters.size >= 3) {
        trackChapters
    } else {
        trackChapters + JeeContentCatalog.chapters.filter { it.track != prefs.selectedExamTrack }
    }
    val upcomingRevision = revisionPool
        .filter { completedMap[it.id]?.isCompleted != true || (completedMap[it.id]?.revisionCount ?: 0) == 0 }
        .take(3)
    val activeAlarmsCount = studyAlarms.count { it.isEnabled }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Greeting & Daily Progress
        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                activeTrackLabel,
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                AppStrings.greeting(prefs.language),
                                style = MaterialTheme.typography.headlineMedium,
                                color = MaterialTheme.colorScheme.secondary
                            )
                            Text(
                                "Streak: ${prefs.studyStreakDays} day(s) · Target: ${TimeFormatters.formatHoursMinutes(prefs.dailyGoalMinutes)}" +
                                    if (prefs.bonusXpPoints > 0) " · Bonus XP: ${prefs.bonusXpPoints}" else "",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            TextButton(onClick = onOpenClassSelector) {
                                Icon(Icons.Default.School, contentDescription = null)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(if (isHindi) "कक्षा बदलें" else "Change Class")
                            }
                            if (focusRemainingSeconds > 0L) {
                                Text(
                                    "FOCUS ${TimeFormatters.formatCountdownHms(focusRemainingSeconds)}",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Today's Study Progress", style = MaterialTheme.typography.titleMedium)
                        Text(
                            "${TimeFormatters.formatHoursMinutes(todayMinutes)} / ${TimeFormatters.formatHoursMinutes(prefs.dailyGoalMinutes)}",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    LinearProgressIndicator(
                        progress = { dailyFraction },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp),
                        color = MaterialTheme.colorScheme.primary,
                        trackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.25f)
                    )
                }
            }
        }

        // Quick Action Shortcuts (2x2 + Planner/Analytics)
        item {
            Text("Quick Actions", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                QuickActionButton(
                    title = "AI Tutor",
                    icon = Icons.Default.AutoAwesome,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigateTab("ai_tutor") }
                )
                QuickActionButton(
                    title = if (prefs.language.code == "hi") "अभ्यास व टेस्ट" else "Practice & Tests",
                    icon = Icons.Default.MenuBook,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigateTab("jee_practice") }
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                QuickActionButton(
                    title = "App Blocker",
                    icon = Icons.Default.Shield,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigateTab("blocker") }
                )
                QuickActionButton(
                    title = "Study Focus",
                    icon = Icons.Default.Bolt,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigateTab("blocker") }
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                FilledTonalButton(onClick = onOpenMockTest, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Default.Quiz, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Mock Test")
                }
                FilledTonalButton(onClick = onOpenPlanner, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Default.Alarm, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(if (isHindi) "अलार्म ($activeAlarmsCount)" else "Alarms ($activeAlarmsCount)", maxLines = 1)
                }
                FilledTonalButton(onClick = onOpenAnalytics, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Default.Analytics, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Stats", maxLines = 1)
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            FilledTonalButton(onClick = onOpenPlanner, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Default.CalendarMonth, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text(if (isHindi) "स्टडी प्लानर और टाइमटेबल" else "Study Planner & Timetable")
            }
        }

        // Subject Progress (Physics, Chemistry, Mathematics)
        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Subject Mastery", style = MaterialTheme.typography.titleMedium)
                    Subject.entries.forEach { subject ->
                        val stat = subjectAnalytics.firstOrNull { it.subject == subject }
                        SubjectProgressRow(
                            label = if (prefs.language.code == "hi") subject.labelHi else subject.labelEn,
                            completed = stat?.completedChapters ?: 0,
                            total = stat?.totalChapters ?: 1,
                            accuracyPercent = stat?.avgAccuracyPercent ?: 0f
                        )
                    }
                }
            }
        }

        // Daily Study Goals
        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Daily Study Goals", style = MaterialTheme.typography.titleMedium)
                        TextButton(onClick = onOpenPlanner) { Text("Manage") }
                    }
                    if (studyGoals.isEmpty()) {
                        Text(
                            "No goals added yet. Tap Manage to schedule today's JEE targets.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        studyGoals.take(4).forEach { goal ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(checked = goal.isCompleted, onCheckedChange = { onToggleGoal(goal) })
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(goal.title, style = MaterialTheme.typography.bodyMedium)
                                    Text(
                                        "${goal.subject} · ${goal.targetMinutes} min",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Icon(
                                    imageVector = if (goal.isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                                    contentDescription = null,
                                    tint = if (goal.isCompleted) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }

        // Upcoming Revision Queue
        item {
            GuardianCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Upcoming Revision Queue", style = MaterialTheme.typography.titleMedium)
                    upcomingRevision.forEach { ch ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(ch.title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                                Text(
                                    "${ch.subject.labelEn} · ${ch.track.label} · ${ch.weightagePercent}% weightage",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            TextButton(onClick = { onNavigateTab("jee_practice") }) { Text("Revise") }
                        }
                    }
                }
            }
        }

        // Rewarded Video Boost (+25 Bonus XP)
        item {
            GuardianCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            if (isHindi) "अतिरिक्त +25 Study XP प्राप्त करें" else "Earn +25 Bonus Study XP",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            if (isHindi) "रिवॉर्डेड वीडियो देखकर बोनस XP अनलॉक करें"
                            else "Watch a short rewarded ad to unlock bonus XP synced to Firebase.",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    FilledTonalButton(onClick = onWatchRewardedAd) {
                        Icon(Icons.Default.PlayCircle, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("+25 XP")
                    }
                }
            }
        }

        // Adaptive Banner Ad (AdMob with Unity Ads Fallback)
        item {
            AdaptiveStudyBannerAd(personalizedAdsEnabled = prefs.personalizedAdsEnabled)
        }
    }
}

@Composable
private fun QuickActionButton(
    title: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = modifier.height(52.dp)
    ) {
        Icon(icon, contentDescription = null)
        Spacer(modifier = Modifier.width(8.dp))
        Text(title, maxLines = 1)
    }
}
