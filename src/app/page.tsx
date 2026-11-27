"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Mic,
  ArrowRight,
  CheckCircle2,
  Circle,
  Lightbulb,
  Landmark,
  FileText,
  Sparkles,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SCHOLARSHIPS, evaluateEligibility } from "@/lib/scholarships";
import { t, UI_TEXT } from "@/lib/i18n";
import { AssistantWidget } from "@/components/AssistantWidget";

export default function HomePage() {
  const {
    lang,
    profile,
    overallProgress,
    profileCompleteness,
    docProgress,
    savedScholarships,
    activities,
    setSelectedScholarship,
    sendMessage,
  } = useApp();

  const [tipIndex, setTipIndex] = useState(0);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Prioritize recommended demonstration scholarships by eligibility match
  const recommendedScholarships = [...SCHOLARSHIPS]
    .sort((a, b) => {
      const scoreA = evaluateEligibility(profile, a, lang).score;
      const scoreB = evaluateEligibility(profile, b, lang).score;
      return scoreB - scoreA;
    })
    .slice(0, 3);

  const progressSteps = [
    {
      label: { en: "Profile Created", hi: "प्रोफ़ाइल बनाई गई", bn: "প্রোফাইল তৈরি" },
      done: profileCompleteness >= 50,
    },
    {
      label: { en: "Eligibility Check", hi: "पात्रता जांच", bn: "যোগ্যতা যাচাই" },
      done: profileCompleteness === 100,
    },
    {
      label: { en: "Find Scholarships", hi: "छात्रवृत्ति खोजें", bn: "বৃত্তি খুঁজুন" },
      done: savedScholarships.length > 0,
    },
    {
      label: { en: "Prepare Documents", hi: "दस्तावेज़ तैयार करें", bn: "নথিপত্র প্রস্তুত" },
      done: docProgress >= 50,
    },
    {
      label: { en: "Ready to Apply", hi: "आवेदन के लिए तैयार", bn: "আবেদনের জন্য প্রস্তুত" },
      done: overallProgress >= 90,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Demo & Privacy Notice */}
      <div className="rounded-2xl bg-indigo-950 text-indigo-100 px-4 py-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{t(UI_TEXT.demoBanner, lang)}</span>
        </div>
        <Link
          href="/help"
          className="text-amber-300 font-semibold hover:underline shrink-0"
        >
          Learn more →
        </Link>
      </div>

      {/* Main Dashboard Grid: Left 2/3 Content + Right 1/3 Assistant */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-6">
          {/* Welcome Hero Banner */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-indigo-50/70 to-violet-100/80 border border-indigo-100 shadow-lg shadow-indigo-950/5 p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  {t(UI_TEXT.hero.badge, lang)}
                </span>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-indigo-950 tracking-tight leading-tight">
                  {profile.name ? `Hello, ${profile.name}!` : t(UI_TEXT.hero.title, lang)}{" "}
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 mt-1">
                    {t(UI_TEXT.hero.subtitle, lang)}
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {t(UI_TEXT.hero.desc, lang)}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    href="/assistant"
                    className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-indigo-300"
                  >
                    <Mic className="w-4 h-4" />
                    {t(UI_TEXT.hero.talkBtn, lang)}
                  </Link>

                  <Link
                    href="/scholarships"
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200 font-semibold text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {t(UI_TEXT.hero.exploreBtn, lang)}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Try Saying Sample Prompt */}
                <button
                  type="button"
                  onClick={() =>
                    sendMessage(
                      "I am a third-year B.Tech student. I want to find scholarships I can apply for."
                    )
                  }
                  className="inline-flex items-center gap-2 text-xs text-indigo-700 hover:text-indigo-950 bg-white/80 hover:bg-white border border-indigo-100 rounded-xl px-3 py-1.5 transition"
                >
                  <span className="font-bold text-violet-600">Try saying:</span>
                  <span className="italic truncate max-w-[260px] sm:max-w-sm">
                    &ldquo;I am a third-year B.Tech student. I want to find scholarships...&rdquo;
                  </span>
                </button>
              </div>

              <div className="md:col-span-5 flex flex-col items-center">
                <div className="relative w-full max-w-[260px] aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-white/80 animate-float-gentle">
                  <Image
                    src="/images/hero-scholar.jpg"
                    alt="Indian college student smiling with books"
                    fill
                    priority
                    sizes="260px"
                    className="object-cover"
                  />
                </div>
                <p className="mt-2 text-xs font-bold italic text-indigo-800">
                  Dream Big... Apply Smart!
                </p>
              </div>
            </div>
          </section>

          {/* Progress & Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Your Progress Card */}
            <section className="md:col-span-7 rounded-3xl bg-white border border-indigo-100 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-base sm:text-lg font-bold text-indigo-950">
                  Your Progress
                </h2>
                <span className="text-sm font-extrabold text-indigo-600">
                  {overallProgress}% Complete
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-indigo-100 overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-600 transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 px-3 py-2">
                  <p className="text-[11px] text-slate-600">Application Prep</p>
                  <p className="text-sm font-extrabold text-indigo-950">{profileCompleteness}%</p>
                </div>
                <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 px-3 py-2">
                  <p className="text-[11px] text-slate-600">Document Checklist</p>
                  <p className="text-sm font-extrabold text-emerald-800">{docProgress}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <ul className="space-y-2 flex-1">
                  {progressSteps.map((step, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs sm:text-sm">
                      {step.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span
                        className={
                          step.done ? "font-semibold text-indigo-950" : "text-slate-500"
                        }
                      >
                        {t(step.label, lang)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="hidden sm:block relative w-28 h-28 rounded-2xl overflow-hidden border border-indigo-50 shrink-0">
                  <Image
                    src="/images/scholarship-trophy.jpg"
                    alt="Scholarship books and trophy"
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
              </div>
            </section>

            {/* Quick Links & Did You Know */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <section className="rounded-3xl bg-white border border-indigo-100 shadow-sm p-5 flex-1">
                <h2 className="text-sm font-bold text-indigo-950 mb-3">Quick Links</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/help"
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold text-center transition"
                  >
                    <Landmark className="w-4 h-4 text-indigo-600" />
                    Govt. Portals
                  </Link>
                  <Link
                    href="/documents"
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-violet-50/70 hover:bg-violet-100 text-violet-900 text-xs font-semibold text-center transition"
                  >
                    <FileText className="w-4 h-4 text-violet-600" />
                    Documents
                  </Link>
                  <Link
                    href="/eligibility"
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-sky-50/70 hover:bg-sky-100 text-sky-900 text-xs font-semibold text-center transition"
                  >
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    Eligibility
                  </Link>
                  <Link
                    href="/help"
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100 text-amber-900 text-xs font-semibold text-center transition"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    FAQs
                  </Link>
                </div>
              </section>

              <section className="rounded-3xl bg-gradient-to-r from-indigo-100/90 via-violet-100/80 to-sky-100/80 border border-indigo-200/70 p-4 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-xs shrink-0">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-950">Did you know?</p>
                    <p className="text-xs text-indigo-900/80 mt-0.5 leading-snug">
                      {t(UI_TEXT.tips[tipIndex], lang)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTipIndex((i) => (i + 1) % UI_TEXT.tips.length)}
                  aria-label="Next tip"
                  className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </section>
            </div>
          </div>

          {/* Popular Scholarships (Demo) */}
          <section className="rounded-3xl bg-white border border-indigo-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-indigo-950">
                  Recommended Scholarships (Demo)
                </h2>
                <p className="text-xs text-slate-500">
                  Simulated examples ranked by your current profile match
                </p>
              </div>
              <Link
                href="/scholarships"
                className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                {t(UI_TEXT.common.viewAll, lang)}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedScholarships.map((s) => {
                const elig = evaluateEligibility(profile, s, lang);
                const isExpanded = expandedCardId === s.id;
                return (
                  <article
                    key={s.id}
                    className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/40 to-white p-4 flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {t(UI_TEXT.common.demoTag, lang)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                          {s.category}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-indigo-950 leading-snug">
                        {t(s.name, lang)}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {t(s.summary, lang)}
                      </p>

                      <p className="text-xs font-bold text-indigo-700 mt-2">
                        {t(s.amountLabel, lang)}
                      </p>

                      {isExpanded && (
                        <div className="mt-3 pt-2.5 border-t border-indigo-100 text-xs text-slate-600 space-y-1">
                          <p className="font-semibold text-indigo-950">
                            Status:{" "}
                            {elig.status === "eligible"
                              ? "Likely Eligible (Demo)"
                              : elig.status === "partial"
                              ? "Complete profile to check"
                              : "Criteria mismatch"}
                          </p>
                          <p>Documents needed: {s.requiredDocuments.length}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <button
                        type="button"
                        onClick={() => setSelectedScholarship(s)}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        {t(UI_TEXT.common.checkEligibility, lang)}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCardId(isExpanded ? null : s.id)
                        }
                        className="w-full py-1.5 px-2 rounded-xl text-xs font-semibold text-indigo-700 hover:bg-indigo-50 inline-flex items-center justify-center gap-1 transition"
                      >
                        {isExpanded ? (
                          <>
                            Hide Quick Info <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            Quick Info <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Recent Activity Section */}
          <section className="rounded-3xl bg-white border border-indigo-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-base font-bold text-indigo-950">Recent Activity</h2>
              <Link
                href="/progress"
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Full Progress →
              </Link>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activities.slice(0, 4).map((act) => (
                <li key={act.id}>
                  <Link
                    href={act.href}
                    className="flex items-start gap-2.5 p-3 rounded-2xl bg-indigo-50/40 hover:bg-indigo-50 border border-indigo-100/80 transition"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-indigo-950 truncate">
                        {t(act.label, lang)}
                      </p>
                      <p className="text-[11px] text-slate-400">{act.timestamp}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right Column: Live Assistant Widget */}
        <div className="xl:col-span-4 xl:sticky xl:top-20">
          <AssistantWidget />
        </div>
      </div>
    </div>
  );
}
