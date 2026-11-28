"use client";

import React, { useEffect, useState } from "react";
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
  Radio,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SCHOLARSHIPS, evaluateEligibility } from "@/lib/scholarships";
import { NATIONAL_OFFICIAL_SCHOLARSHIPS } from "@/lib/scholarships/providers/national";
import { WEST_BENGAL_SCHOLARSHIPS } from "@/lib/scholarships/providers/westBengal";
import { CORPORATE_SCHOLARSHIPS } from "@/lib/scholarships/providers/corporate";
import { matchNormalizedScholarship } from "@/lib/scholarships/matcher";
import { OFFICIAL_INDIAN_INTERNSHIP_SOURCES } from "@/lib/opportunities/providers/indianOfficialSources";
import { OFFICIAL_INDIAN_JOB_SOURCES } from "@/lib/opportunities/providers/indianOfficialJobs";
import { OFFICIAL_COMPETITION_DIRECTORIES } from "@/lib/opportunities/competitions/providers/officialDirectories";
import { matchCompetition } from "@/lib/opportunities/competitions/matcher";
import { matchOpportunity } from "@/lib/opportunities/matcher";
import { Opportunity } from "@/types";
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
    applicationTracking,
    activities,
    setSelectedScholarship,
    sendMessage,
  } = useApp();

  const [tipIndex, setTipIndex] = useState(0);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [liveInternship, setLiveInternship] = useState<{
    opp: Opportunity | null;
    isLive: boolean;
    loading: boolean;
    error: string | null;
    fetchedAt: string | null;
  }>({
    opp: null,
    isLive: false,
    loading: true,
    error: null,
    fetchedAt: null,
  });

  useEffect(() => {
    let active = true;
    fetch("/api/internships?country=IN&page=1")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!active) return;
        if (!ok || !data.ok || !Array.isArray(data.opportunities) || data.opportunities.length === 0) {
          setLiveInternship({
            opp: null,
            isLive: false,
            loading: false,
            error: data.error || "Live internship provider temporarily unavailable.",
            fetchedAt: data.lastSuccessfulFetchAt || null,
          });
          return;
        }
        const liveOnly = (data.opportunities as Opportunity[]).filter(
          (o) => o.sourceBadge === "LIVE API"
        );
        const best = liveOnly
          .map((o) => ({ opp: o, match: matchOpportunity(profile, o) }))
          .sort((a, b) => b.match.percentage - a.match.percentage)[0];
        setLiveInternship({
          opp: best?.opp || liveOnly[0] || null,
          isLive: liveOnly.length > 0,
          loading: false,
          error: liveOnly.length === 0 ? "No live remote internships matched." : null,
          fetchedAt: data.fetchedAt || null,
        });
      })
      .catch(() => {
        if (!active) return;
        setLiveInternship({
          opp: null,
          isLive: false,
          loading: false,
          error: "Live internship provider temporarily unavailable.",
          fetchedAt: null,
        });
      });
    return () => {
      active = false;
    };
  }, [profile]);

  const [liveJob, setLiveJob] = useState<{
    opp: Opportunity | null;
    isLive: boolean;
    loading: boolean;
    error: string | null;
  }>({
    opp: null,
    isLive: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    fetch("/api/jobs?country=IN&page=1")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!active) return;
        if (!ok || !data.ok || !Array.isArray(data.opportunities)) {
          setLiveJob({
            opp: null,
            isLive: false,
            loading: false,
            error: "Live job provider temporarily unavailable.",
          });
          return;
        }
        const liveOnly = (data.opportunities as Opportunity[]).filter(
          (o) => o.sourceBadge === "LIVE API"
        );
        const best = liveOnly
          .map((o) => ({ opp: o, match: matchOpportunity(profile, o) }))
          .sort((a, b) => b.match.percentage - a.match.percentage)[0];
        setLiveJob({
          opp: best?.opp || liveOnly[0] || null,
          isLive: liveOnly.length > 0,
          loading: false,
          error: liveOnly.length === 0 ? "No live fresher/entry jobs matched." : null,
        });
      })
      .catch(() => {
        if (!active) return;
        setLiveJob({
          opp: null,
          isLive: false,
          loading: false,
          error: "Live job provider temporarily unavailable.",
        });
      });
    return () => {
      active = false;
    };
  }, [profile]);

  const [liveComp, setLiveComp] = useState<{
    opp: Opportunity | null;
    isLive: boolean;
    loading: boolean;
    error: string | null;
  }>({
    opp: null,
    isLive: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    fetch("/api/competitions?country=IN&page=1")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!active) return;
        if (!ok || !data.ok || !Array.isArray(data.opportunities)) {
          setLiveComp({
            opp: null,
            isLive: false,
            loading: false,
            error: "Live competition API temporarily unavailable.",
          });
          return;
        }
        const liveOnly = (data.opportunities as Opportunity[]).filter(
          (o) => o.sourceBadge === "LIVE API"
        );
        const best = liveOnly
          .map((o) => ({ opp: o, match: matchCompetition(profile, o) }))
          .sort((a, b) => b.match.percentage - a.match.percentage)[0];
        setLiveComp({
          opp: best?.opp || liveOnly[0] || null,
          isLive: liveOnly.length > 0,
          loading: false,
          error: liveOnly.length === 0 ? "No live hackathons available right now." : null,
        });
      })
      .catch(() => {
        if (!active) return;
        setLiveComp({
          opp: null,
          isLive: false,
          loading: false,
          error: "Live competition API temporarily unavailable.",
        });
      });
    return () => {
      active = false;
    };
  }, [profile]);

  const topInternshipMatch = liveInternship.opp
    ? matchOpportunity(profile, liveInternship.opp)
    : null;
  const topLiveJobMatch = liveJob.opp ? matchOpportunity(profile, liveJob.opp) : null;

  const topIndianResearch = OFFICIAL_INDIAN_INTERNSHIP_SOURCES.map((o) => ({
    opp: o,
    match: matchOpportunity(profile, o),
  })).sort((a, b) => b.match.percentage - a.match.percentage)[0];

  const officialScholarshipsPool = [
    ...NATIONAL_OFFICIAL_SCHOLARSHIPS,
    ...WEST_BENGAL_SCHOLARSHIPS,
    ...CORPORATE_SCHOLARSHIPS,
  ]
    .map((sch) => ({
      sch,
      match: matchNormalizedScholarship(profile, sch),
    }))
    .filter((x) => x.match.status !== "NOT_ELIGIBLE" && x.match.status !== "CLOSED")
    .sort((a, b) => b.match.percentage - a.match.percentage)
    .slice(0, 3);

  const topOfficialComp = OFFICIAL_COMPETITION_DIRECTORIES.map((o) => ({
    opp: o,
    match: matchCompetition(profile, o),
  })).sort((a, b) => b.match.percentage - a.match.percentage)[0];

  const topAmbassador = OFFICIAL_COMPETITION_DIRECTORIES.filter(
    (o) => o.competitionSubCategory === "student_ambassador"
  )
    .map((o) => ({ opp: o, match: matchCompetition(profile, o) }))
    .sort((a, b) => b.match.percentage - a.match.percentage)[0];

  const topJob = OFFICIAL_INDIAN_JOB_SOURCES.map((o) => ({
    opp: o,
    match: matchOpportunity(profile, o),
  })).sort((a, b) => b.match.percentage - a.match.percentage)[0];

  const trackedCount = Object.keys(applicationTracking).length;

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

          {/* Official Scholarship Portals & West Bengal / Corporate Sources */}
          <section className="rounded-3xl bg-white border border-indigo-100 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-indigo-950">
                  Official Scholarship Sources {profile.state === "West Bengal" ? "(Including West Bengal)" : ""}
                </h2>
                <p className="text-xs text-slate-500">
                  Indicative matches from NSP, AICTE, SVMCM, Aikyashree &amp; HDFC Parivartan
                </p>
              </div>
              <Link
                href="/scholarships"
                className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                Explore Scholarships
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {officialScholarshipsPool.length === 0 ? (
              <p className="text-xs text-slate-600">
                No verified current match found for your filters. Visit{" "}
                <Link href="/scholarships" className="font-bold text-indigo-700 underline">
                  Find Scholarships
                </Link>{" "}
                to browse official NSP, State, and Corporate portals.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {officialScholarshipsPool.map(({ sch, match }) => (
                  <div
                    key={sch.id}
                    className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          {sch.dataSourceType}
                        </span>
                        <span className="text-xs font-extrabold text-indigo-700">
                          {match.percentage}%
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-indigo-950 leading-snug">
                        {sch.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">{sch.provider}</p>
                    </div>
                    <Link
                      href="/scholarships"
                      className="mt-3 text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1"
                    >
                      Check Eligibility <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Personalised Internships (Live) & Jobs (Demo) */}
          <section className="rounded-3xl bg-white border border-indigo-100 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-indigo-950">
                  Personalised Internships &amp; Jobs
                </h2>
                <p className="text-xs text-slate-500">
                  Saved: {savedScholarships.length} • Tracked Applications: {trackedCount}
                </p>
              </div>
              <Link
                href="/opportunities"
                className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                Explore All Opportunities
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topIndianResearch && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
                        OFFICIAL SOURCE
                      </span>
                      <span className="text-xs font-extrabold text-indigo-700">
                        {topIndianResearch.match.percentage}% Match
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-indigo-950">
                      {topIndianResearch.opp.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {topIndianResearch.opp.organisation}
                    </p>
                  </div>
                  <Link
                    href="/opportunities"
                    className="mt-3 text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1"
                  >
                    View Indian Programmes <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {liveInternship.loading ? (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 animate-pulse space-y-2">
                  <div className="h-4 w-32 bg-indigo-100 rounded" />
                  <div className="h-4 w-3/4 bg-indigo-100 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                </div>
              ) : liveInternship.isLive && liveInternship.opp && topInternshipMatch ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        <Radio className="w-3 h-3" />
                        LIVE • Himalayas
                      </span>
                      <span className="text-xs font-extrabold text-indigo-700">
                        {topInternshipMatch.percentage}% Match
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-indigo-950">
                      {liveInternship.opp.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {liveInternship.opp.organisation} • {liveInternship.opp.workMode}
                    </p>
                  </div>
                  <Link
                    href="/opportunities"
                    className="mt-3 text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1"
                  >
                    View Live Internships <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-rose-800">
                      Live Internships Temporarily Unavailable
                    </p>
                    <p className="text-[11px] text-rose-700 mt-1">
                      {liveInternship.error || "Unable to reach Himalayas right now."}
                    </p>
                  </div>
                  <Link
                    href="/opportunities"
                    className="mt-3 text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1"
                  >
                    Open Opportunities Page <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {liveJob.loading ? (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 animate-pulse space-y-2">
                  <div className="h-4 w-28 bg-indigo-100 rounded" />
                  <div className="h-4 w-3/4 bg-indigo-100 rounded" />
                </div>
              ) : liveJob.isLive && liveJob.opp && topLiveJobMatch ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        <Radio className="w-3 h-3" />
                        LIVE JOB • {liveJob.opp.sourceName}
                      </span>
                      <span className="text-xs font-extrabold text-indigo-700">
                        {topLiveJobMatch.percentage}% Match
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-indigo-950">
                      {liveJob.opp.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {liveJob.opp.organisation} • {liveJob.opp.workMode}
                    </p>
                  </div>
                  <Link
                    href="/opportunities"
                    className="mt-3 text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1"
                  >
                    Explore Live Jobs <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : topJob ? (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
                        OFFICIAL SOURCE • JOB
                      </span>
                      <span className="text-xs font-extrabold text-emerald-700">
                        {topJob.match.percentage}% Match
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-indigo-950">
                      {topJob.opp.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {topJob.opp.organisation} • {topJob.opp.workMode}
                    </p>
                  </div>
                  <Link
                    href="/opportunities"
                    className="mt-3 text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1"
                  >
                    Explore Career Portals <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : null}
            </div>
          </section>

          {/* Competitions You Might Like */}
          <section className="rounded-3xl bg-white border border-indigo-100 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-indigo-950">
                  Competitions You Might Like
                </h2>
                <p className="text-xs text-slate-500">
                  Live hackathons (Devpost), Indian innovation challenges &amp; student ambassador programmes
                </p>
              </div>
              <Link
                href="/opportunities"
                className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                Explore All Competitions
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {liveComp.loading ? (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 animate-pulse space-y-2">
                  <div className="h-4 w-28 bg-indigo-100 rounded" />
                  <div className="h-4 w-3/4 bg-indigo-100 rounded" />
                </div>
              ) : liveComp.isLive && liveComp.opp ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        <Radio className="w-3 h-3" />
                        LIVE API • Devpost
                      </span>
                      <span className="text-xs font-extrabold text-indigo-700">
                        {matchCompetition(profile, liveComp.opp).percentage}% Match
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-indigo-950 leading-snug">
                      {liveComp.opp.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {liveComp.opp.eventDatesLabel || liveComp.opp.location}
                    </p>
                  </div>
                  <Link
                    href="/opportunities"
                    className="mt-3 text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1"
                  >
                    View Live Hackathons <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-rose-800">
                      Live Hackathons Temporarily Unavailable
                    </p>
                    <p className="text-[11px] text-rose-700 mt-1">
                      {liveComp.error || "Devpost could not be reached right now."}
                    </p>
                  </div>
                  <Link
                    href="/opportunities"
                    className="mt-3 text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1"
                  >
                    Open Competitions <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {topOfficialComp && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
                        OFFICIAL DIRECTORY
                      </span>
                      <span className="text-xs font-extrabold text-indigo-700">
                        {topOfficialComp.match.percentage}% Match
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-indigo-950 leading-snug">
                      {topOfficialComp.opp.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {topOfficialComp.opp.organisation}
                    </p>
                  </div>
                  <Link
                    href="/opportunities"
                    className="mt-3 text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1"
                  >
                    Explore Official Portal <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {topAmbassador && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 uppercase">
                        STUDENT AMBASSADOR
                      </span>
                      <span className="text-xs font-extrabold text-indigo-700">
                        {topAmbassador.match.percentage}% Match
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-indigo-950 leading-snug">
                      {topAmbassador.opp.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {topAmbassador.opp.organisation}
                    </p>
                  </div>
                  <Link
                    href="/opportunities"
                    className="mt-3 text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1"
                  >
                    View Ambassador Programmes <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
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
