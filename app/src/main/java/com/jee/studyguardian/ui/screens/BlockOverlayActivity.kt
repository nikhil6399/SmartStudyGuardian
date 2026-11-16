package com.jee.studyguardian.ui.screens

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.jee.studyguardian.application.JeeStudyGuardianApp
import com.jee.studyguardian.ui.components.GuardianCard
import com.jee.studyguardian.ui.theme.JeeStudyGuardianTheme
import com.jee.studyguardian.utils.TimeFormatters
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class BlockOverlayActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val blockedAppName = intent.getStringExtra(EXTRA_APP_NAME) ?: "Distracting App"
        val reason = intent.getStringExtra(EXTRA_REASON) ?: "Study Time — Don't Break It!"
        val initialRemainingMs = intent.getLongExtra(EXTRA_REMAINING_MS, 0L)

        setContent {
            JeeStudyGuardianTheme(darkTheme = true) {
                var remainingSeconds by remember { mutableLongStateOf(initialRemainingMs / 1000L) }

                LaunchedEffect(Unit) {
                    while (remainingSeconds > 0L) {
                        delay(1000L)
                        remainingSeconds--
                    }
                }

                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "Study Time — Don't Break It!",
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.secondary,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        GuardianCard {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    "$blockedAppName is Blocked!",
                                    style = MaterialTheme.typography.titleLarge,
                                    color = MaterialTheme.colorScheme.error,
                                    textAlign = TextAlign.Center
                                )
                                Text(
                                    reason,
                                    style = MaterialTheme.typography.bodyMedium,
                                    textAlign = TextAlign.Center
                                )
                                if (remainingSeconds > 0L) {
                                    Text(
                                        "Block Time Remaining: ${TimeFormatters.formatCountdownHms(remainingSeconds)}",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.secondary
                                    )
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(20.dp))
                        Button(
                            onClick = { finish() },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Keep Studying — Return to Focus")
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        OutlinedButton(
                            onClick = {
                                val app = application as? JeeStudyGuardianApp
                                app?.let {
                                    kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                                        it.container.preferencesManager.setBlockerFocusState(
                                            enabled = false,
                                            endEpochMs = 0L,
                                            pausedRemainingMs = 0L,
                                            durationMinutes = 120
                                        )
                                    }
                                }
                                finish()
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Emergency Unlock (Only if Really Needed)")
                        }
                    }
                }
            }
        }
    }

    companion object {
        const val EXTRA_APP_NAME = "extra_app_name"
        const val EXTRA_REASON = "extra_reason"
        const val EXTRA_REMAINING_MS = "extra_remaining_ms"
    }
}
