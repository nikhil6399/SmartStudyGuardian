package com.jee.studyguardian.ai

import com.jee.studyguardian.models.LanguageMode
import com.jee.studyguardian.models.StructuredAiAnswer
import com.jee.studyguardian.models.StudyLevel
import com.jee.studyguardian.models.Subject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

sealed class AiTutorResponse {
    data class Success(
        val answerText: String,
        val structured: StructuredAiAnswer?,
        val structuredJson: String
    ) : AiTutorResponse()

    data class Error(val userMessage: String) : AiTutorResponse()
}

/**
 * Connects to the configured backend AI service without embedding private API keys in the APK.
 * Always returns student-friendly error messages and never fabricates offline answers.
 */
class AiProviderClient {

    private val client = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .build()

    suspend fun askStudyQuestion(
        backendUrl: String,
        question: String,
        subject: Subject,
        language: LanguageMode,
        mode: String,
        level: StudyLevel
    ): AiTutorResponse = withContext(Dispatchers.IO) {
        val cleanUrl = backendUrl.trim().trimEnd('/')
        if (cleanUrl.isBlank()) {
            return@withContext AiTutorResponse.Error(
                userMessage = if (language == LanguageMode.HINDI) {
                    "AI ट्यूटर अभी उपलब्ध नहीं है। कृपया कुछ देर बाद पुनः प्रयास करें।"
                } else {
                    "AI Tutor is temporarily unavailable. Please try again."
                }
            )
        }

        val endpoint = if (cleanUrl.endsWith("/api/ai/tutor")) cleanUrl else "$cleanUrl/api/ai/tutor"

        val payload = JSONObject().apply {
            put("question", question)
            put("subject", subject.name)
            put("language", language.code)
            put("mode", mode)
            put("level", level.apiValue)
        }

        val request = Request.Builder()
            .url(endpoint)
            .post(payload.toString().toRequestBody("application/json; charset=utf-8".toMediaType()))
            .header("Accept", "application/json")
            .build()

        try {
            client.newCall(request).execute().use { response ->
                val rawBody = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    return@withContext AiTutorResponse.Error(
                        userMessage = if (language == LanguageMode.HINDI) {
                            "AI ट्यूटर अभी व्यस्त है। कृपया पुनः प्रयास करें।"
                        } else {
                            "AI Tutor is temporarily unavailable. Please try again."
                        }
                    )
                }

                val json = JSONObject(rawBody)
                val answer = json.optString("answer").trim()
                val structObj = json.optJSONObject("structured")
                val structured = structObj?.let { s ->
                    val stepsArr = s.optJSONArray("steps")
                    val steps = buildList {
                        if (stepsArr != null) {
                            for (i in 0 until stepsArr.length()) {
                                val step = stepsArr.optString(i).trim()
                                if (step.isNotEmpty()) add(step)
                            }
                        }
                    }
                    StructuredAiAnswer(
                        given = s.optString("given"),
                        formula = s.optString("formula"),
                        steps = steps,
                        finalAnswer = s.optString("finalAnswer"),
                        keyNote = s.optString("keyNote")
                    )
                }

                if (answer.isBlank() && structured == null) {
                    return@withContext AiTutorResponse.Error(
                        userMessage = if (language == LanguageMode.HINDI) {
                            "उत्तर प्राप्त नहीं हो सका। कृपया पुनः प्रयास करें।"
                        } else {
                            "AI Tutor is temporarily unavailable. Please try again."
                        }
                    )
                }

                AiTutorResponse.Success(
                    answerText = answer,
                    structured = structured,
                    structuredJson = structObj?.toString() ?: ""
                )
            }
        } catch (_: IOException) {
            AiTutorResponse.Error(
                userMessage = if (language == LanguageMode.HINDI) {
                    "इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया नेटवर्क जांचें और पुनः प्रयास करें।"
                } else {
                    "Internet connection unavailable. Please check your network and try again."
                }
            )
        } catch (_: Exception) {
            AiTutorResponse.Error(
                userMessage = if (language == LanguageMode.HINDI) {
                    "AI ट्यूटर अभी उपलब्ध नहीं है। कृपया पुनः प्रयास करें।"
                } else {
                    "AI Tutor is temporarily unavailable. Please try again."
                }
            )
        }
    }
}
