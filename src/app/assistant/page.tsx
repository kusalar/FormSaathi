"use client";

import React from "react";
import { Sparkles, ShieldCheck, MessageSquare } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { AssistantWidget } from "@/components/AssistantWidget";
import { t, UI_TEXT } from "@/lib/i18n";

const SAMPLE_PROMPTS = [
  "I am a third-year B.Tech student. I want to find scholarships I can apply for.",
  "What documents do I need for Central Sector Demo Scholarship?",
  "My family income is below 2.5 Lakh and I study in a Government college.",
  "Help me prepare for my scholarship application.",
];

export default function AssistantPage() {
  const { lang, sendMessage, profile } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-950">
          {t(UI_TEXT.nav.assistant, lang)}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Speak or type naturally. FormSaathi asks one question at a time and confirms
          your details before using them.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <AssistantWidget fullHeight />
        </div>

        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl bg-white border border-indigo-100 p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              Try Asking (Click to Send)
            </h2>
            <div className="space-y-2">
              {SAMPLE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendMessage(p)}
                  className="w-full text-left p-3 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-100 text-xs font-medium text-indigo-950 transition"
                >
                  &ldquo;{p}&rdquo;
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-5 space-y-2">
            <h2 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              Detected Student Context
            </h2>
            <ul className="text-xs text-slate-700 space-y-1">
              <li>Course: {profile.course || "Not set yet"}</li>
              <li>Year: {profile.year || "Not set yet"}</li>
              <li>Institution: {profile.institutionType || "Not set yet"}</li>
              <li>Income: {profile.annualIncome || "Not set yet"}</li>
              <li>State: {profile.state || "Not set yet"}</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>{t(UI_TEXT.privacyBanner, lang)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
