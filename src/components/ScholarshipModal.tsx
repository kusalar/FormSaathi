"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { evaluateEligibility } from "@/lib/scholarships";
import { t, UI_TEXT } from "@/lib/i18n";

export function ScholarshipModal() {
  const {
    selectedScholarship,
    setSelectedScholarship,
    lang,
    profile,
    savedScholarships,
    toggleSaveScholarship,
  } = useApp();

  if (!selectedScholarship) return null;

  const eligibility = evaluateEligibility(profile, selectedScholarship, lang);
  const isSaved = savedScholarships.includes(selectedScholarship.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-scholarship-title"
      onClick={() => setSelectedScholarship(null)}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-indigo-100 p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {t(UI_TEXT.common.demoTag, lang)} • SIMULATED
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                {selectedScholarship.category}
              </span>
            </div>
            <h2
              id="modal-scholarship-title"
              className="text-xl sm:text-2xl font-bold text-indigo-950"
            >
              {t(selectedScholarship.name, lang)}
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              {t(selectedScholarship.provider, lang)}
            </p>
          </div>

          <button
            onClick={() => setSelectedScholarship(null)}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-500 hover:bg-indigo-50 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>{t(selectedScholarship.verifiedPortalNote, lang)}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
            <p className="text-xs font-medium text-indigo-700">Estimated Support</p>
            <p className="text-base font-bold text-indigo-950 mt-0.5">
              {t(selectedScholarship.amountLabel, lang)}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-violet-50/70 border border-violet-100">
            <p className="text-xs font-medium text-violet-700">Your Match</p>
            <div className="flex items-center gap-2 mt-0.5">
              {eligibility.status === "eligible" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              )}
              <span className="text-base font-bold text-indigo-950">
                {eligibility.status === "eligible"
                  ? "Indicative Match (Demo)"
                  : eligibility.status === "partial"
                  ? "Complete Profile to Check"
                  : "Criteria Mismatch (Demo)"}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-5 text-sm text-slate-700 leading-relaxed">
          {t(selectedScholarship.summary, lang)}
        </p>

        {eligibility.reasons.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-bold text-indigo-950 mb-2">
              Eligibility Breakdown
            </h3>
            <ul className="space-y-1.5">
              {eligibility.reasons.map((r, idx) => (
                <li key={idx} className="text-xs text-slate-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5">
          <h3 className="text-sm font-bold text-indigo-950 mb-2 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            Required Documents
          </h3>
          <ul className="space-y-2">
            {selectedScholarship.requiredDocuments.map((doc) => (
              <li
                key={doc.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <span className="font-semibold text-indigo-950">{t(doc.label, lang)}</span>
                <p className="text-slate-600 mt-0.5">{t(doc.tip, lang)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-bold text-indigo-950 mb-2">
            Guided Preparation Steps
          </h3>
          <ol className="space-y-2">
            {selectedScholarship.applicationSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  {idx + 1}
                </span>
                <span className="pt-0.5">{t(step, lang)}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => toggleSaveScholarship(selectedScholarship.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isSaved
                ? "bg-indigo-100 text-indigo-900"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? "fill-indigo-600 text-indigo-600" : ""}`} />
            {isSaved ? t(UI_TEXT.common.saved, lang) : t(UI_TEXT.common.save, lang)}
          </button>

          <div className="flex items-center gap-2">
            <Link
              href="/documents"
              onClick={() => setSelectedScholarship(null)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Prepare Documents
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
