package com.jee.studyguardian.firebase

import android.content.Context
import android.os.Bundle
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseNetworkException
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.UserProfileChangeRequest
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.SetOptions
import com.jee.studyguardian.database.MockTestResultEntity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await

data class FirebaseAuthUiState(
    val isAuthInitialized: Boolean = false,
    val isSignedIn: Boolean = false,
    val uid: String? = null,
    val displayName: String? = null,
    val email: String? = null,
    val isEmailVerified: Boolean = false
)

data class CloudStudySummary(
    val selectedExamTrack: String = "CLASS_12_BOARD",
    val studyStreakDays: Int = 1,
    val xpPoints: Int = 0,
    val dailyGoalMinutes: Int = 360,
    val totalFocusMinutes: Int = 0,
    val totalMockTests: Int = 0,
    val completedChapterIds: List<String> = emptyList()
)

object FirebaseSyncManager {

    private const val FIRESTORE_DATABASE_ID = "ai-studio-jeeaistudyguardi-716e3f56-f08e-479b-81a6-f40423fb632c"

    private val _authState = MutableStateFlow(FirebaseAuthUiState())
    val authState: StateFlow<FirebaseAuthUiState> = _authState.asStateFlow()

    private var authListenerRegistered = false

    fun initialize(context: Context) {
        try {
            if (FirebaseApp.getApps(context).isEmpty()) {
                FirebaseApp.initializeApp(context)
            }
            val auth = FirebaseAuth.getInstance()
            if (!authListenerRegistered) {
                authListenerRegistered = true
                auth.addAuthStateListener { firebaseAuth ->
                    _authState.value = mapUser(firebaseAuth.currentUser)
                }
            }
            _authState.value = mapUser(auth.currentUser)
        } catch (_: Throwable) {
            // Ensure app never stalls on splash if Play Services / FirebaseApp is unavailable in tests
            _authState.value = FirebaseAuthUiState(isAuthInitialized = true, isSignedIn = false)
        }
    }

    private fun mapUser(user: FirebaseUser?): FirebaseAuthUiState {
        if (user == null) {
            return FirebaseAuthUiState(isAuthInitialized = true, isSignedIn = false)
        }
        return FirebaseAuthUiState(
            isAuthInitialized = true,
            isSignedIn = true,
            uid = user.uid,
            displayName = user.displayName ?: user.email?.substringBefore("@") ?: "Student",
            email = user.email,
            isEmailVerified = user.isEmailVerified
        )
    }

    private fun sanitizeId(raw: String): String {
        val cleaned = raw.replace(Regex("[^a-zA-Z0-9_\\-]"), "_").take(128)
        return cleaned.ifBlank { "id_${System.currentTimeMillis()}" }
    }

    private fun firestoreOrNull(): FirebaseFirestore? {
        return try {
            val app = FirebaseApp.getInstance()
            FirebaseFirestore.getInstance(app, FIRESTORE_DATABASE_ID)
        } catch (_: Throwable) {
            null
        }
    }

    fun friendlyAuthError(error: Throwable?): String {
        return when (error) {
            is FirebaseAuthWeakPasswordException -> "Password must be at least 6 characters long."
            is FirebaseAuthInvalidCredentialsException -> "Invalid email format or wrong password. Please check and retry."
            is FirebaseAuthInvalidUserException -> "No account found for this email. Create a new account in Sign Up."
            is FirebaseAuthUserCollisionException -> "An account with this email already exists. Switch to Sign In."
            is FirebaseNetworkException -> "Network error. Please check your internet connection."
            is FirebaseAuthException -> when (error.errorCode) {
                "ERROR_OPERATION_NOT_ALLOWED" ->
                    "Email/Password login is not enabled in Firebase Console → Authentication → Sign-in method."
                "ERROR_TOO_MANY_REQUESTS" ->
                    "Too many failed attempts. Please wait a minute and try again."
                else -> error.localizedMessage ?: "Authentication failed (${error.errorCode})."
            }
            is FirebaseFirestoreException -> when (error.code) {
                FirebaseFirestoreException.Code.PERMISSION_DENIED ->
                    "Cloud profile permission error. Please sign out and sign in again."
                FirebaseFirestoreException.Code.UNAVAILABLE ->
                    "Cloud server temporarily unreachable. Saved locally and will retry."
                else -> error.localizedMessage ?: "Firestore sync failed."
            }
            else -> error?.localizedMessage ?: "Something went wrong. Please try again."
        }
    }

    fun logEvent(context: Context, eventName: String, params: Map<String, String> = emptyMap()) {
        try {
            val analytics = FirebaseAnalytics.getInstance(context)
            val bundle = Bundle()
            params.forEach { (k, v) -> bundle.putString(k, v.take(100)) }
            analytics.logEvent(eventName, bundle)
        } catch (_: Throwable) {
            // Safe no-op when analytics unavailable
        }
    }

    suspend fun signInWithGoogleCredential(idToken: String): Result<FirebaseAuthUiState> {
        return try {
            val credential = GoogleAuthProvider.getCredential(idToken, null)
            val auth = FirebaseAuth.getInstance()
            val result = auth.signInWithCredential(credential).await()
            val mapped = mapUser(result.user)
            _authState.value = mapped
            Result.success(mapped)
        } catch (t: Throwable) {
            Result.failure(t)
        }
    }

    suspend fun signInWithEmail(email: String, password: String): Result<FirebaseAuthUiState> {
        return try {
            val auth = FirebaseAuth.getInstance()
            val result = auth.signInWithEmailAndPassword(email.trim(), password).await()
            val mapped = mapUser(result.user)
            _authState.value = mapped
            Result.success(mapped)
        } catch (t: Throwable) {
            Result.failure(t)
        }
    }

    suspend fun registerWithEmail(
        displayName: String,
        email: String,
        password: String
    ): Result<FirebaseAuthUiState> {
        return try {
            val auth = FirebaseAuth.getInstance()
            val result = auth.createUserWithEmailAndPassword(email.trim(), password).await()
            val user = result.user
            if (user != null && displayName.isNotBlank()) {
                runCatching {
                    user.updateProfile(
                        UserProfileChangeRequest.Builder()
                            .setDisplayName(displayName.trim().take(100))
                            .build()
                    ).await()
                }
            }
            val mapped = mapUser(auth.currentUser)
            _authState.value = mapped
            Result.success(mapped)
        } catch (t: Throwable) {
            Result.failure(t)
        }
    }

    suspend fun sendPasswordReset(email: String): Result<Unit> {
        return try {
            FirebaseAuth.getInstance().sendPasswordResetEmail(email.trim()).await()
            Result.success(Unit)
        } catch (t: Throwable) {
            Result.failure(t)
        }
    }

    fun signOut() {
        try {
            FirebaseAuth.getInstance().signOut()
            _authState.value = FirebaseAuthUiState(isAuthInitialized = true, isSignedIn = false)
        } catch (_: Throwable) {
            // Ignore
        }
    }

    private suspend fun ensureUserProfileDocument(
        db: FirebaseFirestore,
        user: FirebaseUser,
        selectedExamTrack: String,
        studyStreakDays: Int,
        xpPoints: Int,
        biometricEnabled: Boolean
    ): String {
        val safeUid = sanitizeId(user.uid)
        val safeName = (user.displayName?.takeIf { it.isNotBlank() }
            ?: user.email?.substringBefore("@")?.takeIf { it.isNotBlank() }
            ?: "Student").take(100)
        val safeTrack = selectedExamTrack.take(40).ifBlank { "CLASS_12_BOARD" }

        val userRef = db.collection("users").document(safeUid)
        val existingUser = userRef.get().await()
        val profileData = hashMapOf<String, Any>(
            "uid" to safeUid,
            "displayName" to safeName,
            "selectedExamTrack" to safeTrack,
            "biometricEnabled" to biometricEnabled,
            "studyStreakDays" to studyStreakDays.coerceIn(0, 10000),
            "xpPoints" to xpPoints.coerceIn(0, 10000000),
            "createdAt" to (existingUser.getTimestamp("createdAt") ?: FieldValue.serverTimestamp()),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        userRef.set(profileData, SetOptions.merge()).await()
        return safeUid
    }

    suspend fun saveMockTestResult(
        result: MockTestResultEntity,
        selectedExamTrack: String = "CLASS_12_BOARD",
        studyStreakDays: Int = 1,
        xpPoints: Int = 0,
        biometricEnabled: Boolean = false
    ): Result<Unit> {
        return try {
            val user = FirebaseAuth.getInstance().currentUser
                ?: return Result.failure(IllegalStateException("Sign in to save tests to your profile."))
            val db = firestoreOrNull()
                ?: return Result.failure(IllegalStateException("Firestore is not initialized."))

            val safeUid = ensureUserProfileDocument(
                db = db,
                user = user,
                selectedExamTrack = selectedExamTrack,
                studyStreakDays = studyStreakDays,
                xpPoints = xpPoints,
                biometricEnabled = biometricEnabled
            )
            val testId = sanitizeId("mt_${result.timestampEpochMs}_${result.score}_${result.attempted}")
            val testRef = db.collection("users").document(safeUid).collection("mockTests").document(testId)
            val existing = testRef.get().await()
            if (existing.exists()) return Result.success(Unit)

            val docData = hashMapOf<String, Any>(
                "ownerId" to safeUid,
                "testId" to testId,
                "title" to result.title.trim().take(160).ifBlank { "Mock Test" },
                "track" to result.track.trim().take(40).ifBlank { "CLASS_12_BOARD" },
                "subjectLabel" to result.subjectName.trim().take(60).ifBlank { "Full Syllabus" },
                "totalQuestions" to result.totalQuestions.coerceIn(1, 500),
                "attempted" to result.attempted.coerceIn(0, 500),
                "correct" to result.correct.coerceIn(0, 500),
                "incorrect" to result.incorrect.coerceIn(0, 500),
                "score" to result.score.coerceIn(-500, 2000),
                "maxScore" to result.maxScore.coerceIn(1, 2000),
                "accuracyPercent" to result.accuracyPercent.toDouble().coerceIn(0.0, 100.0),
                "durationSeconds" to result.durationTakenSeconds.coerceIn(0, 36000),
                "takenAtEpochMs" to result.timestampEpochMs.coerceAtLeast(0L),
                "createdAt" to FieldValue.serverTimestamp()
            )
            testRef.set(docData).await()
            Result.success(Unit)
        } catch (t: Throwable) {
            Result.failure(t)
        }
    }

    suspend fun fetchCloudMockTests(): Result<List<MockTestResultEntity>> {
        return try {
            val user = FirebaseAuth.getInstance().currentUser
                ?: return Result.success(emptyList())
            val db = firestoreOrNull()
                ?: return Result.success(emptyList())

            val safeUid = sanitizeId(user.uid)
            val snapshot = db.collection("users")
                .document(safeUid)
                .collection("mockTests")
                .whereEqualTo("ownerId", safeUid)
                .limit(100)
                .get()
                .await()

            val items = snapshot.documents.mapNotNull { doc ->
                val title = doc.getString("title") ?: return@mapNotNull null
                MockTestResultEntity(
                    title = title,
                    track = doc.getString("track") ?: "CLASS_12_BOARD",
                    subjectName = doc.getString("subjectLabel") ?: "Full Syllabus",
                    totalQuestions = (doc.getLong("totalQuestions") ?: 1L).toInt(),
                    attempted = (doc.getLong("attempted") ?: 0L).toInt(),
                    correct = (doc.getLong("correct") ?: 0L).toInt(),
                    incorrect = (doc.getLong("incorrect") ?: 0L).toInt(),
                    score = (doc.getLong("score") ?: 0L).toInt(),
                    maxScore = (doc.getLong("maxScore") ?: 1L).toInt(),
                    accuracyPercent = (doc.getDouble("accuracyPercent") ?: 0.0).toFloat(),
                    durationTakenSeconds = (doc.getLong("durationSeconds") ?: 0L).toInt(),
                    timestampEpochMs = doc.getLong("takenAtEpochMs") ?: System.currentTimeMillis()
                )
            }.sortedByDescending { it.timestampEpochMs }

            Result.success(items)
        } catch (t: Throwable) {
            Result.failure(t)
        }
    }

    suspend fun fetchCloudStudySummary(): Result<CloudStudySummary?> {
        return try {
            val user = FirebaseAuth.getInstance().currentUser
                ?: return Result.success(null)
            val db = firestoreOrNull()
                ?: return Result.success(null)

            val safeUid = sanitizeId(user.uid)
            val doc = db.collection("users")
                .document(safeUid)
                .collection("studyState")
                .document("current")
                .get()
                .await()
            if (!doc.exists()) return Result.success(null)

            val rawChapters = doc.get("completedChapterIds") as? List<*>
            val chapters = rawChapters?.mapNotNull { it as? String } ?: emptyList()

            Result.success(
                CloudStudySummary(
                    selectedExamTrack = doc.getString("selectedExamTrack") ?: "CLASS_12_BOARD",
                    studyStreakDays = (doc.getLong("studyStreakDays") ?: 1L).toInt(),
                    xpPoints = (doc.getLong("xpPoints") ?: 0L).toInt(),
                    dailyGoalMinutes = (doc.getLong("dailyGoalMinutes") ?: 360L).toInt(),
                    totalFocusMinutes = (doc.getLong("totalFocusMinutes") ?: 0L).toInt(),
                    totalMockTests = (doc.getLong("totalMockTests") ?: 0L).toInt(),
                    completedChapterIds = chapters
                )
            )
        } catch (t: Throwable) {
            Result.failure(t)
        }
    }

    suspend fun syncStudyProgress(
        selectedExamTrack: String,
        studyStreakDays: Int,
        xpPoints: Int,
        biometricEnabled: Boolean,
        dailyGoalMinutes: Int,
        totalFocusMinutes: Int,
        totalMockTests: Int,
        completedChapterIds: List<String>,
        recentMockTests: List<MockTestResultEntity> = emptyList()
    ): Result<Unit> {
        return try {
            val user = FirebaseAuth.getInstance().currentUser
                ?: return Result.failure(IllegalStateException("Sign in to sync study progress to Firebase."))
            val db = firestoreOrNull()
                ?: return Result.failure(IllegalStateException("Firestore is not initialized."))

            val safeUid = ensureUserProfileDocument(
                db = db,
                user = user,
                selectedExamTrack = selectedExamTrack,
                studyStreakDays = studyStreakDays,
                xpPoints = xpPoints,
                biometricEnabled = biometricEnabled
            )
            val safeTrack = selectedExamTrack.take(40).ifBlank { "CLASS_12_BOARD" }
            val boundedChapters = completedChapterIds.map { it.take(80) }.filter { it.isNotBlank() }.take(200)

            recentMockTests.take(25).forEach { test ->
                saveMockTestResult(
                    result = test,
                    selectedExamTrack = safeTrack,
                    studyStreakDays = studyStreakDays,
                    xpPoints = xpPoints,
                    biometricEnabled = biometricEnabled
                )
            }

            val syncRef = db.collection("users").document(safeUid).collection("studyState").document("current")
            val existingSync = syncRef.get().await()
            val syncData = hashMapOf<String, Any>(
                "ownerId" to safeUid,
                "selectedExamTrack" to safeTrack,
                "studyStreakDays" to studyStreakDays.coerceIn(0, 10000),
                "xpPoints" to xpPoints.coerceIn(0, 10000000),
                "dailyGoalMinutes" to dailyGoalMinutes.coerceIn(10, 1440),
                "totalFocusMinutes" to totalFocusMinutes.coerceIn(0, 10000000),
                "totalMockTests" to totalMockTests.coerceIn(0, 1000000),
                "completedChapterIds" to boundedChapters,
                "createdAt" to (existingSync.getTimestamp("createdAt") ?: FieldValue.serverTimestamp()),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            syncRef.set(syncData).await()
            Result.success(Unit)
        } catch (t: Throwable) {
            Result.failure(t)
        }
    }
}
