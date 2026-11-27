"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send, Volume2, VolumeX, AlertCircle, Square } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  getSpeechRecognitionConstructor,
  SpeechRecognitionLike,
} from "@/lib/voiceEngine";
import { LANGUAGE_META, t, UI_TEXT } from "@/lib/i18n";

interface VoiceControlsProps {
  compact?: boolean;
  onTranscript?: (text: string) => void;
}

export function VoiceControls({ compact = false, onTranscript }: VoiceControlsProps) {
  const {
    lang,
    sendMessage,
    autoSpeak,
    setAutoSpeak,
    isSpeaking,
    stopVoice,
    showToast,
  } = useApp();
  const [textInput, setTextInput] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "processing">("idle");
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognitionConstructor()));
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const handleToggleListening = () => {
    setErrorMsg(null);

    if (status === "listening") {
      recognitionRef.current?.stop();
      setStatus("idle");
      return;
    }

    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) {
      setSpeechSupported(false);
      setErrorMsg(
        lang === "hi"
          ? "इस ब्राउज़र में वॉइस इनपुट समर्थित नहीं है। कृपया नीचे टाइप करें।"
          : lang === "bn"
          ? "এই ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়। অনুগ্রহ করে নিচে টাইপ করুন।"
          : "Voice recognition is not supported in this browser. Please type your message below."
      );
      return;
    }

    try {
      stopVoice();
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = LANGUAGE_META[lang].speechCode;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onresult = (event) => {
        setStatus("processing");
        const transcript = event.results?.[0]?.[0]?.transcript?.trim() || "";
        if (transcript) {
          if (onTranscript) {
            onTranscript(transcript);
          } else {
            sendMessage(transcript);
          }
        } else {
          setErrorMsg("Could not hear clearly. Please try again or type below.");
        }
        setStatus("idle");
      };

      recognition.onerror = (event) => {
        setStatus("idle");
        if (event.error === "not-allowed") {
          setErrorMsg(
            "Microphone permission was denied. Please allow microphone access or type your message below."
          );
        } else if (event.error === "no-speech") {
          setErrorMsg("No speech detected. Tap the microphone and speak clearly, or type below.");
        } else {
          setErrorMsg(`Voice recognition failed (${event.error}). Please type your message below.`);
        }
      };

      recognition.onend = () => {
        setStatus((prev) => (prev === "listening" ? "idle" : prev));
      };

      recognitionRef.current = recognition;
      setStatus("listening");
      recognition.start();
    } catch {
      setStatus("idle");
      setErrorMsg("Could not start microphone. Please type your message below.");
      showToast("Microphone unavailable", "You can type your question anytime.", "warning");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    setErrorMsg(null);
    if (onTranscript) {
      onTranscript(textInput.trim());
    } else {
      sendMessage(textInput.trim());
    }
    setTextInput("");
  };

  return (
    <div className="space-y-2.5">
      {!speechSupported && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            {lang === "hi"
              ? "आपका ब्राउज़र Web Speech API का समर्थन नहीं करता। आप नीचे टाइप करके बात कर सकते हैं।"
              : lang === "bn"
              ? "আপনার ব্রাউজার Web Speech API সমর্থন করে না। আপনি নিচে টাইপ করে কথা বলতে পারেন।"
              : "Browser voice recognition is unsupported here (works best in Chrome/Edge). You can type below."}
          </span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Microphone + Sound Wave Row */}
      <div className="flex items-center justify-center gap-3 py-1">
        <div
          className={`flex items-center gap-1 h-7 transition-opacity ${
            status === "listening" ? "opacity-100" : "opacity-30"
          }`}
          aria-hidden="true"
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={`l-${i}`}
              className={`w-1 rounded-full bg-indigo-500 ${
                status === "listening" ? "animate-wave-bar h-6" : "h-2.5"
              }`}
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>

        <div className="relative">
          {status === "listening" && (
            <span className="absolute inset-0 rounded-full bg-violet-500/40 animate-pulse-ring" />
          )}
          <button
            type="button"
            onClick={handleToggleListening}
            aria-label={status === "listening" ? "Stop listening" : "Start voice input"}
            className={`relative z-10 flex items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-300 ${
              compact ? "w-12 h-12" : "w-14 h-14"
            } ${
              status === "listening"
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/30"
                : status === "processing"
                ? "bg-amber-500 text-white"
                : "bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-500/30"
            }`}
          >
            {status === "listening" ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>

        <div
          className={`flex items-center gap-1 h-7 transition-opacity ${
            status === "listening" ? "opacity-100" : "opacity-30"
          }`}
          aria-hidden="true"
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={`r-${i}`}
              className={`w-1 rounded-full bg-violet-500 ${
                status === "listening" ? "animate-wave-bar h-6" : "h-2.5"
              }`}
              style={{ animationDelay: `${(3 - i) * 0.12}s` }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
            status === "listening"
              ? "bg-rose-100 text-rose-800"
              : status === "processing"
              ? "bg-amber-100 text-amber-800"
              : isSpeaking
              ? "bg-emerald-100 text-emerald-800"
              : "bg-indigo-50 text-indigo-700"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status === "listening"
                ? "bg-rose-500 animate-ping"
                : status === "processing"
                ? "bg-amber-500"
                : isSpeaking
                ? "bg-emerald-500 animate-pulse"
                : "bg-indigo-400"
            }`}
          />
          {status === "listening"
            ? t(UI_TEXT.hero.listeningBtn, lang)
            : status === "processing"
            ? "Processing speech..."
            : isSpeaking
            ? "Speaking response..."
            : `Idle • Tap mic to speak (${LANGUAGE_META[lang].nativeName})`}
        </span>

        {isSpeaking && (
          <button
            type="button"
            onClick={stopVoice}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition"
          >
            <Square className="w-2.5 h-2.5 fill-rose-600" />
            {t(UI_TEXT.common.stopVoice, lang)}
          </button>
        )}
      </div>

      {/* Text Fallback Input + Auto-speak Toggle */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (autoSpeak) stopVoice();
            setAutoSpeak(!autoSpeak);
          }}
          title={autoSpeak ? "Auto-speak is ON" : "Auto-speak is OFF"}
          aria-label={autoSpeak ? "Turn off spoken responses" : "Turn on spoken responses"}
          className={`p-2.5 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            autoSpeak
              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
              : "bg-slate-50 border-slate-200 text-slate-400"
          }`}
        >
          {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={t(UI_TEXT.common.typePlaceholder, lang)}
          aria-label="Type your message to FormSaathi"
          className="flex-1 min-w-0 rounded-xl border border-indigo-100 bg-white px-3.5 py-2.5 text-sm text-indigo-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          type="submit"
          aria-label={t(UI_TEXT.common.send, lang)}
          className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
