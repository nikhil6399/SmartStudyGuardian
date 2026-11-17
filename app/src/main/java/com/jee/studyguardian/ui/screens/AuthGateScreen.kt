package com.jee.studyguardian.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.jee.studyguardian.models.LanguageMode
import com.jee.studyguardian.ui.components.GuardianCard

@Composable
fun AuthGateScreen(
    language: LanguageMode,
    isLoading: Boolean,
    authError: String?,
    authSuccessMessage: String? = null,
    onClearError: () -> Unit,
    onChangeLanguage: (LanguageMode) -> Unit,
    onSignInGoogle: () -> Unit,
    onSignInEmail: (String, String) -> Unit,
    onRegisterEmail: (String, String, String) -> Unit,
    onSendPasswordReset: (String) -> Unit
) {
    val isHindi = language == LanguageMode.HINDI
    var isRegisterMode by remember { mutableStateOf(false) }
    var displayName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var inlineMessage by remember { mutableStateOf<String?>(null) }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            contentAlignment = Alignment.Center
        ) {
            GuardianCard(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.School,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(32.dp)
                            )
                            Column {
                                Text(
                                    text = "AI Study Guardian",
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = if (isHindi) "शुरू करने के लिए साइन इन करें" else "Sign in to start studying",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            LanguageMode.entries.forEach { lang ->
                                FilterChip(
                                    selected = language == lang,
                                    onClick = { onChangeLanguage(lang) },
                                    label = { Text(if (lang == LanguageMode.HINDI) "हिन्दी" else "EN") }
                                )
                            }
                        }
                    }

                    // Google Sign-In Option
                    OutlinedButton(
                        onClick = onSignInGoogle,
                        enabled = !isLoading,
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Text(
                                text = "G ",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.ExtraBold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (isHindi) "Google से साइन इन करें" else "Continue with Google",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        HorizontalDivider(modifier = Modifier.weight(1f))
                        Text(
                            text = if (isHindi) "  या ईमेल से  " else "  OR WITH EMAIL  ",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        HorizontalDivider(modifier = Modifier.weight(1f))
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = !isRegisterMode,
                            onClick = {
                                isRegisterMode = false
                                inlineMessage = null
                                onClearError()
                            },
                            label = { Text(if (isHindi) "साइन इन" else "Sign In") }
                        )
                        FilterChip(
                            selected = isRegisterMode,
                            onClick = {
                                isRegisterMode = true
                                inlineMessage = null
                                onClearError()
                            },
                            label = { Text(if (isHindi) "नया खाता (Sign Up)" else "Create Account") }
                        )
                    }

                    if (isRegisterMode) {
                        OutlinedTextField(
                            value = displayName,
                            onValueChange = {
                                displayName = it
                                inlineMessage = null
                                onClearError()
                            },
                            label = { Text(if (isHindi) "छात्र का नाम" else "Student Name") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    OutlinedTextField(
                        value = email,
                        onValueChange = {
                            email = it
                            inlineMessage = null
                            onClearError()
                        },
                        label = { Text(if (isHindi) "ईमेल पता" else "Email Address") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = password,
                        onValueChange = {
                            password = it
                            inlineMessage = null
                            onClearError()
                        },
                        label = { Text(if (isHindi) "पासवर्ड (कम से कम 6 अक्षर)" else "Password (6+ chars)") },
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { showPassword = !showPassword }) {
                                Icon(
                                    imageVector = if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = if (showPassword) "Hide password" else "Show password"
                                )
                            }
                        },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (!authSuccessMessage.isNullOrBlank()) {
                        Surface(
                            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(20.dp)
                                )
                                Text(
                                    text = authSuccessMessage,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }

                    val shownError = inlineMessage ?: authError
                    if (!shownError.isNullOrBlank()) {
                        Text(
                            text = shownError,
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.error
                        )
                    }

                    Button(
                        onClick = {
                            val trimmedEmail = email.trim()
                            if (trimmedEmail.isBlank() || !trimmedEmail.contains("@")) {
                                inlineMessage = if (isHindi) "कृपया सही ईमेल लिखें।" else "Enter a valid email address."
                            } else if (password.length < 6) {
                                inlineMessage = if (isHindi) "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।" else "Password must be at least 6 characters."
                            } else if (isRegisterMode && displayName.trim().length < 2) {
                                inlineMessage = if (isHindi) "कृपया अपना नाम लिखें।" else "Enter your name to create your profile."
                            } else {
                                inlineMessage = null
                                if (isRegisterMode) {
                                    onRegisterEmail(displayName.trim(), trimmedEmail, password)
                                } else {
                                    onSignInEmail(trimmedEmail, password)
                                }
                            }
                        },
                        enabled = !isLoading,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                        Text(
                            if (isRegisterMode) {
                                if (isHindi) "खाता बनाएं और शुरू करें" else "Create Account & Start Studying"
                            } else {
                                if (isHindi) "साइन इन करें" else "Sign In to Dashboard"
                            }
                        )
                    }

                    if (!isRegisterMode) {
                        TextButton(
                            onClick = {
                                val trimmedEmail = email.trim()
                                if (trimmedEmail.isBlank() || !trimmedEmail.contains("@")) {
                                    inlineMessage = if (isHindi) {
                                        "पासवर्ड रीसेट लिंक के लिए ऊपर अपना ईमेल लिखें।"
                                    } else {
                                        "Enter your email above first to get a password reset link."
                                    }
                                } else {
                                    inlineMessage = null
                                    onSendPasswordReset(trimmedEmail)
                                }
                            },
                            enabled = !isLoading,
                            modifier = Modifier.align(Alignment.CenterHorizontally)
                        ) {
                            Text(if (isHindi) "पासवर्ड भूल गए? रीसेट लिंक भेजें" else "Forgot Password? Send Reset Link")
                        }
                    }

                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = if (isHindi) {
                            "आपके सभी दिए गए मॉक टेस्ट, XP और अध्ययन प्रगति आपकी Firebase प्रोफ़ाइल में सुरक्षित सहेजे जाएंगे।"
                        } else {
                            "All mock tests you take, XP, and study streaks save automatically to your Firebase student profile."
                        },
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
