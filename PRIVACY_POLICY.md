# Privacy Policy — JEE AI Study Guardian

**Effective Date:** November 2026  
**Application:** JEE AI Study Guardian (`com.jee.studyguardian`)

## 1. Overview & No-Account Design
JEE AI Study Guardian operates without user accounts, registration, login, OTP verification, or Firebase tracking. Your syllabus progress, notes, saved questions, study planner, mock test history, and filter logs are stored locally on your device using Android Room and Jetpack DataStore.

## 2. Sensitive Permissions & Exact Usage
- **Accessibility Service (`BIND_ACCESSIBILITY_SERVICE`)**:
  - **Purpose**: Activated only when you explicitly enable it in Android Settings. Used strictly on-device to detect when a user-selected distracting app is opened during an active Focus Mode / App Blocker session, and—when YouTube Distraction Control is turned on—to check visible public screen titles/Shorts UI containers inside YouTube.
  - **Strict Non-Collection Guarantee**: The service explicitly skips password fields and **never** collects, stores, or transmits personal messages, keystrokes, screenshots, contacts, or financial credentials.
- **Usage Access (`PACKAGE_USAGE_STATS`)**:
  - **Purpose**: Displays your daily app usage minutes on-device inside the App Blocker tab so you can choose which distracting apps to limit. Usage statistics are never uploaded to any external server.
- **Installed Apps Visibility (`QUERY_ALL_PACKAGES`)**:
  - **Purpose**: Populates the local "Select Apps to Block" picker with launcher apps installed on your device.

## 3. AI Study Tutor Requests
When you submit a study question in the **AI Tutor** tab, only the question text, subject tag, and selected language (`en` / `hi`) are sent over HTTPS to the AI backend endpoint configured by you or the app operator. No device identifiers or personal profiles are attached.

## 4. Advertising & Consent (Google AdMob)
- The app uses the official Google Mobile Ads SDK and Google User Messaging Platform (UMP) to manage regional privacy consent.
- Age-appropriate ad treatment (`tagForUnderAgeOfConsent` and Teen-max content rating) is enabled by default for student safety.
- You can update ad personalization preferences anytime in **Settings > AdMob & Privacy Preferences**.

## 5. Data Control & Deletion
You can export a local JSON backup, restore a backup, or permanently erase all stored Room database and DataStore records at any time from **Settings > Clear All Local Data**, or by uninstalling the app.
