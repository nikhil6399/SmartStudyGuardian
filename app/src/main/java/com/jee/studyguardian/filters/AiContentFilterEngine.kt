package com.jee.studyguardian.filters

import com.jee.studyguardian.models.FilterClassificationResult
import com.jee.studyguardian.models.FilterStrictness

/**
 * On-Device AI-Assisted Content Filter.
 *
 * Explicitly distinguishes:
 * 1. Inappropriate / unsafe content classification (keyword + phrase scoring).
 * 2. Distracting off-study content classification (social media, OTT reels, gaming, celebrity gossip).
 * 3. AI-generated text pattern heuristics (statistical repetition & boilerplate cues —
 *    explicitly disclosed as probabilistic heuristics, NEVER claimed as 100% AI detection).
 *
 * Runs 100% locally on-device. Never collects passwords, private chats, or screenshots.
 */
object AiContentFilterEngine {

    private val inappropriateLexicon = setOf(
        "nsfw", "gambling", "betting", "casino", "explicit", "adult", "porn", "lottery", "stake"
    )

    private val socialEntertainmentLexicon = setOf(
        "instagram", "snapchat", "facebook", "tiktok", "reddit", "threads", "pinterest",
        "netflix", "hotstar", "primevideo", "jiocinema", "mxplayer", "twitch", "discord",
        "moj", "josh", "sharechat", "tinder", "bumble"
    )

    private val gamingBettingLexicon = setOf(
        "pubg", "bgmi", "freefire", "codm", "valorant", "roblox", "minecraft",
        "ludo", "rummy", "dream11", "mpl", "my11circle", "winzo", "zupee"
    )

    private val distractingLexicon = setOf(
        "reel", "reels", "shorts", "prank", "roast", "meme", "memes", "gossip",
        "spoiler", "trailer", "clickbait", "giveaway", "celebrity", "gaming", "vlog"
    )

    private val aiBoilerplatePhrases = listOf(
        "as an ai language model",
        "delve into the tapestry",
        "in conclusion, it is important to note",
        "let's embark on a journey",
        "a testament to the multifaceted"
    )

    fun classifyAppContext(
        appLabel: String,
        packageName: String,
        enabled: Boolean,
        strictness: FilterStrictness,
        customKeywordsCsv: String,
        enabledCategoriesCsv: String
    ): FilterClassificationResult {
        val compactPkg = packageName
            .lowercase()
            .replace(".", " ")
            .replace("_", " ")
        val combinedInput = "$appLabel $compactPkg"
        return classifyText(
            text = combinedInput,
            enabled = enabled,
            strictness = strictness,
            customKeywordsCsv = customKeywordsCsv,
            enabledCategoriesCsv = enabledCategoriesCsv
        )
    }

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
        val allowInappropriate = enabledCategories.isBlank() || enabledCategories.contains("inappropriate")
        val allowSocial = enabledCategories.isBlank() ||
            enabledCategories.contains("social") ||
            enabledCategories.contains("distraction")
        val allowGaming = enabledCategories.isBlank() ||
            enabledCategories.contains("gaming") ||
            enabledCategories.contains("betting") ||
            enabledCategories.contains("distraction")

        val inappropriateHits = if (allowInappropriate) {
            inappropriateLexicon.filter { it in tokens || normalized.contains(it) }
        } else {
            emptyList()
        }
        val socialHits = if (allowSocial) {
            socialEntertainmentLexicon.filter { it in tokens || normalized.contains(it) }
        } else {
            emptyList()
        }
        val gamingHits = if (allowGaming) {
            gamingBettingLexicon.filter { it in tokens || normalized.contains(it) }
        } else {
            emptyList()
        }
        val distractingHits = if (allowSocial || allowGaming) {
            distractingLexicon.filter { it in tokens || normalized.contains(it) }
        } else {
            emptyList()
        }
        val customHits = customKeywords.filter { normalized.contains(it) }
        val aiPatternHits = aiBoilerplatePhrases.filter { normalized.contains(it) }

        val combinedScore = inappropriateHits.size * 2 +
            socialHits.size * 2 +
            gamingHits.size * 2 +
            distractingHits.size +
            customHits.size * 2

        if (inappropriateHits.isNotEmpty()) {
            return FilterClassificationResult(
                isFlagged = true,
                category = "Inappropriate Content",
                matchedKeywords = (inappropriateHits + customHits).distinct(),
                confidenceNote = "High local rule match (${inappropriateHits.size} unsafe cues)",
                classificationType = "Inappropriate Content Classification"
            )
        }

        if (combinedScore >= strictness.threshold) {
            val allDistractionHits = (socialHits + gamingHits + distractingHits + customHits).distinct()
            val resolvedCategory = when {
                customHits.isNotEmpty() -> "Custom Blocked Rule"
                gamingHits.isNotEmpty() -> "Gaming & Betting"
                socialHits.isNotEmpty() -> "Social Distractions"
                else -> "Study Distraction"
            }
            return FilterClassificationResult(
                isFlagged = true,
                category = resolvedCategory,
                matchedKeywords = allDistractionHits,
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
