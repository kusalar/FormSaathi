"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, FileText, ShieldCheck, RotateCcw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SCHOLARSHIPS } from "@/lib/scholarships";
import { t, UI_TEXT } from "@/lib/i18n";

export default function DocumentsPage() {
  const {
    lang,
    checkedDocs,
    toggleDoc,
    resetChecklist,
    docProgress,
    showToast,
    logActivity,
  } = useApp();
  const [selectedId, setSelectedId] = useState<string>(SCHOLARSHIPS[0].id);

  const currentScholarship =
    SCHOLARSHIPS.find((s) => s.id === selectedId) || SCHOLARSHIPS[0];

  const totalCount = currentScholarship.requiredDocuments.length;
  const completedCount = currentScholarship.requiredDocuments.filter(
    (d) => checkedDocs[d.id]
  ).length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggle = (docId: string, label: string) => {
    const willCheck = !checkedDocs[docId];
    toggleDoc(docId);
    if (willCheck) {
      logActivity(
        {
          en: `Marked "${label}" as ready`,
          hi: `"${label}" को तैयार चिह्नित किया`,
          bn: `"${label}" প্রস্তুত হিসেবে চিহ্নিত করেছেন`,
        },
        "/documents"
      );
      showToast("Document marked ready", label, "success");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-indigo-50 via-white to-violet-50 border border-indigo-100 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs">
        <div className="space-y-2 flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-950">
            {t(UI_TEXT.nav.documents, lang)}
          </h1>
          <p className="text-sm text-slate-600">
            Track the documents you have ready before visiting any official portal.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="rounded-2xl bg-white border border-indigo-100 px-4 py-2 text-xs font-bold text-indigo-950 shadow-xs">
              Overall Readiness:{" "}
              <span className="text-indigo-600 text-sm">{docProgress}%</span>
            </div>
            <button
              type="button"
              onClick={resetChecklist}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-indigo-100 text-xs font-semibold text-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Checklist
            </button>
          </div>
        </div>

        <div className="w-full sm:w-44 h-28 rounded-2xl overflow-hidden border border-indigo-100 shrink-0">
          <img
            src="/assets/document-prep.jpg"
            alt="Organized scholarship documents and checklist"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p>
          Never upload Aadhaar numbers, bank passwords, or sensitive files here. Use
          this checklist simply to stay organized.
        </p>
      </div>

      {/* Scholarship Selector */}
      <div className="rounded-3xl bg-white border border-indigo-100 p-5 shadow-xs space-y-3">
        <label
          htmlFor="doc-scholarship-select"
          className="block text-xs font-bold text-indigo-950"
        >
          Select Demonstration Scholarship
        </label>
        <select
          id="doc-scholarship-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-xl border border-indigo-200 bg-indigo-50/40 px-4 py-2.5 text-sm font-semibold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {SCHOLARSHIPS.map((s) => (
            <option key={s.id} value={s.id}>
              {t(s.name, lang)}
            </option>
          ))}
        </select>

        {/* Progress Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span>
              {completedCount} of {totalCount} documents ready
            </span>
            <span className="text-indigo-700 font-bold">{pct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-indigo-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {currentScholarship.requiredDocuments.map((doc) => {
          const isDone = Boolean(checkedDocs[doc.id]);
          const label = t(doc.label, lang);
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => handleToggle(doc.id, label)}
              className={`w-full text-left rounded-2xl border p-4 sm:p-5 transition flex items-start gap-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                isDone
                  ? "bg-emerald-50/60 border-emerald-200"
                  : "bg-white border-indigo-100 hover:border-indigo-200 shadow-xs"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-6 h-6 text-slate-300 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`font-bold text-sm sm:text-base ${
                      isDone ? "line-through text-emerald-900" : "text-indigo-950"
                    }`}
                  >
                    {label}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      doc.required
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {doc.required ? "Required" : "Recommended"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 flex items-start gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{t(doc.tip, lang)}</span>
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
