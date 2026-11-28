"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Compass,
  ExternalLink,
  Filter,
  FlaskConical,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  getProfileReadinessTips,
  rankUnifiedOpportunities,
} from "@/lib/opportunities/unified/rank";
import {
  RankedUnifiedOpportunity,
  UnifiedCategory,
  UnifiedDataSourceType,
  UnifiedRecommendationsResponse,
} from "@/lib/opportunities/unified/types";
import { ApplicationTrackingStatus } from "@/types";

type SectionKey =
  | "all"
  | "best_matches"
  | "closing_soon"
  | "recently_added"
  | "scholarships_for_you"
  | "build_your_career"
  | "build_your_portfolio"
  | "student_leadership"
  | "explore_beyond";

const PAGE_SIZE = 20;

const SECTION_TABS: Array<{ key: SectionKey; label: string }> = [
  { key: "all", label: "All Ranked" },
  { key: "best_matches", label: "Best Matches" },
  { key: "closing_soon", label: "Closing Soon" },
  { key: "recently_added", label: "Recently Added" },
  { key: "scholarships_for_you", label: "Scholarships" },
  { key: "build_your_career", label: "Build Your Career" },
  { key: "build_your_portfolio", label: "Portfolio & Hackathons" },
  { key: "student_leadership", label: "Leadership" },
  { key: "explore_beyond", label: "Explore Beyond" },
];

const CATEGORY_LABELS: Record<UnifiedCategory, string> = {
  scholarship: "Scholarship",
  internship: "Internship",
  job: "Job / Fresher",
  hackathon: "Hackathon",
  competition: "Competition",
  ambassador: "Ambassador",
  fellowship: "Fellowship",
  research: "Research",
};

const TRACKING_OPTIONS: Array<{
  value: ApplicationTrackingStatus;
  label: string;
}> = [
  { value: "interested", label: "Interested" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
];

function getSourceBadgeStyle(type: UnifiedDataSourceType): string {
  switch (type) {
    case "LIVE API":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "OFFICIAL SOURCE":
    case "OFFICIAL DIRECTORY":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "VERIFIED INFORMATION":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "DEMO":
      return "bg-amber-50 text-amber-800 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getMatchBadge(status: RankedUnifiedOpportunity["match"]["status"]) {
  switch (status) {
    case "eligible":
      return {
        label: "Likely Eligible",
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        barCls: "bg-emerald-500",
      };
    case "needs_verification":
      return {
        label: "Verify on Portal",
        cls: "bg-amber-50 text-amber-800 border-amber-200",
        barCls: "bg-amber-500",
      };
    case "needs_information":
      return {
        label: "Complete Profile",
        cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
        barCls: "bg-indigo-500",
      };
    case "ineligible":
      return {
        label: "Criteria Mismatch",
        cls: "bg-rose-50 text-rose-700 border-rose-200",
        barCls: "bg-rose-400",
      };
    case "closed":
      return {
        label: "Closed / Expired",
        cls: "bg-slate-100 text-slate-600 border-slate-200",
        barCls: "bg-slate-400",
      };
  }
}

function getCategoryMeta(cat: UnifiedCategory) {
  switch (cat) {
    case "scholarship":
      return {
        icon: GraduationCap,
        iconBox: "bg-indigo-50 text-indigo-600 border-indigo-100",
      };
    case "hackathon":
    case "competition":
      return {
        icon: Trophy,
        iconBox: "bg-amber-50 text-amber-600 border-amber-100",
      };
    case "ambassador":
    case "fellowship":
      return {
        icon: Users,
        iconBox: "bg-violet-50 text-violet-600 border-violet-100",
      };
    case "research":
      return {
        icon: FlaskConical,
        iconBox: "bg-teal-50 text-teal-600 border-teal-100",
      };
    case "job":
    case "internship":
    default:
      return {
        icon: Briefcase,
        iconBox: "bg-sky-50 text-sky-600 border-sky-100",
      };
  }
}

function RecommendationsContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter");
  const initialSection = (searchParams.get("section") as SectionKey) || "all";

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

  const [data, setData] = useState<UnifiedRecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<SectionKey>(
    SECTION_TABS.some((s) => s.key === initialSection) ? initialSection : "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [workModeFilter, setWorkModeFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"best_match" | "deadline_soon" | "newest">(
    "best_match"
  );
  const [savedOnly, setSavedOnly] = useState(initialFilter === "saved");
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      const res = await fetch("/api/recommendations?refresh=1");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json: UnifiedRecommendationsResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load unified recommendations."
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/recommendations")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<UnifiedRecommendationsResponse>;
      })
      .then((json) => {
        if (!active) return;
        setData(json);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load unified recommendations."
        );
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const rankedItems = useMemo(() => {
    if (!data?.items) return [];
    return rankUnifiedOpportunities(data.items, profile, data.todayIso);
  }, [data, profile]);

  const readinessTips = useMemo(
    () => getProfileReadinessTips(profile),
    [profile]
  );

  const sectionCounts = useMemo(() => {
    const counts: Record<SectionKey, number> = {
      all: rankedItems.length,
      best_matches: 0,
      closing_soon: 0,
      recently_added: 0,
      scholarships_for_you: 0,
      build_your_career: 0,
      build_your_portfolio: 0,
      student_leadership: 0,
      explore_beyond: 0,
    };
    for (const item of rankedItems) {
      for (const tag of item.sectionTags) {
        if (tag in counts) {
          counts[tag as SectionKey] += 1;
        }
      }
    }
    return counts;
  }, [rankedItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = rankedItems.filter((item) => {
      if (activeSection !== "all" && !item.sectionTags.includes(activeSection)) {
        return false;
      }
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }
      if (workModeFilter !== "all" && item.workMode !== workModeFilter) {
        return false;
      }
      if (sourceFilter === "live_only" && item.dataSourceType !== "LIVE API") {
        return false;
      }
      if (
        sourceFilter === "official_only" &&
        item.dataSourceType !== "OFFICIAL SOURCE" &&
        item.dataSourceType !== "OFFICIAL DIRECTORY"
      ) {
        return false;
      }
      if (sourceFilter === "hide_demo" && item.isDemo) {
        return false;
      }
      if (savedOnly && !savedScholarships.includes(item.id)) {
        return false;
      }
      if (q) {
        const hay = [
          item.title,
          item.organisation,
          item.location,
          item.subCategory,
          item.description,
          ...item.requiredSkills,
          ...item.requiredBranches,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === "deadline_soon") {
      return [...list].sort((a, b) => {
        if (a.urgencyDays === null && b.urgencyDays === null) {
          return b.rankScore - a.rankScore;
        }
        if (a.urgencyDays === null) return 1;
        if (b.urgencyDays === null) return -1;
        if (a.urgencyDays < 0 && b.urgencyDays >= 0) return 1;
        if (b.urgencyDays < 0 && a.urgencyDays >= 0) return -1;
        return a.urgencyDays - b.urgencyDays;
      });
    }

    if (sortBy === "newest") {
      return [...list].sort((a, b) => {
        const aDate = a.publishedDate || a.lastFetchedAt || "";
        const bDate = b.publishedDate || b.lastFetchedAt || "";
        return bDate.localeCompare(aDate);
      });
    }

    return list;
  }, [
    rankedItems,
    activeSection,
    categoryFilter,
    workModeFilter,
    sourceFilter,
    savedOnly,
    savedScholarships,
    searchQuery,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  const hasActiveFilters =
    activeSection !== "all" ||
    searchQuery.trim() !== "" ||
    categoryFilter !== "all" ||
    workModeFilter !== "all" ||
    sourceFilter !== "all" ||
    savedOnly;

  const resetFilters = () => {
    setActiveSection("all");
    setSearchQuery("");
    setCategoryFilter("all");
    setWorkModeFilter("all");
    setSourceFilter("all");
    setSavedOnly(false);
    setPage(1);
  };

  const kpis = useMemo(() => {
    const eligibleCount = rankedItems.filter(
      (i) => i.match.status === "eligible" && !i.isDemo
    ).length;
    const closingSoonCount = rankedItems.filter((i) => i.isClosingSoon).length;
    const trackedCount = Object.keys(applicationTracking).length;
    return {
      total: rankedItems.length,
      eligibleCount,
      closingSoonCount,
      savedCount: savedScholarships.length,
      trackedCount,
    };
  }, [rankedItems, savedScholarships, applicationTracking]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 sm:p-8 text-white shadow-lg shadow-indigo-950/15">
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-14 w-48 h-48 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-indigo-50 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              Unified Opportunity Intelligence Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              For You{profile.name ? `, ${profile.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm text-indigo-100 leading-relaxed">
              Personalised matches across scholarships, internships, jobs, hackathons, fellowships, and student leadership — ranked for your profile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/25 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh Feed"}
            </button>
            <Link
              href="/opportunities?category=scholarship"
              className="inline-flex items-center gap-2 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2.5 text-sm font-bold shadow-sm transition"
            >
              <Compass className="w-4 h-4" />
              Browse Directories
            </Link>
          </div>
        </div>

        {/* Profile Readiness Strip inside Hero */}
        {readinessTips.length > 0 && (
          <div className="relative mt-6 rounded-2xl bg-white/12 backdrop-blur-sm border border-white/20 p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="px-2.5 py-1 rounded-xl bg-amber-400/20 border border-amber-300/30 text-amber-100 text-xs font-bold shrink-0">
                {profileCompleteness}% Ready
              </div>
              <p className="text-xs sm:text-sm text-indigo-50">
                <span className="font-semibold">Sharpen your matches:</span>{" "}
                {readinessTips[0].tip}
              </p>
            </div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-indigo-950 px-3.5 py-1.5 text-xs font-bold shrink-0 self-start sm:self-auto transition"
            >
              Update Profile
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-xs flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Unified</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {kpis.total}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {data?.deduplicatedRemovedCount
                ? `${data.deduplicatedRemovedCount} duplicates merged`
                : "Across all categories"}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-xs flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">Strong Matches</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              {kpis.eligibleCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Real / official matches
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-xs flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">Closing Soon</p>
            <p className="text-2xl font-extrabold text-amber-700 mt-1">
              {kpis.closingSoonCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Within next 21 days</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CalendarClock className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-xs flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">Saved & Tracked</p>
            <p className="text-2xl font-extrabold text-violet-700 mt-1">
              {kpis.savedCount} <span className="text-slate-300 font-normal">/</span> {kpis.trackedCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Saved / status tracked</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <BookmarkCheck className="w-4.5 h-4.5" />
          </div>
        </div>
      </section>

      {/* Transparent Eligibility Disclaimer */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 flex items-start gap-3">
        <ShieldCheck className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-950/85 leading-relaxed">
          <span className="font-semibold text-indigo-950">Preliminary Match Guidance:</span>{" "}
          Match percentages and eligibility badges are indicative estimates based on your saved profile. Final eligibility, deadlines, stipends, and rules must always be verified on the official portal. Demo items are clearly marked <span className="font-semibold">DEMO</span>.
        </p>
      </div>

      {/* Partial Provider Failure Notice */}
      {data?.partialFailures && data.partialFailures.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Some external feeds were unavailable ({data.partialFailures.join("; ")}). Showing available sources.
          </span>
        </div>
      )}

      {/* Intelligent Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
        {SECTION_TABS.map((sec) => {
          const active = activeSection === sec.key;
          return (
            <button
              key={sec.key}
              type="button"
              onClick={() => {
                setActiveSection(sec.key);
                setPage(1);
              }}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                active
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-sm shadow-indigo-500/20"
                  : "bg-white text-slate-700 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40"
              }`}
            >
              <span>{sec.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {sectionCounts[sec.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search title, company, skill, branch, state..."
              className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by category"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={workModeFilter}
              onChange={(e) => {
                setWorkModeFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by work mode"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Any Mode</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(
                  e.target.value as "best_match" | "deadline_soon" | "newest"
                );
                setPage(1);
              }}
              aria-label="Sort recommendations"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="best_match">Sort: Best Match</option>
              <option value="deadline_soon">Sort: Closing Soon</option>
              <option value="newest">Sort: Recently Added</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Source:
            </span>
            {[
              { key: "all", label: "All Sources" },
              { key: "live_only", label: "Live API" },
              { key: "official_only", label: "Official" },
              { key: "hide_demo", label: "Hide Demo" },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setSourceFilter(opt.key);
                  setPage(1);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer transition ${
                  sourceFilter === opt.key
                    ? "bg-indigo-100 text-indigo-800 font-semibold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSavedOnly((v) => !v);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer border transition ${
                savedOnly
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved Only ({savedScholarships.length})
            </button>
          </div>
        </div>
      </div>

      {/* Feed States */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse space-y-3"
            >
              <div className="flex gap-2">
                <div className="h-5 w-24 rounded-full bg-slate-200" />
                <div className="h-5 w-20 rounded-full bg-slate-100" />
                <div className="h-5 w-28 rounded-full bg-slate-100" />
              </div>
              <div className="h-5 w-2/3 rounded bg-slate-200" />
              <div className="h-4 w-1/3 rounded bg-slate-100" />
              <div className="h-10 w-full rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="text-sm font-semibold text-rose-800">{error}</p>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="mt-3 rounded-xl bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800">
            No opportunities match your current filters.
          </p>
          <p className="text-xs text-slate-500">
            Try switching sections, clearing search text, or turning off Saved Only.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Showing{" "}
              <strong className="text-slate-800">
                {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredItems.length)}
              </strong>{" "}
              of <strong className="text-slate-800">{filteredItems.length}</strong>{" "}
              opportunities
            </span>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="space-y-3.5">
            {paginatedItems.map((item) => {
              const catMeta = getCategoryMeta(item.category);
              const Icon = catMeta.icon;
              const matchBadge = getMatchBadge(item.match.status);
              const isSaved = savedScholarships.includes(item.id);
              const tracking = applicationTracking[item.id];
              const isExpanded = Boolean(expandedIds[item.id]);
              const noteValue =
                noteDrafts[item.id] !== undefined
                  ? noteDrafts[item.id]
                  : tracking?.notes || "";

              return (
                <article
                  key={item.id}
                  className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div
                        className={`hidden sm:flex w-11 h-11 rounded-2xl border items-center justify-center shrink-0 mt-0.5 ${catMeta.iconBox}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="space-y-2.5 flex-1 min-w-0">
                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-800">
                            <Icon className="w-3 h-3 sm:hidden" />
                            {CATEGORY_LABELS[item.category]}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getSourceBadgeStyle(
                              item.dataSourceType
                            )}`}
                          >
                            {item.dataSourceType}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${matchBadge.cls}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${matchBadge.barCls}`}
                            />
                            {item.match.percentage}% • {matchBadge.label}
                          </span>
                          {item.isClosingSoon && item.urgencyDays !== null && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                              <CalendarClock className="w-3 h-3" />
                              {item.urgencyDays === 0
                                ? "Closes Today"
                                : `Closes in ${item.urgencyDays}d`}
                            </span>
                          )}
                        </div>

                        {/* Title & Org */}
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                            {item.title}
                          </h2>
                          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                            {item.organisation} • {item.sourceName}
                          </p>
                        </div>

                        {/* Meta Row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {item.location} ({item.workMode})
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Wallet className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              <strong className="text-slate-700">Benefit:</strong>{" "}
                              {item.stipendOrReward}
                            </span>
                          </span>
                          {item.deadline && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                <strong className="text-slate-700">Deadline:</strong>{" "}
                                {item.deadline}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Plain-language Match Summary */}
                        <p className="text-xs sm:text-sm text-slate-700 bg-indigo-50/45 rounded-xl px-3.5 py-2 border border-indigo-100/70">
                          {item.match.summary}
                        </p>
                      </div>
                    </div>

                    {/* Right Action Column */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            toggleSaveScholarship(item.id);
                            showToast(
                              isSaved
                                ? "Removed from saved"
                                : "Saved to your list",
                              item.title,
                              "info"
                            );
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border cursor-pointer transition ${
                            isSaved
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              isSaved ? "fill-indigo-600" : ""
                            }`}
                          />
                          {isSaved ? "Saved" : "Save"}
                        </button>

                        {(item.applicationUrl || item.officialSourceUrl) && (
                          <a
                            href={
                              item.applicationUrl ||
                              item.officialSourceUrl ||
                              "#"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition"
                          >
                            Official Portal
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Tracking & Details */}
                      <div className="flex items-center gap-2">
                        <select
                          aria-label={`Track status for ${item.title}`}
                          value={tracking?.status || ""}
                          onChange={(e) => {
                            const val = e.target.value as
                              | ApplicationTrackingStatus
                              | "";
                            if (!val) {
                              removeOpportunityTracking(item.id);
                              showToast(
                                "Tracking cleared",
                                item.title,
                                "info"
                              );
                            } else {
                              updateOpportunityTracking(
                                item.id,
                                item.title,
                                val,
                                noteValue
                              );
                              showToast(
                                `Marked as ${val}`,
                                item.title,
                                "success"
                              );
                            }
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                          onClick={() => toggleExpand(item.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                          Details
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-700">
                      <p className="text-slate-600 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-100">
                          <p className="font-semibold text-emerald-900 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Matched Criteria
                          </p>
                          {item.match.reasons.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-0.5 text-emerald-800">
                              {item.match.reasons.map((r, idx) => (
                                <li key={idx}>{r}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-emerald-800">
                              Open or general criteria.
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl bg-amber-50/70 p-3 border border-amber-100">
                          <p className="font-semibold text-amber-900 mb-1 flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5" />
                            Verify on Portal
                          </p>
                          {item.match.verificationNeeded.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
                              {item.match.verificationNeeded.map((v, idx) => (
                                <li key={idx}>{v}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-amber-800">
                              Confirm latest dates &amp; documents on portal.
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl bg-rose-50/70 p-3 border border-rose-100">
                          <p className="font-semibold text-rose-900 mb-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Potential Gaps
                          </p>
                          {item.match.gaps.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-0.5 text-rose-800">
                              {item.match.gaps.map((g, idx) => (
                                <li key={idx}>{g}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-rose-800">No hard gaps detected.</p>
                          )}
                        </div>
                      </div>

                      {/* Personal Notes */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={noteValue}
                          onChange={(e) =>
                            setNoteDrafts((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="Add a personal note (e.g., documents ready, referral needed)..."
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            updateOpportunityTracking(
                              item.id,
                              item.title,
                              tracking?.status || "interested",
                              noteValue
                            );
                            showToast("Note saved", item.title, "success");
                          }}
                          className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <span className="text-xs font-semibold text-slate-600">
                Page {currentPage} of {totalPages} • {filteredItems.length} opportunities
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-slate-500">
          Loading recommendations...
        </div>
      }
    >
      <RecommendationsContent />
    </Suspense>
  );
}
