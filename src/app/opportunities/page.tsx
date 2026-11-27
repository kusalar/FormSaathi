"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  APPROVED_OUTBOUND_DIRECTORIES,
  DEMO_OPPORTUNITIES,
} from "@/lib/opportunities/sources";
import { isOpportunityExpired, matchOpportunity } from "@/lib/opportunities/matcher";
import { ApplicationTrackingStatus, Opportunity, WorkMode } from "@/types";

type TabType = "all" | "scholarship" | "internship" | "job" | "saved" | "history";

const STATUS_OPTIONS: Array<{ value: ApplicationTrackingStatus; label: string }> = [
  { value: "interested", label: "Interested" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
];

interface LiveInternshipsState {
  items: Opportunity[];
  isLive: boolean;
  loading: boolean;
  error: string | null;
  fetchedAt: string | null;
  totalCount: number;
  page: number;
  cached: boolean;
}

export default function OpportunitiesPage() {
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
    isLive: false,
    loading: true,
    error: null,
    fetchedAt: null,
    totalCount: 0,
    page: 1,
    cached: false,
  });

  const [todayIso, setTodayIso] = useState<string | undefined>(undefined);
  const [tab, setTab] = useState<TabType>("internship");
  const [query, setQuery] = useState("");
  const [countryScope, setCountryScope] = useState<"IN" | "all">("IN");
  const [workModeFilter, setWorkModeFilter] = useState<"all" | WorkMode>("all");
  const [locationFilter, setLocationFilter] = useState("all");
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

        if (!res.ok || !data.ok) {
          setLiveState((prev) => ({
            ...prev,
            loading: false,
            isLive: false,
            items: [],
            error: data.error || "Live internship provider is temporarily unavailable.",
            fetchedAt: data.lastSuccessfulFetchAt || prev.fetchedAt,
          }));
          return;
        }

        setTodayIso(new Date().toISOString().slice(0, 10));
        setLiveState({
          items: Array.isArray(data.opportunities) ? data.opportunities : [],
          isLive: Boolean(data.isLive),
          loading: false,
          error: null,
          fetchedAt: data.fetchedAt || null,
          totalCount: Number(data.totalCount || 0),
          page: Number(data.page || targetPage),
          cached: Boolean(data.cached),
        });
        if (opts?.refresh) {
          showToast("Internships refreshed", "Fetched latest listings from Himalayas.", "success");
        }
      } catch {
        setLiveState((prev) => ({
          ...prev,
          loading: false,
          isLive: false,
          items: [],
          error: "Network error while contacting live internship service.",
        }));
      }
    },
    [countryScope, query, showToast]
  );

  useEffect(() => {
    if (internshipSourceMode === "live") {
      const timer = setTimeout(() => {
        void fetchLiveInternships({ page: 1, country: countryScope });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [internshipSourceMode, countryScope, fetchLiveInternships]);

  // Combine demo scholarships/jobs with either live Himalayas internships or demo internships
  const combinedOpportunities = useMemo(() => {
    const demoNonInterns = DEMO_OPPORTUNITIES.filter((o) => o.category !== "internship");
    const internships =
      internshipSourceMode === "live"
        ? liveState.items
        : DEMO_OPPORTUNITIES.filter((o) => o.category === "internship");
    return [...internships, ...demoNonInterns];
  }, [internshipSourceMode, liveState.items]);

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
      job: activeMatching.filter((i) => i.opp.category === "job").length,
    };
  }, [activeMatching]);

  const locations = useMemo(() => {
    return Array.from(new Set(combinedOpportunities.map((o) => o.location))).sort();
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

      if (
        !showExpiredOrIneligible &&
        tab !== "history" &&
        tab !== "saved" &&
        (expired || match.eligibilityStatus === "ineligible")
      ) {
        return false;
      }

      if (workModeFilter !== "all" && opp.workMode !== workModeFilter) return false;
      if (locationFilter !== "all" && opp.location !== locationFilter) return false;

      const q = query.trim().toLowerCase();
      if (q && opp.category !== "internship") {
        const hay = `${opp.title} ${opp.organisation} ${opp.description} ${opp.requiredSkills.join(" ")} ${opp.requiredBranches.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (q && opp.category === "internship" && internshipSourceMode === "demo") {
        const hay = `${opp.title} ${opp.organisation} ${opp.description} ${opp.requiredSkills.join(" ")}`.toLowerCase();
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
    workModeFilter,
    locationFilter,
    query,
    internshipSourceMode,
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
              Personalised Discovery Engine
            </span>
            {internshipSourceMode === "live" && liveState.isLive && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-xs font-bold text-emerald-200">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                LIVE SOURCE • Himalayas
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Opportunities For You{profile.name && profile.name !== "GUEST" ? `, ${profile.name}` : ""}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl">
            Live remote internships from{" "}
            <a
              href="https://himalayas.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-white"
            >
              Himalayas
            </a>{" "}
            plus demonstration scholarships and entry-level jobs matched against your profile.
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

      {/* Live Source Attribution & Refresh Bar */}
      <div className="rounded-2xl bg-white border border-indigo-100 px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {internshipSourceMode === "live" ? (
            liveState.isLive ? (
              <>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  LIVE SOURCE: Himalayas
                </span>
                <span className="text-slate-600">
                  {liveState.totalCount.toLocaleString()} total internships • Last fetched:{" "}
                  {liveState.fetchedAt
                    ? new Date(liveState.fetchedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Just now"}
                  {liveState.cached ? " (cached)" : ""}
                </span>
              </>
            ) : liveState.loading ? (
              <span className="text-indigo-700 font-semibold">
                Fetching live internships from Himalayas...
              </span>
            ) : (
              <span className="text-rose-700 font-semibold">
                Live internships unavailable{liveState.fetchedAt ? ` (last fetch: ${new Date(liveState.fetchedAt).toLocaleTimeString()})` : ""}
              </span>
            )
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              DEMO MODE: Showing local demonstration internships
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
              Live API
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
              disabled={liveState.loading}
              onClick={() => void fetchLiveInternships({ page: liveState.page, refresh: true })}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${liveState.loading ? "animate-spin" : ""}`} />
              Refresh Internships
            </button>
          )}
        </div>
      </div>

      {/* Note on Scholarships & Jobs still being Demo */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Data Transparency:</strong> Internships in <em>Live API</em> mode are
          fetched in real time from Himalayas (refreshed per provider availability and
          5-minute cache). Scholarships and Jobs remain clearly labelled{" "}
          <strong>DEMO</strong> records.
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
            Internships ({internshipSourceMode === "live" ? "Live" : "Demo"})
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

      {/* Tabs + Search + Filters */}
      <div className="rounded-3xl bg-white border border-indigo-100 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "internship", label: `Internships (${counts.internship})` },
              { id: "all", label: "All Open" },
              { id: "scholarship", label: "Scholarships (Demo)" },
              { id: "job", label: "Jobs (Demo)" },
              { id: "saved", label: `Saved (${savedScholarships.length})` },
              { id: "history", label: `Application History (${trackingList.length})` },
            ] as Array<{ id: TabType; label: string }>
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (internshipSourceMode === "live") {
              void fetchLiveInternships({ page: 1, q: query });
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3"
        >
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Python, Web, VLSI, AI..."
              aria-label="Search opportunities"
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-indigo-100 bg-indigo-50/40 text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            aria-label="India or Worldwide scope"
            value={countryScope}
            onChange={(e) => setCountryScope(e.target.value as "IN" | "all")}
            className="sm:col-span-2 rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-indigo-950"
          >
            <option value="IN">Accepts India (IN)</option>
            <option value="all">Worldwide (All)</option>
          </select>

          <select
            aria-label="Filter by work mode"
            value={workModeFilter}
            onChange={(e) => setWorkModeFilter(e.target.value as "all" | WorkMode)}
            className="sm:col-span-2 rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-indigo-950"
          >
            <option value="all">All Work Modes</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          <select
            aria-label="Filter by location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="sm:col-span-2 rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-indigo-950"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="sm:col-span-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3 transition"
          >
            Search API
          </button>
        </form>

        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showExpiredOrIneligible}
            onChange={(e) => setShowExpiredOrIneligible(e.target.checked)}
            className="rounded text-indigo-600"
          />
          Show expired or location-restricted listings
        </label>
      </div>

      {/* Live Error Banner (never fakes live data) */}
      {internshipSourceMode === "live" && liveState.error && (
        <div
          role="alert"
          className="rounded-3xl bg-rose-50 border border-rose-200 p-5 text-sm text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Live Internship Service Temporarily Unavailable</p>
              <p className="text-xs mt-0.5">{liveState.error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void fetchLiveInternships({ page: liveState.page, refresh: true })}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0"
          >
            Retry Live Fetch
          </button>
        </div>
      )}

      {/* Loading / Empty / List */}
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
            Try switching to &ldquo;Worldwide (All)&rdquo;, clearing keywords, or checking
            the Scholarships/Jobs tabs.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setWorkModeFilter("all");
              setLocationFilter("all");
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

              return (
                <article
                  key={opp.id}
                  className="rounded-3xl bg-white border border-indigo-100 shadow-sm hover:shadow-md transition p-5 sm:p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {opp.isDemo ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            DEMO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            LIVE SOURCE
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-indigo-100 text-indigo-800">
                          {opp.category}
                        </span>
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
                            ? `${match.percentage}% • Needs Verification`
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

                    <div>
                      <h3 className="text-lg font-bold text-indigo-950">{opp.title}</h3>
                      <p className="text-xs font-medium text-slate-500">{opp.organisation}</p>
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
                        {opp.deadline ? `Expires: ${opp.deadline}` : "Deadline not specified"}
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
                      • {opp.datePublished ? `Published: ${opp.datePublished} • ` : ""}
                      Verified: {opp.lastVerifiedAt}
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
                          {opp.isDemo ? "View Original" : "Apply on Himalayas"}
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

          {/* Pagination for Live Internships */}
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
                Page {liveState.page} • {liveState.totalCount} total listings
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
        <p className="text-xs text-slate-500">
          Explore live external listings directly on these authorised portals and career platforms:
        </p>
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
