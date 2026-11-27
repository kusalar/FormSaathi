"use client";

import React, { useState } from "react";
import { CheckCircle2, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  COURSE_OPTIONS,
  INCOME_OPTIONS,
  INSTITUTION_OPTIONS,
  SCHOLARSHIPS,
  STATE_OPTIONS,
  YEAR_OPTIONS,
  evaluateEligibility,
} from "@/lib/scholarships";
import { StudentProfile } from "@/types";
import { t, UI_TEXT } from "@/lib/i18n";

export default function EligibilityPage() {
  const {
    lang,
    profile,
    updateProfile,
    setSelectedScholarship,
    showToast,
    logActivity,
  } = useApp();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<StudentProfile>(profile);
  const [completed, setCompleted] = useState(false);

  const steps = [
    {
      key: "course" as const,
      question:
        lang === "hi"
          ? "1. आप कौन सा पाठ्यक्रम (कोर्स) पढ़ रहे हैं?"
          : lang === "bn"
          ? "১. আপনি কোন কোর্সে পড়াশোনা করছেন?"
          : "1. What course are you studying?",
      options: COURSE_OPTIONS,
    },
    {
      key: "year" as const,
      question:
        lang === "hi"
          ? "2. आप किस वर्ष में हैं?"
          : lang === "bn"
          ? "২. আপনি কোন বর্ষে পড়ছেন?"
          : "2. Which year are you in?",
      options: YEAR_OPTIONS,
    },
    {
      key: "institutionType" as const,
      question:
        lang === "hi"
          ? "3. आपके संस्थान का प्रकार क्या है?"
          : lang === "bn"
          ? "৩. আপনার প্রতিষ্ঠানের ধরন কী?"
          : "3. What is your institution type?",
      options: INSTITUTION_OPTIONS as string[],
    },
    {
      key: "annualIncome" as const,
      question:
        lang === "hi"
          ? "4. आपके परिवार की अनुमानित वार्षिक आय क्या है?"
          : lang === "bn"
          ? "৪. আপনার পরিবারের আনুমানিক বার্ষিক আয় কত?"
          : "4. What is your approximate family income?",
      options: INCOME_OPTIONS.map((i) => i.value),
    },
    {
      key: "state" as const,
      question:
        lang === "hi"
          ? "5. आप किस राज्य में रहते हैं?"
          : lang === "bn"
          ? "৫. আপনি কোন রাজ্যে থাকেন?"
          : "5. Which state do you live in?",
      options: STATE_OPTIONS,
    },
  ];

  const currentStep = steps[step];
  const progressPct = completed ? 100 : Math.round(((step + 1) / steps.length) * 100);

  const handleSelectOption = (val: string) => {
    setDraft((prev) => ({ ...prev, [currentStep.key]: val }));
  };

  const handleFinish = () => {
    updateProfile(draft);
    setCompleted(true);
    logActivity(
      {
        en: "Completed 5-step Eligibility Check",
        hi: "5-चरणीय पात्रता जांच पूरी की",
        bn: "৫-ধাপের যোগ্যতা যাচাই সম্পন্ন করেছেন",
      },
      "/eligibility"
    );
    showToast("Eligibility Checked", "Showing your matched demonstration scholarships.", "success");
  };

  const matchedScholarships = SCHOLARSHIPS.filter(
    (s) => evaluateEligibility(draft, s, lang).status === "eligible"
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-950">
          {t(UI_TEXT.nav.eligibility, lang)}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Answer one simple question at a time to see which demo scholarships match you.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="rounded-2xl bg-white border border-indigo-100 p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-indigo-950 mb-2">
          <span>
            {completed ? "Assessment Complete" : `Step ${step + 1} of ${steps.length}`}
          </span>
          <span className="text-indigo-600">{progressPct}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-indigo-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {!completed ? (
        <section className="rounded-3xl bg-white border border-indigo-100 shadow-sm p-6 sm:p-8 space-y-6">
          <h2 className="text-lg sm:text-xl font-bold text-indigo-950">
            {currentStep.question}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentStep.options.map((opt) => {
              const selected = draft[currentStep.key] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={`p-3.5 rounded-2xl border text-left text-sm font-semibold transition flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                    selected
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-md"
                      : "bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-950 border-indigo-100"
                  }`}
                >
                  <span>{opt}</span>
                  {selected && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                disabled={!draft[currentStep.key]}
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-bold shadow-sm"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!draft[currentStep.key]}
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 text-white text-sm font-bold shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                See Matched Scholarships
              </button>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-indigo-950">
                You matched {matchedScholarships.length} Demonstration Scholarships!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Profile: {draft.course} • {draft.year} • {draft.institutionType} •{" "}
                {draft.annualIncome} • {draft.state}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCompleted(false);
                setStep(0);
              }}
              className="px-4 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-indigo-800 hover:bg-indigo-50 shrink-0"
            >
              Re-check Answers
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {matchedScholarships.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl bg-white border border-indigo-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    DEMO
                  </span>
                  <h3 className="font-bold text-base text-indigo-950 mt-1">
                    {t(s.name, lang)}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {t(s.amountLabel, lang)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedScholarship(s)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0"
                >
                  {t(UI_TEXT.common.viewDetails, lang)}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
