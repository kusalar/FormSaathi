"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  FileEdit,
  Trash2,
  Landmark,
  GraduationCap,
  Building2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  COURSE_OPTIONS,
  INCOME_OPTIONS,
  INSTITUTION_OPTIONS,
  SCHOLARSHIPS,
  STATE_OPTIONS,
  YEAR_OPTIONS,
} from "@/lib/scholarships";
import {
  isScholarshipClosed,
  matchNormalizedScholarship,
} from "@/lib/scholarships/matcher";
import type { ScholarshipProviderStatus } from "@/lib/scholarships/providers/aggregator";
import {
  ApplicationTrackingStatus,
  NormalizedScholarship,
  ScholarshipApplicationStatus,
} from "@/types";
import { t, UI_TEXT } from "@/lib/i18n";

type ScholarshipTab =
  | "all"
  | "recommended"
  | "Government"
  | "West Bengal"
  | "Corporate"
  | "Engineering"
  | "Merit"
  | "Research"
  | "demo"
  | "saved";

const TRACKING_OPTIONS: Array<{ value: ApplicationTrackingStatus; label: string }> = [
  { value: "interested", label: "Interested" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
];

export default function ScholarshipsPage() {
  const {
    lang,
    profile,
    profileCompleteness,
    savedScholarships,
    toggleSaveScholarship,
    applicationTracking,
    updateOpportunityTracking,
    removeOpportunityTracking,
    setSelectedScholarship,
  } = useApp();

  const [items, setItems] = useState<NormalizedScholarship[]>([]);
  const [providers, setProviders] = useState<ScholarshipProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [todayIso, setTodayIso] = useState<string | undefined>(undefined);

  const [tab, setTab] = useState<ScholarshipTab>("all");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [degreeFilter, setDegreeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [incomeFilter, setIncomeFilter] = useState("all");
  const [instFilter, setInstFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ScholarshipApplicationStatus>("all");
  const [sponsorFilter, setSponsorFilter] = useState("all");
  const [hideNotEligible, setHideNotEligible] = useState(false);

  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const loadScholarships = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/scholarships");
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setLoadError("Could not load scholarship sources. Please retry.");
        setLoading(false);
        return;
      }
      setTodayIso(new Date().toISOString().slice(0, 10));
      setItems(Array.isArray(data.scholarships) ? data.scholarships : []);
      setProviders(Array.isArray(data.providers) ? data.providers : []);
      setLoading(false);
    } catch {
      setLoadError("Network error while loading scholarship providers.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadScholarships();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadScholarships]);

  const enriched = useMemo(() => {
    return items
      .map((sch) => ({
        sch,
        match: matchNormalizedScholarship(profile, sch, todayIso),
        closed: isScholarshipClosed(sch, todayIso),
      }))
      .sort((a, b) => {
        if (a.sch.isDemo !== b.sch.isDemo) return a.sch.isDemo ? 1 : -1;
        return b.match.percentage - a.match.percentage;
      });
  }, [items, profile, todayIso]);

  const sponsors = useMemo(
    () => Array.from(new Set(items.map((s) => s.provider))).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    return enriched.filter(({ sch, match, closed }) => {
      if (tab === "saved" && !savedScholarships.includes(sch.id)) return false;
      if (tab === "demo" && !sch.isDemo) return false;
      if (
        tab === "recommended" &&
        (closed || match.status === "NOT_ELIGIBLE" || sch.isDemo)
      ) {
        return false;
      }
      if (
        tab === "Government" ||
        tab === "West Bengal" ||
        tab === "Corporate" ||
        tab === "Engineering" ||
        tab === "Merit" ||
        tab === "Research"
      ) {
        if (sch.category !== tab) return false;
      }

      if (hideNotEligible && (closed || match.status === "NOT_ELIGIBLE")) {
        return false;
      }

      if (
        stateFilter !== "all" &&
        sch.eligibleStates.length > 0 &&
        !sch.eligibleStates.includes(stateFilter)
      ) {
        return false;
      }
      if (
        degreeFilter !== "all" &&
        sch.eligibleDegrees.length > 0 &&
        !sch.eligibleDegrees.includes(degreeFilter)
      ) {
        return false;
      }
      if (
        yearFilter !== "all" &&
        sch.eligibleAcademicYears.length > 0 &&
        !sch.eligibleAcademicYears.includes(yearFilter)
      ) {
        return false;
      }
      if (incomeFilter !== "all") {
        const selectedOpt = INCOME_OPTIONS.find((i) => i.value === incomeFilter);
        if (
          selectedOpt &&
          sch.maxIncomeLakh !== null &&
          selectedOpt.lakh > sch.maxIncomeLakh
        ) {
          return false;
        }
      }
      if (
        instFilter !== "all" &&
        sch.eligibleInstitutionTypes.length > 0 &&
        !sch.eligibleInstitutionTypes.includes(instFilter)
      ) {
        return false;
      }
      if (statusFilter !== "all" && sch.applicationStatus !== statusFilter) {
        return false;
      }
      if (sponsorFilter !== "all" && sch.provider !== sponsorFilter) {
        return false;
      }

      const q = query.trim().toLowerCase();
      if (q) {
        const hay = `${sch.title} ${sch.provider} ${sch.description} ${sch.category} ${sch.sourceName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    enriched,
    tab,
    savedScholarships,
    hideNotEligible,
    stateFilter,
    degreeFilter,
    yearFilter,
    incomeFilter,
    instFilter,
    statusFilter,
    sponsorFilter,
    query,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 text-white p-6 sm:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-indigo-100">
            <Landmark className="w-3.5 h-3.5 text-amber-300" />
            National, West Bengal &amp; Corporate Scholarship Discovery
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            {t(UI_TEXT.nav.scholarships, lang)}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl">
            Official portal directories (NSP, AICTE, UGC, SVMCM, Aikyashree, OASIS,
            HDFC Parivartan) plus demonstration practice schemes. Eligibility is
            preliminary — final verification happens on the official portal.
          </p>
        </div>

        <div className="rounded-2xl bg-white/10 border border-white/15 px-5 py-3.5 shrink-0 flex items-center gap-4">
          <div>
            <p className="text-xs text-indigo-200">Profile Completeness</p>
            <p className="text-2xl font-extrabold text-emerald-300">
              {profileCompleteness}%
            </p>
          </div>
          <Link
            href="/profile"
            className="px-3.5 py-2 rounded-xl bg-white text-indigo-950 text-xs font-bold hover:bg-indigo-50 transition"
          >
            Update Profile
          </Link>
        </div>
      </div>

      {/* Provider Status & Refresh */}
      <div className="rounded-2xl bg-white border border-indigo-100 px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {providers.map((p) => (
            <span
              key={p.id}
              className={`px-2.5 py-1 rounded-full font-bold ${
                p.ok
                  ? p.dataSourceType === "DEMO"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-indigo-50 text-indigo-800 border border-indigo-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {p.name.split("(")[0].trim()}: {p.ok ? `${p.count}` : "Unavailable"}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void loadScholarships()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition self-start lg:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Sources
        </button>
      </div>

      {/* Safety & Fee Warning */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Safety &amp; Verification Notice:</strong> Legitimate government and
          CSR scholarships never charge a registration fee. FormSaathi never collects
          Aadhaar/bank details or submits forms automatically — always verify current
          dates and apply on the official portal.
        </p>
      </div>

      {/* Tabs + Search + Filters */}
      <div className="rounded-3xl bg-white border border-indigo-100 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all", label: "All Sources" },
              { id: "recommended", label: "Recommended For You" },
              { id: "Government", label: "Government" },
              { id: "West Bengal", label: "West Bengal" },
              { id: "Corporate", label: "Corporate / CSR" },
              { id: "Engineering", label: "Engineering" },
              { id: "Merit", label: "Merit" },
              { id: "Research", label: "Research & PG" },
              { id: "demo", label: "Demo Practice" },
              { id: "saved", label: `Saved (${savedScholarships.length})` },
            ] as Array<{ id: ScholarshipTab; label: string }>
          ).map((tItem) => (
            <button
              key={tItem.id}
              type="button"
              onClick={() => setTab(tItem.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                tab === tItem.id
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs"
                  : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
              }`}
            >
              {tItem.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SVMCM, NSP, HDFC..."
              aria-label="Search scholarships"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-indigo-100 bg-indigo-50/40 text-xs sm:text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            aria-label="Filter by state"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="rounded-xl border border-indigo-100 bg-white px-2.5 py-2 text-xs font-semibold text-indigo-950"
          >
            <option value="all">All States</option>
            {STATE_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by degree"
            value={degreeFilter}
            onChange={(e) => setDegreeFilter(e.target.value)}
            className="rounded-xl border border-indigo-100 bg-white px-2.5 py-2 text-xs font-semibold text-indigo-950"
          >
            <option value="all">All Degrees</option>
            {COURSE_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by academic year"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-xl border border-indigo-100 bg-white px-2.5 py-2 text-xs font-semibold text-indigo-950"
          >
            <option value="all">All Academic Years</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by income"
            value={incomeFilter}
            onChange={(e) => setIncomeFilter(e.target.value)}
            className="rounded-xl border border-indigo-100 bg-white px-2.5 py-2 text-xs font-semibold text-indigo-950"
          >
            <option value="all">All Income Brackets</option>
            {INCOME_OPTIONS.map((inc) => (
              <option key={inc.value} value={inc.value}>
                {inc.value}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by institution type"
            value={instFilter}
            onChange={(e) => setInstFilter(e.target.value)}
            className="rounded-xl border border-indigo-100 bg-white px-2.5 py-2 text-xs font-semibold text-indigo-950"
          >
            <option value="all">All Institution Types</option>
            {INSTITUTION_OPTIONS.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by application status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | ScholarshipApplicationStatus)
            }
            className="rounded-xl border border-indigo-100 bg-white px-2.5 py-2 text-xs font-semibold text-indigo-950"
          >
            <option value="all">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="UPCOMING">UPCOMING</option>
            <option value="UNVERIFIED">UNVERIFIED (Check Portal)</option>
            <option value="INFORMATION_ONLY">INFORMATION ONLY</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <select
            aria-label="Filter by sponsor"
            value={sponsorFilter}
            onChange={(e) => setSponsorFilter(e.target.value)}
            className="rounded-xl border border-indigo-100 bg-white px-2.5 py-2 text-xs font-semibold text-indigo-950"
          >
            <option value="all">All Sponsors</option>
            {sponsors.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={hideNotEligible}
            onChange={(e) => setHideNotEligible(e.target.checked)}
            className="rounded text-indigo-600"
          />
          Hide schemes where my profile does not meet mandatory criteria
        </label>
      </div>

      {/* Loading / Error / Empty / List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-56 rounded-3xl bg-white border border-indigo-100 p-6 animate-pulse space-y-3"
            >
              <div className="h-4 w-28 bg-indigo-100 rounded" />
              <div className="h-5 w-3/4 bg-indigo-100 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-3xl bg-rose-50 border border-rose-200 p-6 text-sm text-rose-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadScholarships()}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white border border-indigo-100 p-10 text-center space-y-3">
          <p className="text-base font-bold text-indigo-950">
            No scholarships match your current filters
          </p>
          <p className="text-sm text-slate-500">
            Try resetting filters or switching to &ldquo;All Sources&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setTab("all");
              setQuery("");
              setStateFilter("all");
              setDegreeFilter("all");
              setYearFilter("all");
              setIncomeFilter("all");
              setInstFilter("all");
              setStatusFilter("all");
              setSponsorFilter("all");
              setHideNotEligible(false);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map(({ sch, match }) => {
            const isSaved = savedScholarships.includes(sch.id);
            const tracking = applicationTracking[sch.id];
            const isEditingNotes = editingNotesId === sch.id;
            const legacyDemo = sch.isDemo
              ? SCHOLARSHIPS.find((d) => d.id === sch.id)
              : undefined;

            return (
              <article
                key={sch.id}
                className="rounded-3xl bg-white border border-indigo-100 shadow-sm hover:shadow-md transition p-5 sm:p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          sch.dataSourceType === "DEMO"
                            ? "bg-amber-100 text-amber-800"
                            : sch.dataSourceType === "VERIFIED INFORMATION"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {sch.dataSourceType}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {sch.category}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          match.status === "INDICATIVE_MATCH"
                            ? "bg-emerald-100 text-emerald-800"
                            : match.status === "NEEDS_INFORMATION" ||
                              match.status === "NEEDS_VERIFICATION"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {match.percentage}% •{" "}
                        {match.status === "INDICATIVE_MATCH"
                          ? "Indicative Match"
                          : match.status === "NEEDS_INFORMATION"
                          ? "NEEDS INFORMATION"
                          : match.status === "NEEDS_VERIFICATION"
                          ? "NEEDS VERIFICATION"
                          : match.status}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSaveScholarship(sch.id)}
                      aria-label={isSaved ? "Remove saved scholarship" : "Save scholarship"}
                      className={`p-2 rounded-xl transition ${
                        isSaved
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-indigo-50 text-slate-500"
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? "fill-indigo-600" : ""}`} />
                    </button>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      {sch.category === "Corporate" ? (
                        <Building2 className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-indigo-950 leading-snug">
                        {sch.title}
                      </h2>
                      <p className="text-xs text-slate-500">{sch.provider}</p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {sch.description}
                  </p>

                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900">
                      Support: {sch.amountLabel}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      Window: {sch.deadline ? `Deadline ${sch.deadline}` : sch.applicationStatus}
                    </span>
                  </div>

                  {/* Match Explanation */}
                  <div className="rounded-2xl bg-indigo-50/40 border border-indigo-100 p-3 space-y-1 text-xs">
                    {match.satisfied.map((s, i) => (
                      <p key={`s-${i}`} className="text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {s}
                      </p>
                    ))}
                    {match.unknown.length > 0 && (
                      <p className="text-sky-800">
                        Missing in My Profile: <strong>{match.unknown.join(", ")}</strong>
                      </p>
                    )}
                    {match.notSatisfied.map((ns, i) => (
                      <p key={`ns-${i}`} className="text-rose-700">
                        • {ns}
                      </p>
                    ))}
                    {match.verifyOnPortal.length > 0 && (
                      <p className="text-slate-600 pt-1 border-t border-indigo-100/70">
                        Verify on portal: {match.verifyOnPortal.slice(0, 2).join(" • ")}
                      </p>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500">{sch.freshVsRenewalNote}</p>

                  <p className="text-[11px] text-slate-400">
                    Source:{" "}
                    <a
                      href={sch.officialSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-indigo-700"
                    >
                      {sch.sourceName}
                    </a>{" "}
                    • Verified: {sch.lastVerifiedAt}
                  </p>
                </div>

                {/* Tracking & Official Portal Footer */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Application status for ${sch.title}`}
                        value={tracking?.status || ""}
                        onChange={(e) => {
                          const val = e.target.value as ApplicationTrackingStatus | "";
                          if (!val) {
                            removeOpportunityTracking(sch.id);
                          } else {
                            updateOpportunityTracking(sch.id, sch.title, val);
                          }
                        }}
                        className="rounded-xl border border-indigo-200 bg-indigo-50/50 px-3 py-1.5 text-xs font-bold text-indigo-950"
                      >
                        <option value="">Track Status...</option>
                        {TRACKING_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          if (isEditingNotes) {
                            setEditingNotesId(null);
                          } else {
                            setEditingNotesId(sch.id);
                            setNotesDraft(tracking?.notes || "");
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        Notes
                      </button>

                      {tracking && (
                        <button
                          type="button"
                          onClick={() => removeOpportunityTracking(sch.id)}
                          aria-label="Remove tracking"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {legacyDemo ? (
                      <button
                        type="button"
                        onClick={() => setSelectedScholarship(legacyDemo)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold"
                      >
                        {t(UI_TEXT.common.viewDetails, lang)}
                      </button>
                    ) : (
                      sch.applicationUrl && (
                        <a
                          href={sch.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-xs"
                        >
                          Visit Official Portal
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )
                    )}
                  </div>

                  {isEditingNotes && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        placeholder="Add personal scholarship notes..."
                        className="flex-1 rounded-xl border border-indigo-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateOpportunityTracking(
                            sch.id,
                            sch.title,
                            tracking?.status || "interested",
                            notesDraft
                          );
                          setEditingNotesId(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
