"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Volume2, Check, Edit3, RotateCcw, Sparkles, ArrowUpRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SCHOLARSHIPS } from "@/lib/scholarships";
import { t, UI_TEXT } from "@/lib/i18n";
import { VoiceControls } from "./VoiceControls";

interface AssistantWidgetProps {
  fullHeight?: boolean;
}

export function AssistantWidget({ fullHeight = false }: AssistantWidgetProps) {
  const {
    messages,
    sendMessage,
    confirmPendingDetails,
    clearMessages,
    speakMessage,
    isSpeaking,
    setSelectedScholarship,
    lang,
  } = useApp();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <section
      aria-label="FormSaathi Voice & Chat Assistant"
      className={`flex flex-col rounded-3xl bg-white border border-indigo-100 shadow-xl shadow-indigo-950/5 overflow-hidden ${
        fullHeight ? "h-[calc(100vh-12rem)] min-h-[540px]" : "h-[600px]"
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 px-4 py-3.5 text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-white/20 bg-indigo-800 shrink-0">
            <img
              src="/images/assistant-bot.jpg"
              alt="FormSaathi Assistant Mascot"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-indigo-950" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base leading-tight">
              FormSaathi Assistant
            </h2>
            <p className="text-[11px] text-indigo-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {isSpeaking ? "Speaking..." : "Online • Voice & Text"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearMessages}
          title="Reset conversation"
          aria-label="Reset conversation"
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-100 transition focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Message List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-indigo-50/40 to-white"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-sm"
                  : "bg-white border border-indigo-100 text-indigo-950 rounded-bl-sm"
              }`}
            >
              <p>{msg.text}</p>

              {/* Repeat Spoken Response Button */}
              {msg.role === "assistant" && (
                <div className="mt-2 flex items-center justify-between gap-2 pt-1.5 border-t border-indigo-50">
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  <button
                    type="button"
                    onClick={() => speakMessage(msg.text, msg.lang)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded-lg hover:bg-indigo-50 transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    {t(UI_TEXT.common.repeatVoice, lang)}
                  </button>
                </div>
              )}
            </div>

            {/* Matched Demonstration Scholarships with Reasons */}
            {msg.matchedScholarships && msg.matchedScholarships.length > 0 && (
              <div className="mt-2 space-y-2 max-w-[92%] w-full">
                {msg.matchedScholarships.map((item) => {
                  const fullSch = SCHOLARSHIPS.find((s) => s.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-white border border-indigo-200 p-3 shadow-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            DEMO
                          </span>
                          <p className="text-xs font-bold text-indigo-950 mt-0.5">
                            {item.name}
                          </p>
                          <p className="text-[11px] font-semibold text-indigo-600">
                            {item.amount}
                          </p>
                        </div>
                        {fullSch && (
                          <button
                            type="button"
                            onClick={() => setSelectedScholarship(fullSch)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shrink-0"
                          >
                            View
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {item.reasons.length > 0 && (
                        <ul className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-indigo-50">
                          {item.reasons.map((r, i) => (
                            <li key={i}>• {r}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Confirmation Prompt Buttons */}
            {msg.confirmation && !msg.confirmation.confirmed && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => confirmPendingDetails(msg.id, true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t(UI_TEXT.common.confirmYes, lang)}
                </button>
                <button
                  type="button"
                  onClick={() => confirmPendingDetails(msg.id, false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {t(UI_TEXT.common.confirmEdit, lang)}
                </button>
              </div>
            )}

            {/* Quick Action Chips */}
            {msg.actions && msg.actions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 max-w-[92%]">
                {msg.actions.map((act, idx) =>
                  act.href ? (
                    <Link
                      key={idx}
                      href={act.href}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-800 text-xs font-semibold shadow-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <Sparkles className="w-3 h-3 text-violet-600" />
                      {act.label}
                    </Link>
                  ) : (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendMessage(act.promptText || act.label)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {act.label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Voice & Text Input Footer */}
      <div className="p-3.5 bg-white border-t border-indigo-100">
        <VoiceControls compact />
      </div>
    </section>
  );
}
