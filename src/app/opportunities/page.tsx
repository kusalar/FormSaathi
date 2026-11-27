"use client";

import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  APPROVED_OUTBOUND_DIRECTORIES,
  getOpportunitiesFromProviders,
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

export default function OpportunitiesPage() {
  const {
    profile,
    profileCompleteness,
    savedScholarships,
    toggleSaveScholarship,
    applicationTracking,
    updateOpportunityTracking,
    removeOpportunityTracking,
  } = useApp();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isDemoOnly, setIsDemoOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [todayIso, setTodayIso] = useState<string | undefined>(undefined);

  const [tab, setTab] = useState<TabType>("all");
  const [query, setQuery] = useState("");
  const [workModeFilter, setWorkModeFilter] = useState<"all" | WorkMode>("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showExpiredOrIneligible, setShowExpiredOrIneligible] = useState(false);

  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  useEffect(() => {
    let active = true;
    const today = new Date().toISOString().slice(0, 10);
    getOpportunitiesFromProviders()
      .then((res) => {
        if (!active) return;
        setTodayIso(today);
        setOpportunities(res.opportunities);
        setIsDemoOnly(res.isDemoOnly);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadError("Could not load opportunities. Please refresh the page.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const enriched = useMemo(() => {
    return opportunities
      .map((opp) => ({
        opp,
        match: matchOpportunity(profile, opp, todayIso),
        expired: isOpportunityExpired(opp, todayIso),
      }))
      .sort((a, b) => b.match.percentage - a.match.percentage);
  }, [opportunities, profile, todayIso]);

  const activeMatching = useMemo(
    () =>
      enriched.filter(
        (item) =>
          !item.expired && item.match.eligibilityStatus !== "ineligible"
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
    return Array.from(new Set(opportunities.map((o) => o.location))).sort();
  }, [opportunities]);

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
    workModeFilter,
    locationFilter,
    query,
  ]);

  const topRecommended = activeMatching.slice(0, 3);
  const trackingList = Object.values(applicationTracking).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );

  return (
    <div className="space-y-6">
      {/* Header & Personalised Welcome */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 text-white p-6 sm:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-indigo-100">
            <Compass className="w-3.5 h-3.5 text-amber-300" />
            Personalised Discovery Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Opportunities For You{profile.name && profile.name !== "GUEST" ? `, ${profile.name}` : ""}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl">
            Explainable scholarship, internship, and entry-level job recommendations
            matched against your degree, branch, skills, income, and work mode.
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

      {/* Demo Data Notice */}
      {isDemoOnly && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>DEMONSTRATION CATALOG:</strong> Listings below are clearly labelled
            demonstration records to test personalised matching and tracking. Always
            verify live opportunities directly on official portals or career sites.
          </p>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl bg-white border border-indigo-100 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Open Matching</p>
          <p className="text-2xl font-extrabold text-indigo-950 mt-1">{counts.total}</p>
        </div>
        <div className="rounded-2xl bg-white border border-indigo-100 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            Scholarships
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
            Jobs
          </p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{counts.job}</p>
        </div>
      </div>

      {/* Recommended For You Highlight */}
      {!loading && !loadError && topRecommended.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-indigo-950 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            Top Recommended For You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topRecommended.map(({ opp, match }) => (
              <div
                key={`rec-${opp.id}`}
                className="rounded-2xl bg-gradient-to-b from-indigo-50/70 to-white border border-indigo-200 p-4 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800">
                      {opp.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                      {match.percentage}% Match
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-indigo-950">{opp.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{opp.organisation}</p>
                  {match.reasons[0] && (
                    <p className="text-xs text-emerald-700 font-medium mt-2">
                      ✓ {match.reasons[0]}
                    </p>
                  )}
                </div>
                <div className="mt-3 pt-2.5 border-t border-indigo-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-700">{opp.stipendOrSalary}</span>
                  <span className="text-slate-500">{opp.workMode}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tabs + Search + Filters */}
      <div className="rounded-3xl bg-white border border-indigo-100 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all", label: "All Open" },
              { id: "scholarship", label: "Scholarships" },
              { id: "internship", label: "Internships" },
              { id: "job", label: "Jobs" },
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

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skills, ECE, Python, React, state..."
              aria-label="Search opportunities"
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-indigo-100 bg-indigo-50/40 text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

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
            className="sm:col-span-3 rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-indigo-950"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <label className="sm:col-span-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showExpiredOrIneligible}
              onChange={(e) => setShowExpiredOrIneligible(e.target.checked)}
              className="rounded text-indigo-600"
            />
            Show closed
          </label>
        </div>
      </div>

      {/* Loading / Error / Empty / List */}
      {loading ? (
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
      ) : loadError ? (
        <div className="rounded-3xl bg-rose-50 border border-rose-200 p-6 text-sm text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{loadError}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white border border-indigo-100 p-10 text-center space-y-3">
          <p className="text-base font-bold text-indigo-950">
            No opportunities match your current filters
          </p>
          <p className="text-sm text-slate-500">
            Try clearing filters, enabling &ldquo;Show closed&rdquo;, or updating your
            skills and branch in My Profile.
          </p>
          <button
            type="button"
            onClick={() => {
              setTab("all");
              setQuery("");
              setWorkModeFilter("all");
              setLocationFilter("all");
              setShowExpiredOrIneligible(false);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
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
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {opp.isDemo && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          DEMO
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

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {opp.description}
                  </p>

                  {/* Meta Pills */}
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      {opp.location} • {opp.workMode}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                      <Clock className="w-3.5 h-3.5 text-violet-500" />
                      Deadline: {opp.deadline || "Ongoing"}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50/70 text-indigo-800">
                      {opp.stipendOrSalary}
                    </span>
                  </div>

                  {/* Match Explanation */}
                  <div className="rounded-2xl bg-indigo-50/40 border border-indigo-100 p-3 space-y-1.5 text-xs">
                    {match.reasons.map((r, i) => (
                      <p key={`r-${i}`} className="text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {r}
                      </p>
                    ))}
                    {match.verificationNeeded.length > 0 && (
                      <p className="text-sky-800">
                        Needs verification in My Profile:{" "}
                        <strong>{match.verificationNeeded.join(", ")}</strong>
                      </p>
                    )}
                    {match.gaps.map((g, i) => (
                      <p key={`g-${i}`} className="text-rose-700">
                        • {g}
                      </p>
                    ))}
                  </div>

                  {/* Source Attribution */}
                  <p className="text-[11px] text-slate-400">
                    Source: {opp.sourceName} • Last verified: {opp.lastVerifiedAt}
                  </p>
                </div>

                {/* Tracking & Actions Footer */}
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

                    {opp.applicationUrl && !isOpportunityExpired(opp) && (
                      <a
                        href={opp.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-xs"
                      >
                        View Original
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
