"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Award, CheckCircle2, Clock, Bookmark, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SCHOLARSHIPS } from "@/lib/scholarships";
import { t, UI_TEXT } from "@/lib/i18n";

export default function ProgressPage() {
  const {
    lang,
    overallProgress,
    profileCompleteness,
    docProgress,
    savedScholarships,
    activities,
    setSelectedScholarship,
  } = useApp();

  const savedItems = SCHOLARSHIPS.filter((s) => savedScholarships.includes(s.id));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-950">
          {t(UI_TEXT.nav.progress, lang)}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Track your scholarship readiness, saved schemes, and recent milestones.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-5 shadow-md">
          <p className="text-xs text-indigo-100 font-medium">Overall Readiness</p>
          <p className="text-3xl font-extrabold mt-1">{overallProgress}%</p>
          <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-emerald-300 rounded-full"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-indigo-100 p-5 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Profile Completeness</p>
          <p className="text-3xl font-extrabold text-indigo-950 mt-1">
            {profileCompleteness}%
          </p>
          <Link
            href="/profile"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
          >
            Update Profile <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="rounded-3xl bg-white border border-indigo-100 p-5 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Documents Ready</p>
          <p className="text-3xl font-extrabold text-indigo-950 mt-1">
            {docProgress}%
          </p>
          <Link
            href="/documents"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
          >
            Open Checklist <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Saved Scholarships */}
        <section className="lg:col-span-6 rounded-3xl bg-white border border-indigo-100 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-indigo-950 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-indigo-600" />
            Saved Demo Scholarships ({savedItems.length})
          </h2>

          {savedItems.length === 0 ? (
            <p className="text-sm text-slate-500">
              No scholarships saved yet. Browse scholarships and tap the bookmark icon.
            </p>
          ) : (
            <div className="space-y-3">
              {savedItems.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-bold text-indigo-950">
                      {t(s.name, lang)}
                    </p>
                    <p className="text-xs text-slate-600">{t(s.amountLabel, lang)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedScholarship(s)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shrink-0"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Activity Timeline */}
        <section className="lg:col-span-6 rounded-3xl bg-white border border-indigo-100 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-indigo-950 flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-600" />
            Recent Activity
          </h2>
          <ul className="space-y-3">
            {activities.map((act) => (
              <li
                key={act.id}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-indigo-950">
                    {t(act.label, lang)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{act.timestamp}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Achievement Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-50 via-white to-amber-50 border border-indigo-100 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 shadow-xs">
        <div className="relative w-full sm:w-40 h-28 rounded-2xl overflow-hidden border border-indigo-100 shrink-0">
          <Image
            src="/assets/educational-success.jpg"
            alt="Indian students celebrating educational success"
            fill
            sizes="(max-width: 640px) 100vw, 160px"
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <p className="text-base font-bold text-indigo-950">
              Keep Going! Preparation Beats Last-Minute Rush
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Students who keep their income certificate, marksheet, and bonafide ready
            complete official applications twice as fast.
          </p>
        </div>
      </div>
    </div>
  );
}
