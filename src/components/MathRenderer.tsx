import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { CheckCircle2, Compass, FileText, Lightbulb, Sparkles } from 'lucide-react';
import { LanguageMode, StructuredAiAnswer } from '../types';

export function cleanStudentText(input: unknown): string {
  const str = typeof input === 'string' ? input : String(input ?? '');
  return str
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|\s)\*([^*\s][^*]*?)\*(?=\s|[.,;:!?)]|$)/g, '$1$2')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function normalizeChemistryMacros(expr: string): string {
  return expr
    .replace(/\\ce\{([^}]+)\}/g, (_m, inner: string) =>
      inner
        .replace(/<->|<=>/g, '\\rightleftharpoons')
        .replace(/->/g, '\\rightarrow')
        .replace(/([A-Za-z)])(\d+)/g, '$1_{$2}')
    );
}

function normalizeMathDelimiters(raw: string): string {
  return cleanStudentText(raw)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `$$${inner}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => `$${inner}$`);
}

type Segment =
  | { type: 'text'; value: string }
  | { type: 'inline'; value: string }
  | { type: 'block'; value: string };

function tokenizeMath(input: string): Segment[] {
  const normalized = normalizeMathDelimiters(input);
  const regex = /(\$\$[\s\S]+?\$\$|\$(?:\\.|[^$\n])+?\$)/g;
  const segments: Segment[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalized)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ type: 'text', value: normalized.slice(lastIdx, match.index) });
    }
    const token = match[0];
    if (token.startsWith('$$') && token.endsWith('$$')) {
      segments.push({ type: 'block', value: token.slice(2, -2).trim() });
    } else {
      segments.push({ type: 'inline', value: token.slice(1, -1).trim() });
    }
    lastIdx = match.index + token.length;
  }

  if (lastIdx < normalized.length) {
    segments.push({ type: 'text', value: normalized.slice(lastIdx) });
  }

  return segments;
}

function renderKatexHtml(expr: string, displayMode: boolean): string {
  const prepared = normalizeChemistryMacros(expr);
  try {
    return katex.renderToString(prepared, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: 'htmlAndMathml',
    });
  } catch {
    return cleanStudentText(expr);
  }
}

export function MathText({ text, className = '' }: { text: string; className?: string }) {
  const segments = tokenizeMath(text);

  return (
    <span className={`katex-student-scope whitespace-pre-wrap break-words leading-relaxed ${className}`}>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return <React.Fragment key={idx}>{seg.value}</React.Fragment>;
        }
        if (seg.type === 'block') {
          return (
            <span
              key={idx}
              className="block my-2 overflow-x-auto py-1.5 text-center"
              dangerouslySetInnerHTML={{ __html: renderKatexHtml(seg.value, true) }}
            />
          );
        }
        return (
          <span
            key={idx}
            className="inline-block align-middle mx-0.5"
            dangerouslySetInnerHTML={{ __html: renderKatexHtml(seg.value, false) }}
          />
        );
      })}
    </span>
  );
}

function parseFallbackStructuredSolution(rawText: string): StructuredAiAnswer | null {
  const text = cleanStudentText(rawText);
  if (!text) return null;

  // Try parsing JSON if raw JSON string accidentally survived
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const obj = JSON.parse(text) as Partial<StructuredAiAnswer>;
      if (obj && typeof obj === 'object') {
        return {
          given: cleanStudentText(obj.given ?? ''),
          formula: cleanStudentText(obj.formula ?? ''),
          steps: Array.isArray(obj.steps) ? obj.steps.map((s) => cleanStudentText(s)).filter(Boolean) : [],
          finalAnswer: cleanStudentText(obj.finalAnswer ?? ''),
          keyNote: cleanStudentText(obj.keyNote ?? ''),
        };
      }
    } catch {
      // Fall through to section parsing
    }
  }

  const lines = text.split('\n');
  let given = '';
  let formula = '';
  const steps: string[] = [];
  let finalAnswer = '';
  let keyNote = '';
  let activeSection: 'none' | 'given' | 'formula' | 'steps' | 'answer' | 'note' = 'none';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const givenMatch = line.match(/^(?:Given|प्रश्न में दिया गया(?:\s*\(Given\))?)\s*:\s*(.*)$/i);
    if (givenMatch) {
      activeSection = 'given';
      if (givenMatch[1]) given = givenMatch[1];
      continue;
    }

    const formulaMatch = line.match(/^(?:Formula(?:\s*Used)?|इस्तेमाल किया गया सूत्र(?:\s*\(Formula\))?)\s*:\s*(.*)$/i);
    if (formulaMatch) {
      activeSection = 'formula';
      if (formulaMatch[1]) formula = formulaMatch[1];
      continue;
    }

    const stepsMatch = line.match(/^(?:Step-by-Step\s*Solution|Solution|Step-by-step हल(?:\s*\(Solution\))?|हल)\s*:\s*(.*)$/i);
    if (stepsMatch) {
      activeSection = 'steps';
      if (stepsMatch[1]) steps.push(stepsMatch[1].replace(/^\d+[.)]\s*/, ''));
      continue;
    }

    const ansMatch = line.match(/^(?:Final\s*Answer|Answer|अंतिम उत्तर(?:\s*\((?:Final\s*)?Answer\))?)\s*:\s*(.*)$/i);
    if (ansMatch) {
      activeSection = 'answer';
      if (ansMatch[1]) finalAnswer = ansMatch[1];
      continue;
    }

    const noteMatch = line.match(/^(?:Key\s*Tip|Study\s*Tip|मुख्य टिप)\s*:\s*(.*)$/i);
    if (noteMatch) {
      activeSection = 'note';
      if (noteMatch[1]) keyNote = noteMatch[1];
      continue;
    }

    if (activeSection === 'given') given = given ? `${given}\n${line}` : line;
    else if (activeSection === 'formula') formula = formula ? `${formula}\n${line}` : line;
    else if (activeSection === 'steps') steps.push(line.replace(/^\d+[.)]\s*/, ''));
    else if (activeSection === 'answer') finalAnswer = finalAnswer ? `${finalAnswer}\n${line}` : line;
    else if (activeSection === 'note') keyNote = keyNote ? `${keyNote} ${line}` : line;
  }

  if (!given && !formula && steps.length === 0 && !finalAnswer) {
    return null;
  }
  return { given, formula, steps, finalAnswer, keyNote };
}

export function StructuredSolutionView({
  structured,
  fallbackText,
  language,
}: {
  structured?: StructuredAiAnswer;
  fallbackText: string;
  language: LanguageMode;
}) {
  const isHindi = language === 'hi';
  const parsedFallback = !structured ? parseFallbackStructuredSolution(fallbackText) : null;
  const effective = structured ?? parsedFallback;

  const given = typeof effective?.given === 'string' ? cleanStudentText(effective.given) : '';
  const formula = typeof effective?.formula === 'string' ? cleanStudentText(effective.formula) : '';
  const steps = Array.isArray(effective?.steps)
    ? effective.steps.map((s) => cleanStudentText(s)).filter(Boolean)
    : [];
  const finalAnswer = typeof effective?.finalAnswer === 'string' ? cleanStudentText(effective.finalAnswer) : '';
  const keyNote = typeof effective?.keyNote === 'string' ? cleanStudentText(effective.keyNote) : '';

  if (!effective || (!given && !formula && steps.length === 0 && !finalAnswer)) {
    const fallbackLines = cleanStudentText(fallbackText)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    return (
      <div className="katex-student-scope rounded-xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 text-sm text-slate-800 dark:text-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isHindi ? 'सरल हल (Solution)' : 'Solution'}</span>
        </div>
        {fallbackLines.length > 1 ? (
          <div className="space-y-1.5">
            {fallbackLines.map((line, i) => (
              <div key={i}>
                <MathText text={line} className="text-sm block" />
              </div>
            ))}
          </div>
        ) : (
          <MathText text={fallbackText} className="text-sm block" />
        )}
      </div>
    );
  }

  return (
    <div className="katex-student-scope space-y-3 text-sm text-slate-800 dark:text-slate-100">
      {given && (
        <div className="rounded-xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800/90 p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>{isHindi ? 'प्रश्न में दिया गया (Given)' : 'Given'}</span>
          </div>
          <MathText text={given} className="text-sm block" />
        </div>
      )}

      {formula && (
        <div className="rounded-xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-300/80 dark:border-amber-700/50 p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span>{isHindi ? 'इस्तेमाल किया गया सूत्र (Formula)' : 'Formula'}</span>
          </div>
          <MathText text={formula} className="text-sm block font-medium" />
        </div>
      )}

      {steps.length > 0 && (
        <div className="rounded-xl bg-slate-50 dark:bg-[#06102B] border border-slate-200 dark:border-slate-800/90 p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span>{isHindi ? 'Step-by-step हल (Solution)' : 'Solution'}</span>
          </div>
          <ol className="space-y-2.5">
            {steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="mt-0.5 h-5 w-5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <MathText text={step} className="text-sm block" />
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {finalAnswer && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300/80 dark:border-emerald-700/50 p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{isHindi ? 'अंतिम उत्तर (Answer)' : 'Answer'}</span>
          </div>
          <MathText text={finalAnswer} className="text-sm font-semibold block" />
        </div>
      )}

      {keyNote && (
        <div className="rounded-xl bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-bold text-cyan-700 dark:text-cyan-400">
              {isHindi ? 'मुख्य टिप: ' : 'Key Tip: '}
            </span>
            <MathText text={keyNote} />
          </div>
        </div>
      )}
    </div>
  );
}

