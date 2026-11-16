import React, { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck, Check, Copy, Send, Sparkles, Trash2, User } from 'lucide-react';
import { STUDY_LEVEL_OPTIONS } from '../data/jeeCatalog';
import { ChatMessage, LanguageMode, StudyLevel, Subject } from '../types';
import { MathText, StructuredSolutionView } from './MathRenderer';

interface AiTutorTabProps {
  language: LanguageMode;
  defaultLevel: StudyLevel;
  defaultSubject: Subject;
  chatHistory: ChatMessage[];
  customApiKey?: string;
  onAddChatMessages: (userMsg: ChatMessage, assistantMsg?: ChatMessage) => void;
  onToggleSaveAnswer: (id: string) => void;
  onClearHistory: () => void;
}

const MODES = [
  { id: 'step_by_step', en: 'Step-by-Step', hi: 'चरण-दर-चरण' },
  { id: 'numerical', en: 'Numerical Solver', hi: 'संख्यात्मक हल' },
  { id: 'concept', en: 'Concept Clarity', hi: 'कॉन्सेप्ट समझ' },
  { id: 'doubt', en: 'Doubt Clearing', hi: 'शंका समाधान' },
];

const QUICK_PROMPTS: Record<Subject, { en: string; hi: string }[]> = {
  PHYSICS: [
    {
      en: 'A stone is thrown vertically upwards with a velocity of 20 m/s. Find the maximum height reached and total time of flight (g = 10 m/s^2).',
      hi: 'एक पत्थर को 20 m/s के वेग से ऊपर की ओर फेंका जाता है। अधिकतम ऊँचाई और कुल उड्डयन काल ज्ञात करें (g = 10 m/s^2)।',
    },
    {
      en: 'Derive the acceleration of a solid cylinder rolling without slipping down an inclined plane of angle 30 degrees.',
      hi: '30 डिग्री झुकाव वाले आनत तल पर बिना फिसले लुढ़कते हुए ठोस बेलन का त्वरण ज्ञात करें।',
    },
  ],
  CHEMISTRY: [
    {
      en: 'Calculate the pH of a buffer solution containing 0.1 M CH3COOH (pKa = 4.76) and 0.2 M CH3COONa.',
      hi: '0.1 M CH3COOH (pKa = 4.76) और 0.2 M CH3COONa वाले बफर विलयन का pH ज्ञात करें।',
    },
    {
      en: 'Write the balanced chemical equation for the thermal decomposition of ferrous sulphate and state its type of reaction.',
      hi: 'फेरस सल्फेट के ऊष्मीय अपघटन की संतुलित रासायनिक अभिक्रिया लिखिए और अभिक्रिया का प्रकार बताइए।',
    },
  ],
  MATHEMATICS: [
    {
      en: 'Evaluate the definite integral from 0 to pi/2 of sqrt(sin x) / (sqrt(sin x) + sqrt(cos x)) dx.',
      hi: 'समाकलन (0 से pi/2) sqrt(sin x) / (sqrt(sin x) + sqrt(cos x)) dx का मान ज्ञात करें।',
    },
    {
      en: 'Solve the quadratic equation 2x^2 - 7x + 3 = 0 using the quadratic formula.',
      hi: 'द्विघात सूत्र का उपयोग करके समीकरण 2x^2 - 7x + 3 = 0 को हल करें।',
    },
  ],
};

export function AiTutorTab({
  language,
  defaultLevel,
  defaultSubject,
  chatHistory,
  customApiKey,
  onAddChatMessages,
  onToggleSaveAnswer,
  onClearHistory,
}: AiTutorTabProps) {
  const [subject, setSubject] = useState<Subject>(defaultSubject);
  const [level, setLevel] = useState<StudyLevel>(defaultLevel);
  const [mode, setMode] = useState<string>('step_by_step');
  const [replyLanguage, setReplyLanguage] = useState<LanguageMode>(language);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setReplyLanguage(language);
  }, [language]);

  useEffect(() => {
    setLevel(defaultLevel);
  }, [defaultLevel]);

  useEffect(() => {
    setSubject(defaultSubject);
  }, [defaultSubject]);

  const isUiHindi = replyLanguage === 'hi';

  const handleSend = async (customPrompt?: string) => {
    const promptText = (customPrompt ?? question).trim();
    if (!promptText || isLoading) return;

    setErrorMessage(null);
    setIsLoading(true);
    if (!customPrompt) setQuestion('');

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      subject,
      language: replyLanguage,
      level,
      content: promptText,
      saved: false,
      timestamp: Date.now(),
    };

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'X-Gemini-Api-Key': customApiKey } : {}),
        },
        body: JSON.stringify({
          question: promptText,
          subject,
          language: replyLanguage,
          mode,
          level,
          customApiKey,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.answer) {
        onAddChatMessages(userMsg);
        setErrorMessage(
          res.status === 429
            ? isUiHindi
              ? 'AI ट्यूटर अभी व्यस्त है। कृपया कुछ सेकंड प्रतीक्षा करें और पुनः प्रयास करें।'
              : 'AI Tutor is busy right now. Please wait a few seconds and try again.'
            : isUiHindi
            ? 'AI ट्यूटर अभी उत्तर देने में असमर्थ है। कृपया कुछ क्षण बाद पुनः प्रयास करें।'
            : 'AI Tutor is temporarily unavailable. Please try again shortly.'
        );
      } else {
        const rawStructured = data.structured;
        const safeStructured =
          rawStructured && typeof rawStructured === 'object'
            ? {
                given: typeof rawStructured.given === 'string' ? rawStructured.given : '',
                formula: typeof rawStructured.formula === 'string' ? rawStructured.formula : '',
                steps: Array.isArray(rawStructured.steps)
                  ? rawStructured.steps.map((s: unknown) => String(s ?? '')).filter(Boolean)
                  : [],
                finalAnswer: typeof rawStructured.finalAnswer === 'string' ? rawStructured.finalAnswer : '',
                keyNote: typeof rawStructured.keyNote === 'string' ? rawStructured.keyNote : undefined,
              }
            : undefined;
        const assistantMsg: ChatMessage = {
          id: `a_${Date.now() + 1}`,
          role: 'assistant',
          subject,
          language: replyLanguage,
          level,
          content: String(data.answer),
          structured: safeStructured,
          saved: false,
          timestamp: Date.now() + 1,
        };
        onAddChatMessages(userMsg, assistantMsg);
      }
    } catch {
      onAddChatMessages(userMsg);
      setErrorMessage(
        isUiHindi
          ? 'इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।'
          : 'Internet connection unavailable. Please check your network and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (id: string, content: string) => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const levelLabelFor = (lvl?: StudyLevel) => {
    const found = STUDY_LEVEL_OPTIONS.find((o) => o.id === lvl);
    return found ? (isUiHindi ? found.hi : found.en) : 'JEE Main';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Configuration Deck */}
      <aside className="lg:col-span-4 space-y-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] p-5 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isUiHindi ? 'AI स्टडी ट्यूटर' : 'AI Study Tutor'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isUiHindi
                ? 'कक्षा 9–12 बोर्ड, NCERT, JEE, NEET और CUET के लिए सरल चरण-दर-चरण समाधान।'
                : 'Clear step-by-step solutions with neat equations for Boards, NCERT, JEE, NEET & CUET.'}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {isUiHindi ? 'विषय (Subject)' : 'Subject'}
            </p>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#06102B]">
              {(['PHYSICS', 'CHEMISTRY', 'MATHEMATICS'] as Subject[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`min-h-[40px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    subject === s
                      ? 'bg-white dark:bg-cyan-500 text-slate-900 dark:text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {s === 'PHYSICS'
                    ? isUiHindi
                      ? 'भौतिक'
                      : 'Physics'
                    : s === 'CHEMISTRY'
                    ? isUiHindi
                      ? 'रसायन'
                      : 'Chemistry'
                    : isUiHindi
                    ? 'गणित'
                    : 'Maths'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {isUiHindi ? 'कक्षा / परीक्षा स्तर (Class & Exam)' : 'Class Board / Exam Level'}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {STUDY_LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setLevel(opt.id)}
                  className={`min-h-[38px] px-2.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap truncate ${
                    level === opt.id
                      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {isUiHindi ? opt.hi : opt.en}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {isUiHindi ? 'समझाने का तरीका' : 'Explanation Style'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                    mode === m.id
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {isUiHindi ? m.hi : m.en}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {isUiHindi ? 'उत्तर की भाषा' : 'Answer Language'}
            </p>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#06102B]">
              <button
                onClick={() => setReplyLanguage('en')}
                className={`min-h-[40px] rounded-lg text-xs font-semibold ${
                  replyLanguage === 'en' ? 'bg-white dark:bg-amber-400 text-slate-950' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setReplyLanguage('hi')}
                className={`min-h-[40px] rounded-lg text-xs font-semibold ${
                  replyLanguage === 'hi' ? 'bg-white dark:bg-amber-400 text-slate-950' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                हिन्दी (Hindi)
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {isUiHindi ? 'उदाहरण प्रश्न' : 'Try Sample Questions'}
            </p>
            <div className="space-y-2">
              {QUICK_PROMPTS[subject].map((sample, idx) => {
                const text = isUiHindi ? sample.hi : sample.en;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(text)}
                    disabled={isLoading}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 text-xs text-slate-700 dark:text-slate-300 transition-colors leading-relaxed"
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* Right Chat Stream */}
      <section className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] flex flex-col min-h-[580px]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isUiHindi ? 'अध्ययन प्रश्न सत्र' : 'Study Doubt Session'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {chatHistory.length} {isUiHindi ? 'संदेश' : 'messages'}
              <span aria-hidden="true"> · </span>
              {chatHistory.filter((m) => m.saved).length} {isUiHindi ? 'सहेजे गए' : 'saved'}
            </p>
          </div>
          {chatHistory.length > 0 && (
            <button
              onClick={onClearHistory}
              className="min-h-[40px] px-3 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isUiHindi ? 'चैट साफ़ करें' : 'Clear History'}</span>
            </button>
          )}
        </div>

        <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[600px]">
          {chatHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-2">
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                {isUiHindi
                  ? 'Physics, Chemistry या Mathematics का कोई भी प्रश्न पूछें'
                  : 'Ask any Physics, Chemistry, or Mathematics question'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                {isUiHindi
                  ? 'दिए गए मान, सूत्र, आसान चरण-दर-चरण हल और अंतिम उत्तर के साथ साफ़ गणितीय समीकरण पाएं।'
                  : 'Get clean equations formatted into Given, Formula, Step-by-Step Solution, and Final Answer.'}
              </p>
            </div>
          )}

          {chatHistory.map((msg) => {
            const isAssistant = msg.role === 'assistant';
            const subjectLabel =
              msg.subject === 'PHYSICS'
                ? isUiHindi
                  ? 'भौतिक विज्ञान'
                  : 'Physics'
                : msg.subject === 'CHEMISTRY'
                ? isUiHindi
                  ? 'रसायन विज्ञान'
                  : 'Chemistry'
                : isUiHindi
                ? 'गणित'
                : 'Mathematics';

            return (
              <div
                key={msg.id}
                className={`rounded-2xl border shadow-sm transition-colors ${
                  isAssistant
                    ? 'bg-white dark:bg-[#0D1C47] border-cyan-500/35 mr-1 sm:mr-6 overflow-hidden'
                    : 'bg-slate-50 dark:bg-[#06102B] border-slate-200 dark:border-slate-800 ml-4 sm:ml-10 p-4'
                }`}
              >
                {isAssistant ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50/90 dark:bg-[#08153B] border-b border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {isUiHindi ? 'AI स्टडी ट्यूटर' : 'AI Study Tutor'}
                          </p>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                            {subjectLabel} · {levelLabelFor(msg.level)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="min-h-[34px] px-2.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 inline-flex items-center gap-1"
                          title="Copy answer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {copiedId === msg.id ? (isUiHindi ? 'कॉपी हुआ' : 'Copied') : isUiHindi ? 'कॉपी' : 'Copy'}
                          </span>
                        </button>
                        <button
                          onClick={() => onToggleSaveAnswer(msg.id)}
                          className="min-h-[34px] px-2.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 inline-flex items-center gap-1"
                          title="Save answer"
                        >
                          {msg.saved ? (
                            <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                          <span>{msg.saved ? (isUiHindi ? 'सहेजा गया' : 'Saved') : isUiHindi ? 'सहेजें' : 'Save'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <StructuredSolutionView
                        structured={msg.structured}
                        fallbackText={msg.content}
                        language={msg.language}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <User className="w-3.5 h-3.5 text-cyan-500" />
                      <span>{isUiHindi ? 'आपका प्रश्न' : 'Your Question'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{subjectLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{levelLabelFor(msg.level)}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                      <MathText text={msg.content} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#06102B] text-sm text-cyan-600 dark:text-cyan-400">
              {isUiHindi ? 'आपके प्रश्न का चरण-दर-चरण हल तैयार किया जा रहा है...' : 'Solving your question step-by-step...'}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-2xl p-4 border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
              {errorMessage}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-end gap-3"
        >
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            placeholder={
              isUiHindi
                ? 'Physics, Chemistry या Mathematics का अपना प्रश्न लिखें...'
                : 'Type your Physics, Chemistry, or Mathematics question...'
            }
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="min-h-[44px] px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-sm inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>{isUiHindi ? 'हल पूछें' : 'Ask Tutor'}</span>
          </button>
        </form>
      </section>
    </div>
  );
}
