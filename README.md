# JEE AI Study Guardian

A local-first, Material 3 Jetpack Compose Android application built with Kotlin, Room, DataStore, WorkManager, Google Mobile Ads (AdMob + UMP), and a configurable secure backend AI proxy for JEE Main & JEE Advanced preparation paired with digital distraction controls.

## Key Architecture Highlights
- **No Login / No Firebase**: Opens directly to the Home Dashboard. All study progress, notes, mock tests, goals, timetable slots, focus sessions, and filter logs persist locally in **Room** + **Jetpack DataStore**.
- **MVVM + Repository**: Clean separation across `application/`, `data/`, `database/`, `models/`, `repository/`, `viewmodel/`, `navigation/`, `ui/`, `ai/`, `ads/`, `blocker/`, `filters/`, `planner/`, `analytics/`, and `utils/`.
- **Minimum SDK**: Android 8.0 (API 26) · **Target SDK**: Android 35 · **Language**: Kotlin 2.0 · **UI**: Jetpack Compose Material 3.

---

## 1. Building the Debug APK (Local & GitHub Actions)

### Local Build (Android Studio)
1. Open the repository root in **Android Studio Ladybug (2024.2+)** with JDK 17.
2. Sync Gradle (`settings.gradle.kts` + `gradle/libs.versions.toml`).
3. Run `./gradlew assembleDebug` or click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Debug APK output path: `app/build/outputs/apk/debug/app-debug.apk`.

### Automated GitHub Actions Build
- Workflow file: `.github/workflows/android-ci.yml`
- Automatically runs on `push` / `pull_request` to `main` or `master`:
  1. Sets up JDK 17 (Temurin), Android SDK, and Gradle 8.9.
  2. Executes `gradle testDebugUnitTest`.
  3. Builds the Debug APK (`gradle assembleDebug`).
  4. Uploads `jee-ai-study-guardian-debug-apk` as a downloadable GitHub Actions artifact.
- **Release APK Job**: Trigger manually via `workflow_dispatch` (`build_release = true`) after configuring repository secrets (`KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`, `ADMOB_APP_ID`, `ADMOB_BANNER_ID`, `ADMOB_INTERSTITIAL_ID`, `ADMOB_REWARDED_ID`, `ADMOB_NATIVE_ID`, `AI_BACKEND_URL`). No secrets are stored in source code.

---

## 2. AI Study Tutor Backend Configuration
**Private AI API keys are NEVER embedded inside the APK.**
1. Deploy the included Express backend (`server.ts`, route `POST /api/ai/tutor`) or your own Cloud Run / Node server holding `GEMINI_API_KEY` as a server-side secret.
2. In the Android app, open **Settings > AI Provider Configuration** and enter your HTTPS backend base URL (or pass `-PAI_BACKEND_URL=https://your-service.run.app` at build time).
3. If the backend URL is unset or unreachable, the app displays an honest configuration/network notice and **never generates fake offline AI responses**.

---

## 3. AdMob Monetization Setup
- Debug builds automatically use **official Google AdMob Test Ad Unit IDs** (`ca-app-pub-3940256099942544~3347511713`, etc.) in `app/build.gradle.kts` and `AdManager.kt`.
- **Production Setup**: Supply your real AdMob App ID & Ad Unit IDs via Gradle properties (`-PADMOB_APP_ID=...`) or GitHub Actions Secrets—never commit private production keys if your repo is public.
- **Compliance**:
  - Integrates Google **UMP SDK** (`UserMessagingPlatform`) for regional consent.
  - Configures `TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE` and `MAX_AD_CONTENT_RATING_T` for age-appropriate student treatment.
  - Strictly suppresses interstitials during active Mock Tests, question solving, and active Focus Mode sessions.

---

## 4. Permissions & Distraction Blocker Setup Guide
- **Notifications (`POST_NOTIFICATIONS`)**: Optional; used for daily JEE revision reminders, Pomodoro break alerts, and visible Focus Mode countdown notification.
- **Usage Access (`PACKAGE_USAGE_STATS`)**: User must explicitly enable in Android Settings after reviewing the in-app rationale dialog. Used strictly on-device to show daily app usage minutes.
- **Accessibility Service (`BIND_ACCESSIBILITY_SERVICE`)**: User must explicitly enable **JEE Study Guardian App & Focus Filter** in Android Accessibility Settings.
  - Used strictly to detect foreground app package launches against your blocked apps list during active Focus sessions, and (when YouTube Filter is turned on) inspect non-sensitive visible YouTube Shorts/title nodes on-device.
  - **Never** reads passwords (`isPassword` nodes ignored), private messages, banking apps, or screenshots.
- **YouTube Filter Technical Limitation**: Android APIs do not permit intercepting YouTube's internal encrypted network recommendation feed. For guaranteed zero-distraction study, enable **Block Entire YouTube App During Focus**.
