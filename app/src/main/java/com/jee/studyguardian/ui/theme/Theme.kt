package com.jee.studyguardian.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val GuardianNavyBg = Color(0xFF050C24)
val GuardianCobaltSurface = Color(0xFF0C1A42)
val GuardianCobaltElevated = Color(0xFF13265A)
val GuardianCyanAccent = Color(0xFF00D4FF)
val GuardianGoldAccent = Color(0xFFFFD426)
val GuardianEmerald = Color(0xFF10B981)
val GuardianCoral = Color(0xFFEF4444)

private val DarkColorScheme = darkColorScheme(
    primary = GuardianCyanAccent,
    onPrimary = Color(0xFF03122A),
    secondary = GuardianGoldAccent,
    onSecondary = Color(0xFF1C1600),
    tertiary = GuardianEmerald,
    background = GuardianNavyBg,
    onBackground = Color(0xFFF1F5F9),
    surface = GuardianCobaltSurface,
    onSurface = Color(0xFFF1F5F9),
    surfaceVariant = GuardianCobaltElevated,
    onSurfaceVariant = Color(0xFFCBD5E1),
    outline = Color(0xFF284385),
    error = GuardianCoral
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF026AA7),
    onPrimary = Color.White,
    secondary = Color(0xFFD97706),
    onSecondary = Color.White,
    tertiary = Color(0xFF059669),
    background = Color(0xFFF8FAFC),
    onBackground = Color(0xFF0F172A),
    surface = Color.White,
    onSurface = Color(0xFF0F172A),
    surfaceVariant = Color(0xFFEFF4FA),
    onSurfaceVariant = Color(0xFF475569),
    outline = Color(0xFFCBD5E1),
    error = Color(0xFFDC2626)
)

private val GuardianTypography = Typography(
    headlineMedium = TextStyle(fontWeight = FontWeight.Bold, fontSize = 24.sp, lineHeight = 30.sp),
    titleLarge = TextStyle(fontWeight = FontWeight.Bold, fontSize = 20.sp, lineHeight = 26.sp),
    titleMedium = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 16.sp, lineHeight = 22.sp),
    bodyMedium = TextStyle(fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 20.sp),
    labelMedium = TextStyle(fontWeight = FontWeight.Medium, fontSize = 12.sp, lineHeight = 16.sp)
)

@Composable
fun JeeStudyGuardianTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme,
        typography = GuardianTypography,
        content = content
    )
}
