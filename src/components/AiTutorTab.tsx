import React, { useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Camera,
  Check,
  Copy,
  ImagePlus,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Square,
  Trash2,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { STUDY_LEVEL_OPTIONS } from '../data/jeeCatalog';
import { ChatMessage, LanguageMode, StructuredAiAnswer, StudyLevel, Subject } from '../types';
import { safeParseJsonResponse } from '../utils/localStorageState';
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

interface PendingImageAttachment {
  dataUrl: string;
  base64: string;
  mimeType: string;
  fileName: string;
  sizeKb: number;
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
}

interface SpeechRecognitionEventLike {
  resultIndex?: number;
  results: ArrayLike<{
    isFinal?: boolean;
    0?: { transcript?: string };
  }>;
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

function cleanMathForSpeech(raw: string): string {
  return (raw || '')
    .replace(/\$\$/g, ' ')
    .replace(/\$/g, ' ')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1 divided by $2')
    .replace(/\\sqrt\{([^}]*)\}/g, 'square root of $1')
    .replace(/\\rightarrow/g, 'gives')
    .replace(/\\rightleftharpoons/g, 'is in equilibrium with')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\cdot|\\times/g, ' times ')
    .replace(/\\pi/g, 'pi')
    .replace(/\\theta/g, 'theta')
    .replace(/\^2/g, ' squared')
    .replace(/\^3/g, ' cubed')
    .replace(/[{}^_\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSpeechSummary(msg: ChatMessage): string {
  const isHi = msg.language === 'hi';
  if (msg.structured) {
    const parts = [
      msg.structured.given
        ? `${isHi ? 'प्रश्न में दिया गया' : 'Given'}: ${cleanMathForSpeech(msg.structured.given)}`
        : '',
      msg.structured.formula
        ? `${isHi ? 'सूत्र' : 'Formula'}: ${cleanMathForSpeech(msg.structured.formula)}`
        : '',
      msg.structured.steps.length > 0
        ? `${isHi ? 'हल के चरण' : 'Steps'}: ${msg.structured.steps.map(cleanMathForSpeech).join('. ')}`
        : '',
      msg.structured.finalAnswer
        ? `${isHi ? 'अंतिम उत्तर' : 'Final Answer'}: ${cleanMathForSpeech(msg.structured.finalAnswer)}`
        : '',
    ].filter(Boolean);
    if (parts.length > 0) return parts.join('. ');
  }
  return cleanMathForSpeech(msg.content);
}

function compressImageFile(file: File): Promise<PendingImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected image file.'));
    reader.onload = () => {
      const originalDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!originalDataUrl) {
        reject(new Error('Empty image data.'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Selected file is not a valid image.'));
      img.onload = () => {
        try {
          const maxDim = 1080;
          let targetW = img.naturalWidth || img.width || 800;
          let targetH = img.naturalHeight || img.height || 600;
          if (targetW > maxDim || targetH > maxDim) {
            if (targetW >= targetH) {
              targetH = Math.round((targetH * maxDim) / targetW);
              targetW = maxDim;
            } else {
              targetW = Math.round((targetW * maxDim) / targetH);
              targetH = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, targetW);
          canvas.height = Math.max(1, targetH);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            const commaIdx = originalDataUrl.indexOf(',');
            const base64Only = commaIdx !== -1 ? originalDataUrl.slice(commaIdx + 1) : originalDataUrl;
            resolve({
              dataUrl: originalDataUrl,
              base64: base64Only,
              mimeType: file.type || 'image/jpeg',
              fileName: file.name || 'question.jpg',
              sizeKb: Math.max(1, Math.round((base64Only.length * 0.75) / 1024)),
            });
            return;
          }

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          const commaIdx = compressedDataUrl.indexOf(',');
          const base64Only = commaIdx !== -1 ? compressedDataUrl.slice(commaIdx + 1) : compressedDataUrl;
          resolve({
            dataUrl: compressedDataUrl,
            base64: base64Only,
            mimeType: 'image/jpeg',
            fileName: file.name || 'question.jpg',
            sizeKb: Math.max(1, Math.round((base64Only.length * 0.75) / 1024)),
          });
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to process image.'));
        }
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

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
  const [pendingImage, setPendingImage] = useState<PendingImageAttachment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Voice-to-Text (Web Speech API) + Google Voice Conversation (SpeechSynthesis)
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceConversationOn, setVoiceConversationOn] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setReplyLanguage(language);
  }, [language]);

  useEffect(() => {
    setLevel(defaultLevel);
  }, [defaultLevel]);

  useEffect(() => {
    setSubject(defaultSubject);
  }, [defaultSubject]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore cleanup errors
      }
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  const isUiHindi = replyLanguage === 'hi';

  const stopSpeaking = () => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // Ignore synthesis errors
    }
    setSpeakingMsgId(null);
  };

  const speakMessage = (msg: ChatMessage) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setErrorMessage(
        isUiHindi
          ? 'इस ब्राउज़र में वॉयस प्लेबैक उपलब्ध नहीं है।'
          : 'Voice playback is not supported in this browser.'
      );
      return;
    }

    if (speakingMsgId === msg.id) {
      stopSpeaking();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const spokenText = buildSpeechSummary(msg);
      if (!spokenText) return;

      const utterance = new SpeechSynthesisUtterance(spokenText);
      const targetLang = msg.language === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.lang = targetLang;
      utterance.rate = 0.98;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => /google/i.test(v.name) && v.lang.toLowerCase().startsWith(msg.language === 'hi' ? 'hi' : 'en')) ||
        voices.find((v) => v.lang.toLowerCase() === targetLang.toLowerCase()) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(msg.language === 'hi' ? 'hi' : 'en'));
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);
      setSpeakingMsgId(msg.id);
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeakingMsgId(null);
    }
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore stop errors
      }
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => BrowserSpeechRecognition;
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    };
    const SpeechRecCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecCtor) {
      setErrorMessage(
        isUiHindi
          ? 'इस ब्राउज़र में वॉइस-टू-टेक्स्ट समर्थित नहीं है। कृपया Chrome या मोबाइल ब्राउज़र का उपयोग करें।'
          : 'Voice-to-text is not supported in this browser. Please use Chrome or type your question.'
      );
      return;
    }

    try {
      stopSpeaking();
      setErrorMessage(null);
      const rec = new SpeechRecCtor();
      rec.lang = replyLanguage === 'hi' ? 'hi-IN' : 'en-IN';
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;

      rec.onresult = (event) => {
        let finalText = '';
        let interim = '';
        const startIdx = typeof event.resultIndex === 'number' ? event.resultIndex : 0;
        for (let i = startIdx; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item?.[0]?.transcript ?? '';
          if (item?.isFinal) finalText += `${text} `;
          else interim += text;
        }
        if (finalText.trim()) {
          setQuestion((prev) => (prev.trim() ? `${prev.trim()} ${finalText.trim()}` : finalText.trim()));
          setInterimTranscript('');
        } else {
          setInterimTranscript(interim.trim());
        }
      };

      rec.onerror = (ev) => {
        setIsListening(false);
        setInterimTranscript('');
        const errCode = ev?.error || '';
        if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
          setErrorMessage(
            isUiHindi
              ? 'माइक्रोफ़ोन की अनुमति अस्वीकृत है। कृपया ब्राउज़र में माइक्रोफ़ोन अनुमति दें।'
              : 'Microphone permission was denied. Please allow microphone access to speak your question.'
          );
        } else if (errCode !== 'aborted' && errCode !== 'no-speech') {
          setErrorMessage(
            isUiHindi
              ? 'आवाज़ पहचानने में समस्या आई। कृपया पुनः बोलें या टाइप करें।'
              : 'Could not capture voice input clearly. Please try speaking again or type your question.'
          );
        }
      };

      rec.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = rec;
      setIsListening(true);
      rec.start();
    } catch {
      setIsListening(false);
      setErrorMessage(
        isUiHindi ? 'माइक्रोफ़ोन शुरू नहीं हो सका।' : 'Could not start voice recognition.'
      );
    }
  };

  const handleImageFileSelected = async (file?: File | null) => {
    if (!file) return;
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage(
        isUiHindi ? 'कृपया केवल एक वैध फोटो फ़ाइल चुनें।' : 'Please select a valid image file.'
      );
      return;
    }

    try {
      const processed = await compressImageFile(file);
      setPendingImage(processed);
    } catch {
      setErrorMessage(
        isUiHindi
          ? 'फोटो लोड नहीं हो सकी। कृपया दूसरी स्पष्ट फोटो चुनें।'
          : 'Could not read that image. Please try another photo.'
      );
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const promptText = (customPrompt ?? question).trim();
    const attachedImg = customPrompt ? null : pendingImage;
    if ((!promptText && !attachedImg) || isLoading) return;

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore
      }
      setIsListening(false);
      setInterimTranscript('');
    }

    setErrorMessage(null);
    setIsLoading(true);
    if (!customPrompt) {
      setQuestion('');
      setPendingImage(null);
    }

    const displayUserPrompt =
      promptText ||
      (isUiHindi
        ? 'फोटो में दिए गए प्रश्न को हल करें'
        : 'Solve the question shown in the attached photo');

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      subject,
      language: replyLanguage,
      level,
      content: displayUserPrompt,
      imageDataUrl: attachedImg?.dataUrl,
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
          imageBase64: attachedImg?.base64,
          imageMimeType: attachedImg?.mimeType,
          subject,
          language: replyLanguage,
          mode,
          level,
          customApiKey,
        }),
      });
      const data = await safeParseJsonResponse<{
        answer?: string;
        structured?: StructuredAiAnswer;
        error?: string;
      }>(res);

      if (!res.ok || !data?.answer) {
        onAddChatMessages(userMsg);
        setErrorMessage(
          data?.error ||
            (res.status === 429
              ? isUiHindi
                ? 'AI ट्यूटर अभी व्यस्त है। कृपया कुछ सेकंड प्रतीक्षा करें और पुनः प्रयास करें।'
                : 'AI Tutor is busy right now. Please wait a few seconds and try again.'
              : isUiHindi
              ? 'AI ट्यूटर अभी उत्तर देने में असमर्थ है। कृपया कुछ क्षण बाद पुनः प्रयास करें।'
              : 'AI Tutor is temporarily unavailable. Please try again shortly.')
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

        if (voiceConversationOn) {
          speakMessage(assistantMsg);
        }
        setTimeout(() => {
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 80);
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
              {isUiHindi ? 'AI गुरु (फोटो + वॉइस + टेक्स्ट)' : 'AI Guru (Photo + Voice + Text)'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isUiHindi
                ? 'फोटो खींचकर, बोलकर या टाइप करके कक्षा 9–12, JEE व NEET का चरण-दर-चरण हल पाएं।'
                : 'Ask via Camera photo, Gallery image, Voice dictation, or text for clear step-by-step solutions.'}
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
              {isUiHindi ? 'उत्तर और आवाज़ की भाषा' : 'Answer & Voice Language'}
            </p>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#06102B]">
              <button
                onClick={() => setReplyLanguage('en')}
                className={`min-h-[40px] rounded-lg text-xs font-semibold ${
                  replyLanguage === 'en' ? 'bg-white dark:bg-amber-400 text-slate-950' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                English (en-IN)
              </button>
              <button
                onClick={() => setReplyLanguage('hi')}
                className={`min-h-[40px] rounded-lg text-xs font-semibold ${
                  replyLanguage === 'hi' ? 'bg-white dark:bg-amber-400 text-slate-950' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                हिन्दी (hi-IN)
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
      <section className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A173B] flex flex-col min-h-[600px]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isUiHindi ? 'AI गुरु अध्ययन सत्र' : 'AI Guru Doubt Session'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {chatHistory.length} {isUiHindi ? 'संदेश' : 'messages'}
              <span aria-hidden="true"> · </span>
              {chatHistory.filter((m) => m.saved).length} {isUiHindi ? 'सहेजे गए' : 'saved'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const next = !voiceConversationOn;
                setVoiceConversationOn(next);
                if (!next) stopSpeaking();
              }}
              className={`min-h-[38px] px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                voiceConversationOn
                  ? 'border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-cyan-500/50'
              }`}
              title={
                isUiHindi
                  ? 'AI गुरु के उत्तर स्वतः बोलकर सुनाएं'
                  : 'Automatically read AI Guru replies aloud'
              }
            >
              {voiceConversationOn ? <Volume2 className="w-4 h-4 text-cyan-500" /> : <VolumeX className="w-4 h-4" />}
              <span>{isUiHindi ? 'वॉइस संवाद' : 'Voice Conversation'}</span>
            </button>

            {chatHistory.length > 0 && (
              <button
                onClick={() => {
                  stopSpeaking();
                  onClearHistory();
                }}
                className="min-h-[38px] px-3 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isUiHindi ? 'साफ़ करें' : 'Clear'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[600px]">
          {chatHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                {isUiHindi
                  ? 'फोटो खींचें, बोलकर पूछें या प्रश्न लिखें'
                  : 'Snap a photo, speak your doubt, or type a question'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                {isUiHindi
                  ? 'किताब या कॉपी के प्रश्न की फोटो अपलोड करें, माइक से बोलें, और चरण-दर-चरण हल व वॉइस उत्तर पाएं।'
                  : 'Upload a textbook/notebook photo, tap the mic to ask by voice, and get clear step-by-step equations with optional read-aloud.'}
              </p>
            </div>
          )}

          {chatHistory.map((msg) => {
            const isAssistant = msg.role === 'assistant';
            const isCurrentlySpeaking = speakingMsgId === msg.id;
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
                            {isUiHindi ? 'AI गुरु' : 'AI Guru'}
                          </p>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                            {subjectLabel} · {levelLabelFor(msg.level)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => speakMessage(msg)}
                          className={`min-h-[34px] px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                            isCurrentlySpeaking
                              ? 'bg-cyan-500 text-slate-950'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                          }`}
                          title={isCurrentlySpeaking ? 'Stop speaking' : 'Listen to solution'}
                        >
                          {isCurrentlySpeaking ? (
                            <Square className="w-3 h-3 fill-current" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isCurrentlySpeaking
                              ? isUiHindi
                                ? 'रोकें'
                                : 'Stop'
                              : isUiHindi
                              ? 'सुनें'
                              : 'Listen'}
                          </span>
                        </button>
                        <button
                          type="button"
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
                          type="button"
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
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <User className="w-3.5 h-3.5 text-cyan-500" />
                      <span>{isUiHindi ? 'आपका प्रश्न' : 'Your Question'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{subjectLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{levelLabelFor(msg.level)}</span>
                    </div>
                    {msg.imageDataUrl && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#050C24] max-w-xs">
                        <img
                          src={msg.imageDataUrl}
                          alt={isUiHindi ? 'अपलोड की गई प्रश्न फोटो' : 'Uploaded study question'}
                          className="w-full max-h-52 object-contain"
                        />
                      </div>
                    )}
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
              {isUiHindi
                ? 'आपके प्रश्न (और फोटो) का विश्लेषण करके चरण-दर-चरण हल तैयार किया जा रहा है...'
                : 'Analyzing your question and preparing a step-by-step solution...'}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-2xl p-4 border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
              {errorMessage}
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Composer Dock with Image Preview, Camera/Gallery Inputs, and Voice-to-Text */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3"
        >
          {/* Hidden Native Camera & Gallery Inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              void handleImageFileSelected(file);
              e.target.value = '';
            }}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              void handleImageFileSelected(file);
              e.target.value = '';
            }}
          />

          {/* Image Preview Component */}
          {pendingImage && (
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={pendingImage.dataUrl}
                  alt={isUiHindi ? 'चयनित प्रश्न फोटो पूर्वावलोकन' : 'Selected question preview'}
                  className="h-16 w-16 rounded-lg object-cover border border-slate-300 dark:border-slate-700 bg-white shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {pendingImage.fileName}
                  </p>
                  <p className="text-[11px] text-cyan-700 dark:text-cyan-300 tabular-nums">
                    {pendingImage.sizeKb} KB · {isUiHindi ? 'AI विज़न के लिए तैयार' : 'Ready for Vision AI'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingImage(null)}
                className="min-h-[36px] min-w-[36px] rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-red-500 flex items-center justify-center shrink-0"
                aria-label={isUiHindi ? 'फोटो हटाएं' : 'Remove image'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Voice Recognition Live Banner */}
          {isListening && (
            <div className="px-3.5 py-2 rounded-xl border border-amber-400/50 bg-amber-400/10 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
              <span className="font-semibold">
                {isUiHindi
                  ? 'सुन रहे हैं... अपना प्रश्न बोलें'
                  : 'Listening... speak your question clearly'}
                {interimTranscript ? `: "${interimTranscript}"` : ''}
              </span>
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className="font-bold underline shrink-0"
              >
                {isUiHindi ? 'रोकें' : 'Stop'}
              </button>
            </div>
          )}

          {/* Media & Voice Quick Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isLoading}
                className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] hover:border-cyan-500/60 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4 text-cyan-500" />
                <span>{isUiHindi ? 'कैमरा' : 'Camera'}</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isLoading}
                className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] hover:border-cyan-500/60 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
              >
                <ImagePlus className="w-4 h-4 text-emerald-500" />
                <span>{isUiHindi ? 'गैलरी फोटो' : 'Gallery'}</span>
              </button>
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                disabled={isLoading}
                className={`min-h-[38px] px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  isListening
                    ? 'border-amber-400 bg-amber-400 text-slate-950'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] hover:border-amber-400/60 text-slate-700 dark:text-slate-200'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-amber-500" />}
                <span>
                  {isListening
                    ? isUiHindi
                      ? 'सुनना बंद करें'
                      : 'Stop Mic'
                    : isUiHindi
                    ? 'बोलकर पूछें'
                    : 'Voice Input'}
                </span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {isUiHindi ? 'फोटो या आवाज़ से सीधे हल पाएं' : 'Supports photo + voice doubts'}
            </span>
          </div>

          <div className="flex items-end gap-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              placeholder={
                pendingImage
                  ? isUiHindi
                    ? 'फोटो के बारे में अतिरिक्त निर्देश लिखें (या सीधे "हल पूछें" दबाएं)...'
                    : 'Add optional note about the photo, or tap Ask Tutor directly...'
                  : isUiHindi
                  ? 'Physics, Chemistry या Mathematics का प्रश्न लिखें, बोलें या फोटो चुनें...'
                  : 'Type, speak, or attach a photo of your Physics, Chemistry, or Maths question...'
              }
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#06102B] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={isLoading || (!question.trim() && !pendingImage)}
              className="min-h-[44px] px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-sm inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>{isUiHindi ? 'हल पूछें' : 'Ask Tutor'}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
