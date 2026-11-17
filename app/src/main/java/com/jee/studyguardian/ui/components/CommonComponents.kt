package com.jee.studyguardian.ui.components

import android.app.Activity
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.jee.studyguardian.ads.AdManager
import com.jee.studyguardian.models.ExamTrack
import com.jee.studyguardian.models.LanguageMode

@Composable
fun GuardianCard(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.35f))
    ) {
        Box(modifier = Modifier.padding(16.dp)) {
            content()
        }
    }
}

@Composable
fun SubjectProgressRow(
    label: String,
    completed: Int,
    total: Int,
    accuracyPercent: Float
) {
    val fraction = if (total > 0) completed.toFloat() / total else 0f
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.titleMedium)
            Text(
                "$completed / $total chapters · Accuracy ${accuracyPercent.toInt()}%",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(48.dp)) {
            CircularProgressIndicator(
                progress = { fraction },
                strokeWidth = 5.dp,
                color = MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.25f)
            )
            Text(
                "${(fraction * 100).toInt()}%",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ClassSelectionDialog(
    currentTrack: ExamTrack,
    language: LanguageMode,
    isInitialSetup: Boolean,
    onSelectTrack: (ExamTrack) -> Unit,
    onChangeLanguage: (LanguageMode) -> Unit,
    onDismiss: (() -> Unit)? = null
) {
    val isHindi = language == LanguageMode.HINDI
    var picked by remember(currentTrack) { mutableStateOf(currentTrack) }

    AlertDialog(
        onDismissRequest = { if (!isInitialSetup) onDismiss?.invoke() },
        icon = { Icon(Icons.Default.School, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
        title = {
            Text(
                if (isHindi) "अपनी कक्षा या परीक्षा चुनें" else "Choose Your Class or Exam",
                style = MaterialTheme.typography.titleLarge
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    if (isHindi) "आपके चयन के अनुसार डैशबोर्ड, AI गुरु, पाठ्यक्रम और मॉक टेस्ट अपने आप सेट हो जाएंगे।"
                    else "Your Dashboard, AI Tutor, Syllabus, and Mock Tests will adapt automatically.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    LanguageMode.entries.forEach { lang ->
                        FilterChip(
                            selected = language == lang,
                            onClick = { onChangeLanguage(lang) },
                            label = { Text(lang.displayName) }
                        )
                    }
                }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ExamTrack.entries.forEach { track ->
                        FilterChip(
                            selected = picked == track,
                            onClick = { picked = track },
                            label = { Text(if (isHindi) track.labelHi else track.label) }
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = { onSelectTrack(picked) }) {
                Text(if (isHindi) "जारी रखें" else "Continue")
            }
        },
        dismissButton = {
            if (!isInitialSetup && onDismiss != null) {
                TextButton(onClick = onDismiss) {
                    Text(if (isHindi) "रद्द करें" else "Cancel")
                }
            }
        }
    )
}

@Composable
fun PermissionRationaleDialog(
    title: String,
    explanation: String,
    confirmLabel: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = { Icon(Icons.Default.Security, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
        title = { Text(title) },
        text = { Text(explanation, style = MaterialTheme.typography.bodyMedium) },
        confirmButton = {
            Button(onClick = onConfirm) {
                Text(confirmLabel)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun AdaptiveStudyBannerAd(
    personalizedAdsEnabled: Boolean,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val activity = context as? Activity ?: return
    val widthDp = (LocalConfiguration.current.screenWidthDp - 32).coerceAtLeast(320)

    GuardianCard(modifier = modifier) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Study Support Ad (AdMob · Unity)",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(6.dp))
            key(personalizedAdsEnabled) {
                AndroidView(
                    modifier = Modifier.fillMaxWidth(),
                    factory = {
                        AdManager.createBannerContainerWithFallback(
                            activity = activity,
                            widthDp = widthDp,
                            personalizedAdsEnabled = personalizedAdsEnabled
                        )
                    }
                )
            }
        }
    }
}
