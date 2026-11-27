"use client";

import React, { useMemo, useState } from "react";
import { Search, Bookmark, CheckCircle2, AlertCircle, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SCHOLARSHIPS, evaluateEligibility } from "@/lib/scholarships";
import { ScholarshipCategory } from "@/types";
import { t, UI_TEXT } from "@/lib/i18n";

const CATEGORIES: Array<"All" | ScholarshipCategory> = [
  "All",
  "Merit",
  "STEM",
  "State",
  "Means",
  "First-Gen",
];

export default function ScholarshipsPage() {
  const {
    lang,
    profile,
    savedScholarships,
    toggleSaveScholarship,
    setSelectedScholarship,
  } = useApp();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | ScholarshipCategory>("All");
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return SCHOLARSHIPS.filter((s) => {
      if (category !== "All" && s.category !== category) return false;
      const q = query.trim().toLowerCase();
      if (q) {
        const hay = `${s.name.en} ${s.name.hi} ${s.name.bn} ${s.summary.en} ${s.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (onlyEligible) {
        const res = evaluateEligibility(profile, s, lang);
        if (res.status === "not_eligible") return false;
      }
      return true;
    });
  }, [category, query, onlyEligible, profile, lang]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-950">
            {t(UI_TEXT.nav.scholarships, lang)}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Explore clearly labelled demonstration scholarships and test your eligibility.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-semibold text-indigo-950 cursor-pointer shadow-xs">
          <input
            type="checkbox"
            checked={onlyEligible}
            onChange={(e) => setOnlyEligible(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500"
          />
          Hide mismatched schemes
        </label>
      </div>

      {/* Demo Warning */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>{t(UI_TEXT.demoBanner, lang)}</p>
      </div>

      {/* Search + Category Pills */}
      <div className="rounded-3xl bg-white border border-indigo-100 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by course, STEM, merit, state, first-gen..."
            aria-label="Search scholarships"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40 text-sm text-indigo-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                category === cat
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                  : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-white border border-indigo-100 p-10 text-center space-y-3">
          <p className="text-base font-bold text-indigo-950">
            No matching demonstration scholarships found
          </p>
          <p className="text-sm text-slate-500">
            Try clearing your search or switching back to &ldquo;All&rdquo; categories.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("All");
              setOnlyEligible(false);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((s) => {
            const elig = evaluateEligibility(profile, s, lang);
            const isSaved = savedScholarships.includes(s.id);
            const isExpanded = expandedId === s.id;

            return (
              <article
                key={s.id}
                className="rounded-3xl bg-white border border-indigo-100 shadow-sm hover:shadow-md transition p-5 sm:p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        {t(UI_TEXT.common.demoTag, lang)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800">
                        {s.category}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSaveScholarship(s.id)}
                      aria-label={isSaved ? "Remove bookmark" : "Save scholarship"}
                      className="p-2 rounded-xl hover:bg-indigo-50 text-indigo-600 transition"
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isSaved ? "fill-indigo-600" : ""}`}
                      />
                    </button>
                  </div>

                  <h2 className="text-lg font-bold text-indigo-950 mt-3">
                    {t(s.name, lang)}
                  </h2>
                  <p className="text-xs text-slate-500">{t(s.provider, lang)}</p>

                  <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                    {t(s.summary, lang)}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-indigo-700">
                      {t(s.amountLabel, lang)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded-full ${
                        elig.status === "eligible"
                          ? "bg-emerald-50 text-emerald-700"
                          : elig.status === "partial"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {elig.status === "eligible" ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      {elig.status === "eligible"
                        ? "Indicative Match (Demo)"
                        : elig.status === "partial"
                        ? "Needs Profile Info"
                        : "Criteria Mismatch"}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-indigo-50 space-y-2 text-xs text-slate-600">
                      <p className="font-bold text-indigo-950">Key Criteria:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {s.eligibilityCriteria.courses.length > 0 && (
                          <li>Courses: {s.eligibilityCriteria.courses.join(", ")}</li>
                        )}
                        {s.eligibilityCriteria.maxIncomeLakh && (
                          <li>
                            Max Income: ₹{s.eligibilityCriteria.maxIncomeLakh} Lakh / year
                          </li>
                        )}
                        <li>Documents Required: {s.requiredDocuments.length}</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedScholarship(s)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-sm transition"
                  >
                    {t(UI_TEXT.common.viewDetails, lang)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold inline-flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        Less <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        More <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
