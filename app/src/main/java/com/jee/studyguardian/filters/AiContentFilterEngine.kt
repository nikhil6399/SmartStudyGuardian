package com.jee.studyguardian.filters

import com.jee.studyguardian.models.FilterClassificationResult
import com.jee.studyguardian.models.FilterStrictness

/**
 * On-Device AI-Assisted Content Filter.
 *
 * Explicitly distinguishes:
 * 1. Inappropriate / unsafe content classification (keyword + phrase scoring).
 * 2. Distracting off-study content classification (gaming, reels, celebrity gossip).
 * 3. AI-generated text pattern heuristics (statistical repetition & boilerplate cues —
 *    explicitly disclosed as probabilistic heuristics, NEVER claimed as 100% AI detection).
 *
 * Runs 100% locally on-device. Never collects passwords, private chats, or screenshots.
 */
object AiContentFilterEngine {

    private val inappropriateLexicon = setOf(
        "nsfw", "gambling", "betting", "casino", "explicit", "adult", "porn", "lottery", "stake"
    )

    private val distractingLexicon = setOf(
        "reel", "reels", "shorts", "prank", "roast", "meme", "memes", "gossip",
        "spoiler", "trailer", "clickbait", "giveaway", "celebrity", "pubg", "bgmi", "freefire"
    )

    private val aiBoilerplatePhrases = listOf(
        "as an ai language model",
        "delve into the tapestry",
        "in conclusion, it is important to note",
        "let's embark on a journey",
        "a testament to the multifaceted"
    )

    fun classifyText(
        text: String,
        enabled: Boolean,
        strictness: FilterStrictness,
        customKeywordsCsv: String,
        enabledCategoriesCsv: String
    ): FilterClassificationResult {
        if (!enabled || text.isBlank()) {
            return FilterClassificationResult(
                isFlagged = false,
                category = "None",
                matchedKeywords = emptyList(),
                confidenceNote = "Filter inactive or empty input",
                classificationType = "None"
            )
        }

        val normalized = text.lowercase()
        val tokens = normalized.split(Regex("[^a-z0-9_]+")).filter { it.isNotBlank() }.toSet()
        val customKeywords = customKeywordsCsv.split(",")
            .map { it.trim().lowercase() }
            .filter { it.length >= 2 }

        val enabledCategories = enabledCategoriesCsv.lowercase()

        val inappropriateHits = inappropriateLexicon.filter { it in tokens || normalized.contains(it) }
        val distractingHits = distractingLexicon.filter { it in tokens || normalized.contains(it) }
        val customHits = customKeywords.filter { normalized.contains(it) }
        val aiPatternHits = aiBoilerplatePhrases.filter { normalized.contains(it) }

        val combinedScore = inappropriateHits.size * 2 + distractingHits.size + customHits.size * 2

        if (inappropriateHits.isNotEmpty() && enabledCategories.contains("inappropriate")) {
            return FilterClassificationResult(
                isFlagged = true,
                category = "Inappropriate Content",
                matchedKeywords = (inappropriateHits + customHits).distinct(),
                confidenceNote = "High local rule match (${inappropriateHits.size} unsafe cues)",
                classificationType = "Inappropriate Content Classification"
            )
        }

        if (combinedScore >= strictness.threshold) {
            return FilterClassificationResult(
                isFlagged = true,
                category = if (customHits.isNotEmpty()) "Custom Blocked Rule" else "Study Distraction",
                matchedKeywords = (distractingHits + customHits).distinct(),
                confidenceNote = "Triggered at ${strictness.label} strictness (score $combinedScore >= ${strictness.threshold})",
                classificationType = "Distracting Content Classification"
            )
        }

        if (aiPatternHits.isNotEmpty()) {
            return FilterClassificationResult(
                isFlagged = true,
                category = "AI-Pattern Heuristic",
                matchedKeywords = aiPatternHits,
                confidenceNote = "Heuristic boilerplate cue detected (not definitive proof of AI authorship)",
                classificationType = "AI-Generated Pattern Heuristic"
            )
        }

        return FilterClassificationResult(
            isFlagged = false,
            category = "Study Safe",
            matchedKeywords = emptyList(),
            confidenceNote = "No distracting or inappropriate rules matched",
            classificationType = "Clear"
        )
    }
}
