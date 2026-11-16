import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { generateDiversifiedChapterQuestions } from "./serverQuestionBank";

dotenv.config();

const PORT = 3000;
const WORKSPACE_ROOT = process.cwd();

interface StructuredTutorSolution {
  given: string;
  formula: string;
  steps: string[];
  finalAnswer: string;
  keyNote: string;
}

function cleanPlainMarkdownArtifacts(input: string): string {
  return (input || "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/```[a-zA-Z]*\n?/g, "")
    .replace(/```/g, "")
    .trim();
}

function extractJsonObjectText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return fenced[1].trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && typeof err === "object" && "type" in err && (err as { type?: string }).type === "entity.parse.failed") {
      res.status(400).json({ error: "Invalid request payload." });
      return;
    }
    next(err);
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Real Gemini AI Study Tutor endpoint (shared by Web & Android app)
  app.post("/api/ai/tutor", async (req, res) => {
    try {
      const customKeyHeader = req.headers["x-gemini-api-key"];
      const customKeyBody = req.body?.customApiKey;
      const apiKey =
        typeof customKeyHeader === "string" && customKeyHeader.trim().length > 5
          ? customKeyHeader.trim()
          : typeof customKeyBody === "string" && customKeyBody.trim().length > 5
          ? customKeyBody.trim()
          : process.env.GEMINI_API_KEY;

      const {
        question,
        subject = "PHYSICS",
        language = "en",
        mode = "step_by_step",
        level = "JEE_MAIN",
      } = req.body ?? {};

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        res.status(401).json({
          error:
            language === "hi"
              ? "कृपया सेटिंग्स में अपनी Gemini API Key दर्ज करें ताकि AI ट्यूटर काम कर सके।"
              : "Please enter your Gemini API Key in Settings to use the AI Study Tutor.",
        });
        return;
      }

      if (!question || typeof question !== "string" || !question.trim()) {
        res.status(400).json({ error: "Please enter a valid study question." });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const isHindi = language === "hi";
      const langInstruction = isHindi
        ? "Write all explanations and words in simple, clear student-friendly Hindi (Devanagari script). Keep scientific symbols, SI units, and mathematical variables in standard notation."
        : "Write all explanations in simple, clear, student-friendly English.";

      const levelMap: Record<string, string> = {
        CLASS_9: "Class 9 NCERT / Board Foundation level",
        CLASS_10_BOARD: "Class 10 Board Exam (CBSE / State Board NCERT) level with full board step-marking clarity",
        CLASS_11: "Class 11 NCERT / School Exam level",
        CLASS_12_BOARD: "Class 12 Board Exam (CBSE / State Board NCERT) level with neat derivations and board step-marking",
        NCERT: "NCERT Class 11 & 12 Board level",
        JEE_MAIN: "JEE Main competitive exam level",
        JEE_ADVANCED: "JEE Advanced high-rigor competitive level",
        NEET: "NEET UG medical entrance exam level (NCERT-focused + fast numerical accuracy)",
        CUET_NDA: "CUET / NDA entrance exam level",
      };
      const levelLabel = levelMap[String(level)] ?? "JEE Main & Class 12 Board level";

      const modeInstruction =
        mode === "numerical"
          ? "Break down every substitution, unit conversion, and arithmetic calculation clearly."
          : mode === "concept"
          ? "Focus on intuitive conceptual understanding along with key formulas and an illustrative example."
          : mode === "doubt"
          ? "Directly resolve the student's conceptual doubt and explain why common mistakes happen."
          : "Provide a complete, easy-to-follow step-by-step solution.";

      const subjectInstruction =
        subject === "CHEMISTRY"
          ? "For Chemistry, write balanced chemical equations and reactions cleanly inside $...$ or $$...$$ using \\rightarrow or \\rightleftharpoons, state reaction conditions, and show mole/thermodynamic steps clearly."
          : subject === "MATHEMATICS"
          ? "For Mathematics, write fractions (\\frac{a}{b}), integrals (\\int), derivatives (\\frac{d}{dx}), limits, vectors, and matrices (\\begin{pmatrix}...\\end{pmatrix}) cleanly inside $...$ or $$...$$."
          : "For Physics, always state physical quantities with proper SI units, signs/directions, vector formulas, and step-by-step numerical values inside $...$ or $$...$$.";

      const wantsCode = /\b(code|program|python|java|kotlin|c\+\+|javascript|algorithm)\b/i.test(
        question
      );

      const systemInstruction = [
        `You are a warm, expert Indian science & mathematics tutor teaching ${subject} at ${levelLabel}.`,
        langInstruction,
        modeInstruction,
        subjectInstruction,
        "FORMAT RULES (CRITICAL):",
        "- Return JSON matching the required schema.",
        "- NEVER output Markdown symbols like **, ##, *, or code fences inside text fields.",
        "- Wrap inline math expressions, units, and chemical formulas in single dollar signs like $F = ma$ or $\\text{H}_2\\text{SO}_4$.",
        "- Wrap standalone equations or multi-line calculations in double dollar signs like $$R = \\frac{u^2 \\sin(2\\theta)}{g}$$.",
        wantsCode
          ? "- Only include brief clean code if the student explicitly asked for programming code."
          : "- Do NOT output any programming syntax or computer code.",
        "- Every step in the steps array must be one clear, easy-to-read step explaining the calculation.",
      ].join(" ");

      let rawText = "";
      let lastErr: unknown = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const useSchema = attempt < 2;
          const targetModel = attempt === 2 ? "gemini-4-hydrogen" : "gemini-3.1-flash-lite";
          const response = await ai.models.generateContent({
            model: targetModel,
            contents: question.trim(),
            config: {
              systemInstruction: useSchema
                ? systemInstruction
                : `${systemInstruction} Return a valid JSON object with exact keys: "given" (string), "formula" (string), "steps" (string array), "finalAnswer" (string), "keyNote" (string).`,
              responseMimeType: "application/json",
              ...(useSchema
                ? {
                    responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                        given: {
                          type: Type.STRING,
                          description:
                            "What is given in the problem or the core topic being asked. Use $...$ for math/units.",
                        },
                        formula: {
                          type: Type.STRING,
                          description:
                            "The formula(s), law(s), or chemical equation(s) used, wrapped in $$...$$ or $...$.",
                        },
                        steps: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description:
                            "Clear numbered calculation or reasoning steps in simple student-friendly language.",
                        },
                        finalAnswer: {
                          type: Type.STRING,
                          description:
                            "The exact final answer with units or final conclusion clearly stated.",
                        },
                        keyNote: {
                          type: Type.STRING,
                          description:
                            "A short 1-sentence exam tip or reminder for the student.",
                        },
                      },
                      required: ["given", "formula", "steps", "finalAnswer"],
                    },
                  }
                : {}),
            },
          });
          rawText = (response.text ?? "").trim();
          if (rawText) break;
        } catch (attemptErr) {
          lastErr = attemptErr;
          const msg = attemptErr instanceof Error ? attemptErr.message : String(attemptErr);
          console.warn(`[AI Tutor Attempt ${attempt + 1}]`, msg);
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, attempt === 0 ? 500 : 1200));
          }
        }
      }

      if (!rawText) {
        if (lastErr) throw lastErr;
        res.status(502).json({
          error: "AI Tutor is temporarily unavailable. Please try again.",
        });
        return;
      }

      let parsed: StructuredTutorSolution;
      try {
        const json = JSON.parse(extractJsonObjectText(rawText)) as Partial<StructuredTutorSolution>;
        parsed = {
          given: cleanPlainMarkdownArtifacts(json.given ?? ""),
          formula: cleanPlainMarkdownArtifacts(json.formula ?? ""),
          steps: Array.isArray(json.steps)
            ? json.steps.map((s) => cleanPlainMarkdownArtifacts(String(s))).filter(Boolean)
            : [],
          finalAnswer: cleanPlainMarkdownArtifacts(json.finalAnswer ?? ""),
          keyNote: cleanPlainMarkdownArtifacts(json.keyNote ?? ""),
        };
      } catch {
        res.status(502).json({
          error: "AI Tutor is temporarily unavailable. Please try again.",
        });
        return;
      }

      const readableText = isHindi
        ? [
            `प्रश्न में दिया गया: ${parsed.given}`,
            `इस्तेमाल किया गया सूत्र: ${parsed.formula}`,
            `हल:\n${parsed.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
            `अंतिम उत्तर: ${parsed.finalAnswer}`,
            parsed.keyNote ? `मुख्य टिप: ${parsed.keyNote}` : "",
          ]
            .filter(Boolean)
            .join("\n\n")
        : [
            `Given: ${parsed.given}`,
            `Formula: ${parsed.formula}`,
            `Step-by-Step Solution:\n${parsed.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
            `Final Answer: ${parsed.finalAnswer}`,
            parsed.keyNote ? `Key Tip: ${parsed.keyNote}` : "",
          ]
            .filter(Boolean)
            .join("\n\n");

      res.json({
        answer: readableText,
        structured: parsed,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[AI Tutor Error]", msg);
      const isRateLimit = /429|RESOURCE_EXHAUSTED|quota/i.test(msg);
      res.status(isRateLimit ? 429 : 500).json({
        error: isRateLimit
          ? "AI Tutor is busy right now. Please wait a few seconds and try again."
          : "AI Tutor is temporarily unavailable. Please try again.",
      });
    }
  });

  // AI Daily 50 Chapter Questions generator (tailored to selected exam track + chapter name)
  app.post("/api/ai/chapter-questions", async (req, res) => {
    try {
      const customKeyHeader = req.headers["x-gemini-api-key"];
      const customKeyBody = req.body?.customApiKey;
      const apiKey =
        typeof customKeyHeader === "string" && customKeyHeader.trim().length > 5
          ? customKeyHeader.trim()
          : typeof customKeyBody === "string" && customKeyBody.trim().length > 5
          ? customKeyBody.trim()
          : process.env.GEMINI_API_KEY;

      const {
        chapterName,
        subject = "PHYSICS",
        track = "CLASS_12_BOARD",
        language = "en",
      } = req.body ?? {};

      if (!chapterName || typeof chapterName !== "string" || chapterName.trim().length < 2) {
        res.status(400).json({ error: "Please enter a valid chapter name." });
        return;
      }

      const cleanChapter = chapterName.trim().slice(0, 140);
      const safeSubject = ["PHYSICS", "CHEMISTRY", "MATHEMATICS"].includes(String(subject))
        ? String(subject)
        : "PHYSICS";
      const safeTrack = String(track || "CLASS_12_BOARD");
      const isHindi = language === "hi";

      const trackDescriptions: Record<string, string> = {
        CLASS_9: "Class 9 NCERT / School & Foundation level",
        CLASS_10_BOARD: "Class 10 Board Exam (CBSE & State Board NCERT) level",
        CLASS_11: "Class 11 NCERT / School & Foundation level",
        CLASS_12_BOARD: "Class 12 Board Exam (CBSE & State Board NCERT) level",
        JEE_MAIN: "JEE Main competitive engineering entrance exam level",
        JEE_ADVANCED: "JEE Advanced high-rigor IIT entrance exam level",
        NEET: "NEET UG medical entrance exam level (NCERT-focused + fast numericals)",
        CUET_NDA: "CUET / NDA competitive entrance exam level",
      };
      const trackDesc = trackDescriptions[safeTrack] ?? "Class 12 Board & JEE Main level";

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      interface RawGeneratedMcq {
        prompt?: string;
        options?: unknown[];
        correctOptionIndex?: number;
        explanation?: string;
        difficulty?: string;
      }

      const fetchBatch = async (
        count: number,
        focusDescription: string,
        avoidPrompts: string[] = []
      ) => {
        const langInstr = isHindi
          ? "Write every question, option, and short explanation in simple, clear student-friendly Hindi (Devanagari script). Keep math formulas, units, and chemical symbols in standard notation wrapped inside $...$."
          : "Write every question, option, and short explanation in clear, student-friendly English. Wrap math formulas, units, and chemical equations inside $...$.";

        const avoidNote =
          avoidPrompts.length > 0
            ? `Do NOT repeat any of these existing questions: ${avoidPrompts.slice(0, 20).join(" | ")}`
            : "";

        const systemInstruction = [
          `You are an expert Indian ${safeSubject} exam question setter creating ${count} completely unique, high-quality multiple-choice practice questions for chapter "${cleanChapter}" strictly tailored to ${trackDesc}.`,
          langInstr,
          `Focus of this set: ${focusDescription}.`,
          avoidNote,
          "STRICT DIVERSITY & QUALITY RULES:",
          `- Return a JSON array of exactly ${count} completely DIFFERENT multiple-choice questions.`,
          "- NEVER repeat or copy questions, formulas, or numbers. Every question must test a different problem or principle.",
          "- Each object MUST contain: 'prompt', 'options' (array of 4 distinct plausible options), 'correctOptionIndex' (an integer 0, 1, 2, or 3), 'explanation' (1-2 sentence solution with step-by-step reasoning and formulas in $...$), and 'difficulty' ('Easy', 'Medium', or 'Hard').",
          "- CRITICAL: Do NOT make all answers option D or option A. Balance and randomize correctOptionIndex across 0 (A), 1 (B), 2 (C), and 3 (D).",
          "- Use $...$ KaTeX math formatting for equations, variables, and SI units.",
          "- NEVER output markdown code fences, ** or ##.",
        ]
          .filter(Boolean)
          .join(" ");

        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const targetModel = attempt === 1 ? "gemini-4-hydrogen" : "gemini-3.1-flash-lite";
            const response = await ai.models.generateContent({
              model: targetModel,
              contents: `Generate ${count} distinct ${trackDesc} ${safeSubject} MCQs for chapter "${cleanChapter}".`,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      prompt: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      correctOptionIndex: { type: Type.INTEGER },
                      explanation: { type: Type.STRING },
                      difficulty: { type: Type.STRING },
                    },
                    required: ["prompt", "options", "correctOptionIndex", "explanation", "difficulty"],
                  },
                },
              },
            });
            const raw = (response.text ?? "").trim();
            if (!raw) continue;
            const trimmed = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
            const firstBracket = trimmed.indexOf("[");
            const lastBracket = trimmed.lastIndexOf("]");
            const jsonSlice =
              firstBracket !== -1 && lastBracket > firstBracket
                ? trimmed.slice(firstBracket, lastBracket + 1)
                : trimmed;
            const parsed = JSON.parse(jsonSlice) as RawGeneratedMcq[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed;
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(`[AI Chapter Questions Attempt ${attempt + 1}]`, msg);
            if (attempt === 0) await new Promise((r) => setTimeout(r, 400));
          }
        }
        return [] as RawGeneratedMcq[];
      };

      // Run 3 diverse batches in parallel (18 Easy/Med concepts + 18 Med numericals + 14 Hard traps = 50 total)
      const validPool: Array<{
        prompt: string;
        options: string[];
        correctOptionIndex: number;
        explanation: string;
        difficulty: "Easy" | "Medium" | "Hard";
      }> = [];

      try {
        const [batchA, batchB, batchC] = await Promise.all([
          fetchBatch(
            18,
            "Core definitions, fundamental scientific laws, SI units, dimensions, and NCERT basic concepts (mostly Easy and Medium)"
          ),
          fetchBatch(
            18,
            "Numerical problem solving, direct formula calculations, parameter substitutions, and numerical problems (mostly Medium)"
          ),
          fetchBatch(
            14,
            "Multi-concept synthesis, graphical analysis, exam traps, and assertion-reasoning problems (mostly Medium and Hard)"
          ),
        ]);

        const seen = new Set<string>();
        const normalizeAndPush = (items: RawGeneratedMcq[]) => {
          for (const item of items) {
            if (!item || typeof item.prompt !== "string" || !Array.isArray(item.options)) continue;
            const prompt = cleanPlainMarkdownArtifacts(item.prompt);
            const options = item.options.map((o) => cleanPlainMarkdownArtifacts(String(o ?? ""))).filter(Boolean);
            if (!prompt || options.length < 4) continue;
            const key = prompt.toLowerCase().replace(/\s+/g, " ").trim();
            if (seen.has(key)) continue;
            seen.add(key);
            const idx =
              typeof item.correctOptionIndex === "number" &&
              Number.isInteger(item.correctOptionIndex) &&
              item.correctOptionIndex >= 0 &&
              item.correctOptionIndex < 4
                ? item.correctOptionIndex
                : 0;
            const diff =
              item.difficulty === "Easy" || item.difficulty === "Hard" ? item.difficulty : "Medium";
            validPool.push({
              prompt,
              options: options.slice(0, 4),
              correctOptionIndex: idx,
              explanation: cleanPlainMarkdownArtifacts(String(item.explanation ?? "")),
              difficulty: diff,
            });
            if (validPool.length >= 50) break;
          }
        };

        normalizeAndPush(batchA);
        normalizeAndPush(batchB);
        normalizeAndPush(batchC);

        if (validPool.length > 0 && validPool.length < 50) {
          const needed = 50 - validPool.length;
          const extra = await fetchBatch(
            needed,
            "Additional distinct numerical and conceptual exam questions to complete the 50-question daily drill",
            validPool.map((q) => q.prompt)
          );
          normalizeAndPush(extra);
        }
      } catch (err) {
        console.warn("[AI Chapter Questions Quota Fallback]", err instanceof Error ? err.message : err);
      }

      // If pool has fewer than 50 questions, complete with diversified subject-specific questions
      if (validPool.length < 50) {
        const needed = 50 - validPool.length;
        const fallbacks = generateDiversifiedChapterQuestions(
          cleanChapter,
          safeSubject,
          safeTrack,
          isHindi,
          needed
        );
        for (const fb of fallbacks) {
          validPool.push(fb);
          if (validPool.length >= 50) break;
        }
      }

      const dateIso = new Date().toISOString().slice(0, 10);
      const slug = cleanChapter.toLowerCase().replace(/[^a-z0-9\u0900-\u097f]+/g, "_").slice(0, 40) || "chapter";
      const setId = `${dateIso}__${safeTrack}__${safeSubject}__${slug}`;

      const questions = validPool.slice(0, 50).map((q, index) => ({
        id: `${setId}_q${index + 1}`,
        subject: safeSubject,
        chapterId: setId,
        track: safeTrack,
        originLabel: "Sample Practice" as const,
        prompt: q.prompt,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        difficulty: q.difficulty,
      }));

      res.json({
        set: {
          id: setId,
          dateIso,
          track: safeTrack,
          subject: safeSubject,
          chapterName: cleanChapter,
          language: isHindi ? "hi" : "en",
          questions,
          createdAt: Date.now(),
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[AI Chapter Questions Error]", msg);
      const isRateLimit = /429|RESOURCE_EXHAUSTED|quota/i.test(msg);
      res.status(isRateLimit ? 429 : 500).json({
        error: isRateLimit
          ? "AI generator is busy right now. Please wait a few seconds and try again."
          : "AI Question Generator is temporarily unavailable. Please try again.",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(WORKSPACE_ROOT, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JEE AI Study Guardian server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
