package com.jee.studyguardian.ui.components

import android.annotation.SuppressLint
import android.webkit.WebView
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.jee.studyguardian.models.StructuredAiAnswer
import org.json.JSONObject

fun parseStructuredAiAnswer(jsonStr: String): StructuredAiAnswer? {
    if (jsonStr.isBlank()) return null
    return runCatching {
        val obj = JSONObject(jsonStr)
        val stepsArr = obj.optJSONArray("steps")
        val steps = buildList {
            if (stepsArr != null) {
                for (i in 0 until stepsArr.length()) {
                    val s = stepsArr.optString(i).trim()
                    if (s.isNotEmpty()) add(s)
                }
            }
        }
        StructuredAiAnswer(
            given = obj.optString("given"),
            formula = obj.optString("formula"),
            steps = steps,
            finalAnswer = obj.optString("finalAnswer"),
            keyNote = obj.optString("keyNote")
        )
    }.getOrNull()
}

/**
 * Renders structured student-friendly AI Tutor responses with KaTeX equation typesetting
 * inside a transparent, self-sizing WebView (plus clean Unicode math fallback if offline).
 * Never displays raw LaTeX delimiters, Markdown asterisks, or JSON syntax.
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun MathSolutionCard(
    structuredJson: String,
    plainFallbackText: String,
    languageCode: String,
    modifier: Modifier = Modifier
) {
    val parsed = remember(structuredJson) { parseStructuredAiAnswer(structuredJson) }
    val isHindi = languageCode == "hi"

    val textColorHex = String.format("#%06X", 0xFFFFFF and MaterialTheme.colorScheme.onSurface.toArgb())
    val accentHex = String.format("#%06X", 0xFFFFFF and MaterialTheme.colorScheme.primary.toArgb())
    val goldHex = String.format("#%06X", 0xFFFFFF and MaterialTheme.colorScheme.secondary.toArgb())

    if (parsed == null) {
        Text(
            text = sanitizeMathFallback(plainFallbackText),
            style = MaterialTheme.typography.bodyMedium,
            modifier = modifier
        )
        return
    }

    val givenTitle = if (isHindi) "प्रश्न में दिया गया (Given)" else "Given"
    val formulaTitle = if (isHindi) "इस्तेमाल किया गया सूत्र (Formula)" else "Formula"
    val solutionTitle = if (isHindi) "Step-by-step हल (Solution)" else "Step-by-Step Solution"
    val answerTitle = if (isHindi) "अंतिम उत्तर (Final Answer)" else "Final Answer"
    val tipTitle = if (isHindi) "मुख्य टिप" else "Key Tip"

    val htmlContent = remember(parsed, isHindi, textColorHex, accentHex, goldHex) {
        buildKatexHtml(
            givenTitle = givenTitle,
            given = parsed.given,
            formulaTitle = formulaTitle,
            formula = parsed.formula,
            solutionTitle = solutionTitle,
            steps = parsed.steps,
            answerTitle = answerTitle,
            finalAnswer = parsed.finalAnswer,
            tipTitle = tipTitle,
            keyNote = parsed.keyNote,
            textColorHex = textColorHex,
            accentHex = accentHex,
            goldHex = goldHex
        )
    }

    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        AndroidView(
            modifier = Modifier.fillMaxWidth(),
            factory = { ctx ->
                WebView(ctx).apply {
                    setBackgroundColor(android.graphics.Color.TRANSPARENT)
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = false
                    isVerticalScrollBarEnabled = false
                    isHorizontalScrollBarEnabled = false
                }
            },
            update = { webView ->
                webView.loadDataWithBaseURL(
                    "https://cdn.jsdelivr.net/",
                    htmlContent,
                    "text/html",
                    "UTF-8",
                    null
                )
            }
        )
    }
}

private fun escapeHtml(raw: String): String {
    return raw
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
}

private fun sanitizeMathFallback(raw: String): String {
    return raw
        .replace("$$", "")
        .replace("$", "")
        .replace("**", "")
        .replace("\\rightarrow", " -> ")
        .replace("\\rightleftharpoons", " <-> ")
        .replace("\\times", " × ")
        .replace("\\cdot", " · ")
        .replace("\\pi", "π")
        .replace("\\theta", "θ")
}

private fun buildKatexHtml(
    givenTitle: String,
    given: String,
    formulaTitle: String,
    formula: String,
    solutionTitle: String,
    steps: List<String>,
    answerTitle: String,
    finalAnswer: String,
    tipTitle: String,
    keyNote: String,
    textColorHex: String,
    accentHex: String,
    goldHex: String
): String {
    val stepsHtml = steps.mapIndexed { idx, step ->
        "<li><span class='step-num'>${idx + 1}.</span> ${escapeHtml(step)}</li>"
    }.joinToString("")

    val tipHtml = if (keyNote.isNotBlank()) {
        "<div class='sec'><div class='lbl'>$tipTitle</div><div class='body'>${escapeHtml(keyNote)}</div></div>"
    } else ""

    return """
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
          <style>
            body { margin: 0; padding: 0; font-family: sans-serif; color: $textColorHex; font-size: 14px; line-height: 1.55; background: transparent; }
            .sec { margin-bottom: 10px; }
            .lbl { font-size: 12px; font-weight: 700; color: $accentHex; margin-bottom: 3px; }
            .lbl-gold { color: $goldHex; }
            .body { word-wrap: break-word; }
            .formula-box { padding: 8px 10px; border-radius: 8px; background: rgba(0,212,255,0.08); border: 1px solid rgba(0,212,255,0.25); }
            .ans-box { padding: 8px 10px; border-radius: 8px; background: rgba(255,212,38,0.10); border: 1px solid rgba(255,212,38,0.35); font-weight: 600; }
            ol, ul { margin: 4px 0 0 0; padding-left: 0; list-style: none; }
            li { margin-bottom: 6px; }
            .step-num { font-weight: 700; color: $accentHex; }
            .katex-display { margin: 6px 0; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="sec"><div class="lbl">$givenTitle</div><div class="body">${escapeHtml(given)}</div></div>
          <div class="sec"><div class="lbl">$formulaTitle</div><div class="body formula-box">${escapeHtml(formula)}</div></div>
          <div class="sec"><div class="lbl">$solutionTitle</div><ul>$stepsHtml</ul></div>
          <div class="sec"><div class="lbl lbl-gold">$answerTitle</div><div class="body ans-box">${escapeHtml(finalAnswer)}</div></div>
          $tipHtml
          <script>
            document.addEventListener("DOMContentLoaded", function() {
              if (typeof renderMathInElement === "function") {
                renderMathInElement(document.body, {
                  delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                  ],
                  throwOnError: false
                });
              }
            });
          </script>
        </body>
        </html>
    """.trimIndent()
}
