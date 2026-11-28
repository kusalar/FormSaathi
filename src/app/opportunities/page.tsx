"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Compass,
  Search,
  Bookmark,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  FileEdit,
  Trash2,
  ShieldAlert,
  RefreshCw,
  Radio,
  Building2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  APPROVED_OUTBOUND_DIRECTORIES,
  DEMO_OPPORTUNITIES,
} from "@/lib/opportunities/sources";
import { isOpportunityExpired, matchOpportunity } from "@/lib/opportunities/matcher";
import {
  ApplicationTrackingStatus,
  CompetitionSubCategory,
  EngineeringDomainType,
  ExperienceClassification,
  JobCategoryGroup,
  Opportunity,
  WorkMode,
} from "@/types";
import type { ProviderStatusSummary } from "@/lib/opportunities/providers/aggregator";

type TabType =
  | "all"
  | "scholarship"
  | "internship"
  | "research"
  | "job"
  | "competition"
  | "saved"
  | "history";
type DomainFilterType = "all" | "indian_official" | EngineeringDomainType;

const VALID_TABS = new Set<TabType>([
  "all",
  "scholarship",
  "internship",
  "research",
  "job",
  "competition",
  "saved",
  "history",
]);

function isResearchOpportunity(opp: Opportunity): boolean {
  if (opp.category === "research" || opp.category === "fellowship") return true;
  if (opp.engineeringDomain === "research") return true;
  if (
    opp.competitionSubCategory === "research_competition" ||
    opp.competitionSubCategory === "fellowship"
  ) {
    return true;
  }
  const text = `${opp.title} ${opp.description}`.toLowerCase();
  return (
    text.includes("research intern") ||
    text.includes("summer research") ||
    text.includes("research fellowship") ||
    text.includes("undergraduate research")
  );
}

const STATUS_OPTIONS: Array<{ value: ApplicationTrackingStatus; label: string }> = [
  { value: "interested", label: "Interested" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
];

interface LiveInternshipsState {
  items: Opportunity[];
  providers: ProviderStatusSummary[];
  isLive: boolean;
  loading: boolean;
  error: string | null;
  fetchedAt: string | null;
  totalCount: number;
  page: number;
}

function OpportunitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get("category") as TabType | null;
  const tab: TabType =
    rawCategory && VALID_TABS.has(rawCategory) ? rawCategory : "internship";

  const handleSelectTab = useCallback(
    (nextTab: TabType) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", nextTab);
      router.push(`/opportunities?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const {
    profile,
    profileCompleteness,
    savedScholarships,
    toggleSaveScholarship,
    applicationTracking,
    updateOpportunityTracking,
    removeOpportunityTracking,
    showToast,
  } = useApp();

  const [internshipSourceMode, setInternshipSourceMode] = useState<"live" | "demo">("live");
  const [liveState, setLiveState] = useState<LiveInternshipsState>({
    items: [],
    providers: [],
    isLive: false,
    loading: true,
    error: null,
    fetchedAt: null,
    totalCount: 0,
    page: 1,
  });

  const [liveJobsState, setLiveJobsState] = useState<LiveInternshipsState>({
    items: [],
    providers: [],
    isLive: false,
    loading: true,
    error: null,
    fetchedAt: null,
    totalCount: 0,
    page: 1,
  });

  const [liveCompState, setLiveCompState] = useState<LiveInternshipsState>({
    items: [],
    providers: [],
    isLive: false,
    loading: true,
    error: null,
    fetchedAt: null,
    totalCount: 0,
    page: 1,
  });

  const [todayIso, setTodayIso] = useState<string | undefined>(undefined);
  const [domainFilter, setDomainFilter] = useState<DomainFilterType>("all");
  const [jobCategoryFilter, setJobCategoryFilter] = useState<"all" | JobCategoryGroup>("all");
  const [experienceFilter, setExperienceFilter] = useState<"all" | ExperienceClassification>("all");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>("all");
  const [compSubCatFilter, setCompSubCatFilter] = useState<"all" | CompetitionSubCategory>("all");
  const [beginnerOnly, setBeginnerOnly] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [countryScope, setCountryScope] = useState<"IN" | "all">("IN");
  const [workModeFilter, setWorkModeFilter] = useState<"all" | WorkMode>("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState<"all" | "has_deadline">("all");
  const [showExpiredOrIneligible, setShowExpiredOrIneligible] = useState(false);

  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const fetchLiveInternships = useCallback(
    async (opts?: { page?: number; refresh?: boolean; q?: string; country?: "IN" | "all" }) => {
      const targetPage = opts?.page ?? 1;
      const targetCountry = opts?.country ?? countryScope;
      const targetQuery = opts?.q ?? query;

      setLiveState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const params = new URLSearchParams();
        params.set("country", targetCountry);
        params.set("page", String(targetPage));
        if (targetQuery.trim()) params.set("q", targetQuery.trim());
        if (opts?.refresh) params.set("refresh", "1");

        const res = await fetch(`/api/internships?${params.toString()}`);
        const data = await res.json();

        setTodayIso(new Date().toISOString().slice(0, 10));
        setLiveState({
          items: Array.isArray(data.opportunities) ? data.opportunities : [],
          providers: Array.isArray(data.providers) ? data.providers : [],
          isLive: Boolean(data.isLive),
          loading: false,
          error: !data.isLive ? "Live API providers temporarily unavailable." : null,
          fetchedAt: data.fetchedAt || null,
          totalCount: Number(data.totalCount || 0),
          page: Number(data.page || targetPage),
        });

        if (opts?.refresh) {
          showToast("Internships refreshed", "Updated from live & official sources.", "success");
        }
      } catch {
        setLiveState((prev) => ({
          ...prev,
          loading: false,
          isLive: false,
          error: "Network error while contacting internship providers.",
        }));
      }
    },
    [countryScope, query, showToast]
  );

  const fetchLiveJobs = useCallback(
    async (opts?: { page?: number; refresh?: boolean; q?: string; country?: "IN" | "all" }) => {
      const targetPage = opts?.page ?? 1;
      const targetCountry = opts?.country ?? countryScope;
      const targetQuery = opts?.q ?? query;

      setLiveJobsState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const params = new URLSearchParams();
        params.set("country", targetCountry);
        params.set("page", String(targetPage));
        if (targetQuery.trim()) params.set("q", targetQuery.trim());
        if (opts?.refresh) params.set("refresh", "1");

        const res = await fetch(`/api/jobs?${params.toString()}`);
        const data = await res.json();

        setTodayIso(new Date().toISOString().slice(0, 10));
        setLiveJobsState({
          items: Array.isArray(data.opportunities) ? data.opportunities : [],
          providers: Array.isArray(data.providers) ? data.providers : [],
          isLive: Boolean(data.isLive),
          loading: false,
          error: !data.isLive ? "Live job API providers temporarily unavailable." : null,
          fetchedAt: data.fetchedAt || null,
          totalCount: Number(data.totalCount || 0),
          page: Number(data.page || targetPage),
        });

        if (opts?.refresh) {
          showToast("Jobs refreshed", "Updated from live & official job sources.", "success");
        }
      } catch {
        setLiveJobsState((prev) => ({
          ...prev,
          loading: false,
          isLive: false,
          error: "Network error while contacting job providers.",
        }));
      }
    },
    [countryScope, query, showToast]
  );

  const fetchLiveCompetitions = useCallback(
    async (opts?: { page?: number; refresh?: boolean; q?: string; country?: "IN" | "all" }) => {
      const targetPage = opts?.page ?? 1;
      const targetCountry = opts?.country ?? countryScope;
      const targetQuery = opts?.q ?? query;

      setLiveCompState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const params = new URLSearchParams();
        params.set("country", targetCountry);
        params.set("page", String(targetPage));
        if (targetQuery.trim()) params.set("q", targetQuery.trim());
        if (opts?.refresh) params.set("refresh", "1");

        const res = await fetch(`/api/competitions?${params.toString()}`);
        const data = await res.json();

        setTodayIso(new Date().toISOString().slice(0, 10));
        setLiveCompState({
          items: Array.isArray(data.opportunities) ? data.opportunities : [],
          providers: Array.isArray(data.providers) ? data.providers : [],
          isLive: Boolean(data.isLive),
          loading: false,
          error: !data.isLive ? "Live competition API temporarily unavailable." : null,
          fetchedAt: data.fetchedAt || null,
          totalCount: Number(data.totalLiveCount || 0),
          page: Number(data.page || targetPage),
        });
      } catch {
        setLiveCompState((prev) => ({
          ...prev,
          loading: false,
          isLive: false,
          error: "Network error while contacting competition providers.",
        }));
      }
    },
    [countryScope, query]
  );

  useEffect(() => {
    if (internshipSourceMode === "live") {
      const timer = setTimeout(() => {
        void fetchLiveInternships({ page: 1, country: countryScope });
        void fetchLiveJobs({ page: 1, country: countryScope });
        void fetchLiveCompetitions({ page: 1, country: countryScope });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [internshipSourceMode, countryScope, fetchLiveInternships, fetchLiveJobs, fetchLiveCompetitions]);

  const combinedOpportunities = useMemo(() => {
    const demoScholarships = DEMO_OPPORTUNITIES.filter((o) => o.category === "scholarship");
    const internships =
      internshipSourceMode === "live"
        ? liveState.items
        : DEMO_OPPORTUNITIES.filter((o) => o.category === "internship");
    const jobs =
      internshipSourceMode === "live"
        ? liveJobsState.items
        : DEMO_OPPORTUNITIES.filter((o) => o.category === "job");
    const comps =
      internshipSourceMode === "live"
        ? liveCompState.items
        : liveCompState.items.filter((o) => o.isDemo);
    return [...internships, ...jobs, ...comps, ...demoScholarships];
  }, [internshipSourceMode, liveState.items, liveJobsState.items, liveCompState.items]);

  const enriched = useMemo(() => {
    return combinedOpportunities
      .map((opp) => ({
        opp,
        match: matchOpportunity(profile, opp, todayIso),
        expired: isOpportunityExpired(opp, todayIso),
      }))
      .sort((a, b) => b.match.percentage - a.match.percentage);
  }, [combinedOpportunities, profile, todayIso]);

  const activeMatching = useMemo(
    () =>
      enriched.filter(
        (item) => !item.expired && item.match.eligibilityStatus !== "ineligible"
      ),
    [enriched]
  );

  const counts = useMemo(() => {
    return {
      total: activeMatching.length,
      scholarship: activeMatching.filter((i) => i.opp.category === "scholarship").length,
      internship: activeMatching.filter((i) => i.opp.category === "internship").length,
      research: activeMatching.filter((i) => isResearchOpportunity(i.opp)).length,
      job: activeMatching.filter((i) => i.opp.category === "job").length,
      competition: activeMatching.filter((i) =>
        ["hackathon", "competition", "ambassador", "fellowship"].includes(i.opp.category)
      ).length,
    };
  }, [activeMatching]);

  const locations = useMemo(() => {
    return Array.from(new Set(combinedOpportunities.map((o) => o.location))).sort();
  }, [combinedOpportunities]);

  const sourcesList = useMemo(() => {
    return Array.from(new Set(combinedOpportunities.map((o) => o.sourceName))).sort();
  }, [combinedOpportunities]);

  const filtered = useMemo(() => {
    return enriched.filter(({ opp, match, expired }) => {
      if (tab === "saved" && !savedScholarships.includes(opp.id)) return false;
      if (tab === "history" && !applicationTracking[opp.id]) return false;
      if (
        (tab === "scholarship" || tab === "internship" || tab === "job") &&
        opp.category !== tab
      ) {
        return false;
      }
      if (tab === "research" && !isResearchOpportunity(opp)) {
        return false;
      }
      if (
        tab === "competition" &&
        !["hackathon", "competition", "ambassador", "fellowship"].includes(opp.category)
      ) {
        return false;
      }

      if (
        !showExpiredOrIneligible &&
        tab !== "history" &&
        tab !== "saved" &&
        (expired || match.eligibilityStatus === "ineligible")
      ) {
        return false;
      }

      if (domainFilter === "indian_official") {
        if (opp.indiaEligibility !== "india_based" && opp.sourceBadge !== "OFFICIAL SOURCE") {
          return false;
        }
      } else if (domainFilter !== "all" && opp.engineeringDomain !== domainFilter) {
        return false;
      }

      if (sourceFilter !== "all" && opp.sourceName !== sourceFilter) return false;
      if (workModeFilter !== "all" && opp.workMode !== workModeFilter) return false;
      if (locationFilter !== "all" && opp.location !== locationFilter) return false;
      if (deadlineFilter === "has_deadline" && !opp.deadline) return false;
      if (tab === "competition") {
        if (
          compSubCatFilter !== "all" &&
          opp.competitionSubCategory !== compSubCatFilter
        ) {
          return false;
        }
        if (beginnerOnly && !opp.beginnerFriendly) {
          return false;
        }
      }
      if (tab === "job") {
        if (jobCategoryFilter !== "all" && opp.jobCategoryGroup !== jobCategoryFilter) {
          return false;
        }
        if (
          experienceFilter !== "all" &&
          opp.experienceClassification !== experienceFilter
        ) {
          return false;
        }
        if (
          employmentTypeFilter !== "all" &&
          (opp.employmentType || "Full-time") !== employmentTypeFilter
        ) {
          return false;
        }
      }

      const q = query.trim().toLowerCase();
      if (q) {
        const hay = `${opp.title} ${opp.organisation} ${opp.description} ${opp.requiredSkills.join(" ")} ${opp.requiredBranches.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    enriched,
    tab,
    savedScholarships,
    applicationTracking,
    showExpiredOrIneligible,
    domainFilter,
    jobCategoryFilter,
    experienceFilter,
    employmentTypeFilter,
    compSubCatFilter,
    beginnerOnly,
    sourceFilter,
    workModeFilter,
    locationFilter,
    deadlineFilter,
    query,
  ]);

  const trackingList = Object.values(applicationTracking).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 text-white p-6 sm:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-indigo-100">
              <Compass className="w-3.5 h-3.5 text-amber-300" />
              Indian Engineering &amp; Global Remote Discovery
            </span>
            {internshipSourceMode === "live" && liveState.isLive && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-xs font-bold text-emerald-200">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                LIVE API + OFFICIAL SOURCES
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Opportunities For You{profile.name && profile.name !== "GUEST" ? `, ${profile.name}` : ""}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl">
            Multi-provider discovery combining live APIs (Himalayas, Remotive) and
            official Indian portals (AICTE, ISRO, DRDO, CSIR, IITs, IASc SRFP).
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

      {/* Multi-Provider Status & Refresh Bar */}
      <div className="rounded-2xl bg-white border border-indigo-100 px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {internshipSourceMode === "live" ? (
            liveState.providers.length > 0 ? (
              liveState.providers.map((p) => (
                <span
                  key={p.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold ${
                    p.ok
                      ? p.isLive
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-indigo-50 text-indigo-800 border border-indigo-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {p.name}: {p.ok ? `${p.count} loaded` : "Unavailable"}
                </span>
              ))
            ) : (
              <span className="text-indigo-700 font-semibold">
                Connecting to internship providers...
              </span>
            )
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
              DEMO MODE: Local demonstration catalog
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-indigo-50 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setInternshipSourceMode("live")}
              className={`px-3 py-1 rounded-lg transition ${
                internshipSourceMode === "live"
                  ? "bg-white text-indigo-950 shadow-xs"
                  : "text-indigo-700"
              }`}
            >
              Live + Official
            </button>
            <button
              type="button"
              onClick={() => setInternshipSourceMode("demo")}
              className={`px-3 py-1 rounded-lg transition ${
                internshipSourceMode === "demo"
                  ? "bg-white text-indigo-950 shadow-xs"
                  : "text-indigo-700"
              }`}
            >
              Demo Only
            </button>
          </div>

          {internshipSourceMode === "live" && (
            <button
              type="button"
              disabled={liveState.loading || liveJobsState.loading || liveCompState.loading}
              onClick={() => {
                void fetchLiveInternships({ page: liveState.page, refresh: true });
                void fetchLiveJobs({ page: liveJobsState.page, refresh: true });
                void fetchLiveCompetitions({ page: liveCompState.page, refresh: true });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  liveState.loading || liveJobsState.loading ? "animate-spin" : ""
                }`}
              />
              Refresh Live Sources
            </button>
          )}
        </div>
      </div>

      {/* Transparency Banner */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Source Labels:</strong> <strong>LIVE API</strong> entries come from
          Himalayas/Remotive in real time; <strong>OFFICIAL SOURCE</strong> entries link
          directly to verified Indian government/IIT/research portals (check current
          window on the portal); <strong>DEMO</strong> entries are practice examples.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl bg-white border border-indigo-100 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Visible Matching</p>
          <p className="text-2xl font-extrabold text-indigo-950 mt-1">{counts.total}</p>
        </div>
        <div className="rounded-2xl bg-white border border-indigo-100 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            Scholarships (Demo)
          </p>
          <p className="text-2xl font-extrabold text-indigo-700 mt-1">
            {counts.scholarship}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-indigo-100 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            Internships
          </p>
          <p className="text-2xl font-extrabold text-violet-700 mt-1">
            {counts.internship}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-indigo-100 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
            Jobs (Demo)
          </p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{counts.job}</p>
        </div>
      </div>

      {/* Tabs + Engineering Domain Filters + Search */}
      <div className="rounded-3xl bg-white border border-indigo-100 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "internship", label: `Internships (${counts.internship})` },
              { id: "research", label: `Researchships & Fellowships (${counts.research})` },
              { id: "job", label: `Jobs (${counts.job})` },
              { id: "competition", label: `Hackathons & Competitions (${counts.competition})` },
              { id: "all", label: "All Open" },
              { id: "scholarship", label: "Scholarships (Demo)" },
              { id: "saved", label: `Saved (${savedScholarships.length})` },
              { id: "history", label: `Application History (${trackingList.length})` },
            ] as Array<{ id: TabType; label: string }>
          ).map((tItem) => (
            <button
              key={tItem.id}
              type="button"
              onClick={() => handleSelectTab(tItem.id)}
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

        {/* Indian / Engineering / Research Track Pills */}
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "all", label: "All Tracks" },
              { id: "indian_official", label: "Indian Official Portals" },
              { id: "ece_vlsi", label: "ECE / VLSI / Embedded" },
              { id: "research", label: "Research Internships" },
              { id: "cse_software", label: "CSE / Software / AI" },
              { id: "general_engineering", label: "General Engineering" },
            ] as Array<{ id: DomainFilterType; label: string }>
          ).map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDomainFilter(d.id)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition ${
                domainFilter === d.id
                  ? "bg-indigo-950 text-white border-indigo-950"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (internshipSourceMode === "live") {
              if (tab === "job") {
                void fetchLiveJobs({ page: 1, q: query });
              } else if (tab === "competition") {
                void fetchLiveCompetitions({ page: 1, q: query });
              } else {
                void fetchLiveInternships({ page: 1, q: query });
              }
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-2.5"
        >
          <div className="sm:col-span-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Keyword, org, VLSI, Python..."
              aria-label="Search opportunities"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-indigo-100 bg-indigo-50/40 text-xs sm:text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            aria-label="India or Worldwide API scope"
            value={countryScope}
            onChange={(e) => setCountryScope(e.target.value as "IN" | "all")}
            className="sm:col-span-2 rounded-xl border border-indigo-100 bg-white px-2.5 py-2 text-xs font-semibold text-indigo-950"
          >
            <option value="IN">Accepts India (IN)</option>
            <option value="all">Worldwide (All)</option>
          </select>

          <select
            aria-label="Filter by work mode"
            value={workModeFilter}
            onChange={(e) => setWorkModeFilter(e.target.value as "all" | WorkMode)}
            className="sm:col-span-2 rounded-xl border border-indigo-100 bg-white px-2.5 py-2 text-xs font-semibold text-indigo-950"
          >
            <option value="all">All Work Modes</option>
            <option value="On-site">On-site</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Remote">Remote</option>
          </select>

          <select
            aria-label="Filter by location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="sm:col-span-2 rounded-xl border border-indigo-100 bg-white px-2.5 py-2 text-xs font-semibold text-indigo-950"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by source"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="sm:col-span-2 rounded-xl border border-indigo-100 bg-white px-2.5 py-2 text-xs font-semibold text-indigo-950"
          >
            <option value="all">All Sources</option>
            {sourcesList.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="sm:col-span-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3 transition"
          >
            Go
          </button>
        </form>

        {/* Competition-Specific Filters (when Hackathons & Competitions tab is active) */}
        {tab === "competition" && (
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <select
              aria-label="Filter by competition subcategory"
              value={compSubCatFilter}
              onChange={(e) =>
                setCompSubCatFilter(e.target.value as "all" | CompetitionSubCategory)
              }
              className="rounded-xl border border-indigo-100 bg-indigo-50/40 px-2.5 py-2 text-xs font-semibold text-indigo-950"
            >
              <option value="all">All Competition Types</option>
              <option value="hackathon">Hackathons</option>
              <option value="coding_competition">Coding Competitions</option>
              <option value="innovation_challenge">Innovation Challenges</option>
              <option value="student_ambassador">Student Ambassadors</option>
              <option value="fellowship">Fellowships</option>
              <option value="research_competition">Research Competitions</option>
              <option value="entrepreneurship">Entrepreneurship</option>
            </select>

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50/40 border border-indigo-100 text-xs font-semibold text-indigo-950 cursor-pointer">
              <input
                type="checkbox"
                checked={beginnerOnly}
                onChange={(e) => setBeginnerOnly(e.target.checked)}
                className="rounded text-indigo-600"
              />
              Beginner-Friendly Only
            </label>
          </div>
        )}

        {/* Job-Specific Filters (when Jobs tab is active) */}
        {tab === "job" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <select
              aria-label="Filter by job category"
              value={jobCategoryFilter}
              onChange={(e) =>
                setJobCategoryFilter(e.target.value as "all" | JobCategoryGroup)
              }
              className="rounded-xl border border-indigo-100 bg-indigo-50/40 px-2.5 py-2 text-xs font-semibold text-indigo-950"
            >
              <option value="all">All Job Categories</option>
              <option value="software_it">Software &amp; IT</option>
              <option value="ece_electronics">ECE, VLSI &amp; Electronics</option>
              <option value="other_engineering">Other Engineering</option>
              <option value="graduate_programme">Graduate Programmes</option>
            </select>

            <select
              aria-label="Filter by fresher or experience level"
              value={experienceFilter}
              onChange={(e) =>
                setExperienceFilter(
                  e.target.value as "all" | ExperienceClassification
                )
              }
              className="rounded-xl border border-indigo-100 bg-indigo-50/40 px-2.5 py-2 text-xs font-semibold text-indigo-950"
            >
              <option value="all">All Experience Levels</option>
              <option value="explicit_fresher">Fresher Friendly</option>
              <option value="entry_level">Entry-Level</option>
              <option value="experience_unknown">Experience Unknown</option>
              <option value="experience_required">Experience Required</option>
            </select>

            <select
              aria-label="Filter by employment type"
              value={employmentTypeFilter}
              onChange={(e) => setEmploymentTypeFilter(e.target.value)}
              className="rounded-xl border border-indigo-100 bg-indigo-50/40 px-2.5 py-2 text-xs font-semibold text-indigo-950"
            >
              <option value="all">All Employment Types</option>
              <option value="Full Time">Full Time</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Graduate programme">Graduate programme</option>
              <option value="Entry-level">Entry-level</option>
            </select>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={deadlineFilter === "has_deadline"}
              onChange={(e) =>
                setDeadlineFilter(e.target.checked ? "has_deadline" : "all")
              }
              className="rounded text-indigo-600"
            />
            Has explicit deadline
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showExpiredOrIneligible}
              onChange={(e) => setShowExpiredOrIneligible(e.target.checked)}
              className="rounded text-indigo-600"
            />
            Show expired or restricted listings
          </label>
        </div>
      </div>

      {/* Provider Failure Banner (isolated, never hides official sources) */}
      {internshipSourceMode === "live" && liveState.error && (
        <div
          role="alert"
          className="rounded-3xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{liveState.error} Official Indian portal links remain available below.</span>
          </div>
          <button
            type="button"
            onClick={() => void fetchLiveInternships({ page: liveState.page, refresh: true })}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0"
          >
            Retry Live Providers
          </button>
        </div>
      )}

      {/* Loading / Empty / Cards */}
      {internshipSourceMode === "live" && liveState.loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-56 rounded-3xl bg-white border border-indigo-100 p-6 animate-pulse space-y-3"
            >
              <div className="h-4 w-24 bg-indigo-100 rounded" />
              <div className="h-5 w-3/4 bg-indigo-100 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-2/3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white border border-indigo-100 p-10 text-center space-y-3">
          <p className="text-base font-bold text-indigo-950">
            No opportunities match your current filters
          </p>
          <p className="text-sm text-slate-500">
            Try switching tracks, clearing keywords, or selecting &ldquo;Worldwide (All)&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setDomainFilter("all");
              setSourceFilter("all");
              setQuery("");
              setWorkModeFilter("all");
              setLocationFilter("all");
              setDeadlineFilter("all");
              setShowExpiredOrIneligible(false);
              if (internshipSourceMode === "live") {
                void fetchLiveInternships({ page: 1, q: "", country: countryScope });
              }
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filtered.map(({ opp, match }) => {
              const isSaved = savedScholarships.includes(opp.id);
              const tracking = applicationTracking[opp.id];
              const isEditingNotes = editingNotesId === opp.id;
              const badge =
                opp.sourceBadge || (opp.isDemo ? "DEMO" : "LIVE API");

              return (
                <article
                  key={opp.id}
                  className="rounded-3xl bg-white border border-indigo-100 shadow-sm hover:shadow-md transition p-5 sm:p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            badge === "LIVE API"
                              ? "bg-emerald-100 text-emerald-800"
                              : badge === "OFFICIAL SOURCE"
                              ? "bg-indigo-100 text-indigo-800"
                              : badge === "NEEDS VERIFICATION"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {badge}
                        </span>
                        {opp.indiaEligibility === "india_based" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                            INDIA-BASED
                          </span>
                        )}
                        {opp.experienceClassification === "explicit_fresher" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                            FRESHER FRIENDLY
                          </span>
                        )}
                        {opp.experienceClassification === "entry_level" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800">
                            ENTRY LEVEL
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            match.eligibilityStatus === "eligible"
                              ? "bg-emerald-100 text-emerald-800"
                              : match.eligibilityStatus === "needs_verification"
                              ? "bg-sky-100 text-sky-800"
                              : match.eligibilityStatus === "expired"
                              ? "bg-slate-200 text-slate-700"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {match.eligibilityStatus === "eligible"
                            ? `${match.percentage}% Match`
                            : match.eligibilityStatus === "needs_verification"
                            ? `${match.percentage}% • NEEDS VERIFICATION`
                            : match.eligibilityStatus === "expired"
                            ? "Expired"
                            : `${match.percentage}% • Criteria Mismatch`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSaveScholarship(opp.id)}
                        aria-label={isSaved ? "Remove saved opportunity" : "Save opportunity"}
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
                      {opp.companyLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={opp.companyLogo}
                          alt={opp.organisation}
                          className="w-10 h-10 rounded-xl object-contain border border-slate-100 bg-white shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-indigo-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-indigo-950 leading-snug">
                          {opp.title}
                        </h3>
                        <p className="text-xs font-medium text-slate-500">
                          {opp.organisation}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed line-clamp-3">
                      {opp.description}
                    </p>

                    <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        {opp.location} • {opp.workMode}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                        <Clock className="w-3.5 h-3.5 text-violet-500" />
                        {opp.deadline ? `Deadline: ${opp.deadline}` : "Check official window"}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50/70 text-indigo-800">
                        {opp.stipendOrSalary}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-indigo-50/40 border border-indigo-100 p-3 space-y-1.5 text-xs">
                      {match.reasons.map((r, i) => (
                        <p key={`r-${i}`} className="text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {r}
                        </p>
                      ))}
                      {match.verificationNeeded.length > 0 && (
                        <p className="text-sky-800">
                          Needs verification:{" "}
                          <strong>{match.verificationNeeded.join(", ")}</strong>
                        </p>
                      )}
                      {match.gaps.map((g, i) => (
                        <p key={`g-${i}`} className="text-rose-700">
                          • {g}
                        </p>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Source:{" "}
                      {opp.sourceUrl ? (
                        <a
                          href={opp.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-indigo-700"
                        >
                          {opp.sourceName}
                        </a>
                      ) : (
                        opp.sourceName
                      )}{" "}
                      • Verified: {opp.lastVerifiedAt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <select
                          aria-label={`Application status for ${opp.title}`}
                          value={tracking?.status || ""}
                          onChange={(e) => {
                            const val = e.target.value as ApplicationTrackingStatus | "";
                            if (!val) {
                              removeOpportunityTracking(opp.id);
                            } else {
                              updateOpportunityTracking(opp.id, opp.title, val);
                            }
                          }}
                          className="rounded-xl border border-indigo-200 bg-indigo-50/50 px-3 py-1.5 text-xs font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Track Status...</option>
                          {STATUS_OPTIONS.map((opt) => (
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
                              setEditingNotesId(opp.id);
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
                            onClick={() => removeOpportunityTracking(opp.id)}
                            aria-label="Remove tracking"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {opp.applicationUrl && !isOpportunityExpired(opp, todayIso) && (
                        <a
                          href={opp.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-xs"
                        >
                          {badge === "OFFICIAL SOURCE"
                            ? "Visit Official Portal"
                            : badge === "LIVE API"
                            ? `Apply on ${opp.sourceName}`
                            : "View Original"}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {isEditingNotes && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={notesDraft}
                          onChange={(e) => setNotesDraft(e.target.value)}
                          placeholder="Add personal application notes or reminders..."
                          className="flex-1 rounded-xl border border-indigo-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            updateOpportunityTracking(
                              opp.id,
                              opp.title,
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

          {internshipSourceMode === "live" && tab === "internship" && liveState.totalCount > 20 && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={liveState.page <= 1 || liveState.loading}
                onClick={() => void fetchLiveInternships({ page: liveState.page - 1 })}
                className="px-4 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-indigo-900 disabled:opacity-40"
              >
                ← Previous Page
              </button>
              <span className="text-xs font-semibold text-slate-600">
                Page {liveState.page} • {liveState.totalCount} live API listings
              </span>
              <button
                type="button"
                disabled={liveState.page * 20 >= liveState.totalCount || liveState.loading}
                onClick={() => void fetchLiveInternships({ page: liveState.page + 1 })}
                className="px-4 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-indigo-900 disabled:opacity-40"
              >
                Next Page →
              </button>
            </div>
          )}
        </>
      )}

      {/* Approved Outbound Directories */}
      <section className="rounded-3xl bg-white border border-indigo-100 p-5 sm:p-6 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-indigo-950">
          Verified Official Portals &amp; Public Opportunity Directories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {APPROVED_OUTBOUND_DIRECTORIES.map((dir) => (
            <a
              key={dir.name}
              href={dir.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-indigo-50/40 hover:bg-indigo-50 border border-indigo-100 transition flex items-start justify-between gap-2"
            >
              <div>
                <p className="text-xs font-bold text-indigo-950">{dir.name}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">{dir.description}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-slate-500">
          Loading opportunities...
        </div>
      }
    >
      <OpportunitiesContent />
    </Suspense>
  );
}
