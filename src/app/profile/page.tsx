"use client";

import React, { useState } from "react";
import { User, ShieldCheck, CheckCircle2, Save, RotateCcw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  COURSE_OPTIONS,
  INCOME_OPTIONS,
  INSTITUTION_OPTIONS,
  STATE_OPTIONS,
  YEAR_OPTIONS,
} from "@/lib/scholarships";
import { StudentProfile } from "@/types";
import { t, UI_TEXT } from "@/lib/i18n";

export default function ProfilePage() {
  const {
    profile,
    updateProfile,
    resetProfile,
    profileCompleteness,
    showToast,
    logActivity,
    lang,
  } = useApp();
  const [form, setForm] = useState<StudentProfile>(profile);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError("Please enter your first name or nickname.");
      showToast("Name required", "Please enter a name before saving.", "warning");
      return;
    }
    setNameError(null);
    updateProfile(form);
    logActivity(
      {
        en: "Updated student education profile",
        hi: "छात्र शिक्षा प्रोफ़ाइल अपडेट की",
        bn: "শিক্ষার্থীর শিক্ষা প্রোফাইল আপডেট করা হয়েছে",
      },
      "/profile"
    );
    showToast(
      "Profile Saved",
      "Your scholarship eligibility matches are now updated.",
      "success"
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 to-violet-900 text-white p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl font-extrabold">
            {(form.name?.[0] || "S").toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <User className="w-5 h-5 text-violet-300" />
              {t(UI_TEXT.nav.profile, lang)}
            </h1>
            <p className="text-sm text-indigo-200 mt-0.5">
              Keep your education details updated for accurate eligibility checks.
            </p>
          </div>
        </div>

        <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-center shrink-0">
          <p className="text-xs text-indigo-200">Profile Completeness</p>
          <p className="text-2xl font-extrabold text-emerald-300">
            {profileCompleteness}%
          </p>
        </div>
      </div>

      {/* Privacy Guarantee */}
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs sm:text-sm text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <p>{t(UI_TEXT.privacyBanner, lang)}</p>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-3xl bg-white border border-indigo-100 shadow-sm p-6 sm:p-8 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="student-name"
              className="block text-xs font-bold text-indigo-950 mb-1.5"
            >
              First Name / Nickname
            </label>
            <input
              id="student-name"
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (nameError) setNameError(null);
              }}
              placeholder="e.g. Aarav or Priya"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-indigo-950 focus:outline-none focus:ring-2 ${
                nameError
                  ? "border-rose-400 focus:ring-rose-400"
                  : "border-indigo-200 focus:ring-indigo-500"
              }`}
            />
            {nameError && (
              <p className="text-xs text-rose-600 font-medium mt-1">{nameError}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="student-course"
              className="block text-xs font-bold text-indigo-950 mb-1.5"
            >
              Course / Degree
            </label>
            <select
              id="student-course"
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              className="w-full rounded-xl border border-indigo-200 px-3.5 py-2.5 text-sm text-indigo-950 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select course...</option>
              {COURSE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="student-year"
              className="block text-xs font-bold text-indigo-950 mb-1.5"
            >
              Current Year of Study
            </label>
            <select
              id="student-year"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              className="w-full rounded-xl border border-indigo-200 px-3.5 py-2.5 text-sm text-indigo-950 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select year...</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="student-inst"
              className="block text-xs font-bold text-indigo-950 mb-1.5"
            >
              Institution Type
            </label>
            <select
              id="student-inst"
              value={form.institutionType}
              onChange={(e) =>
                setForm({
                  ...form,
                  institutionType: e.target.value as StudentProfile["institutionType"],
                })
              }
              className="w-full rounded-xl border border-indigo-200 px-3.5 py-2.5 text-sm text-indigo-950 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select institution type...</option>
              {INSTITUTION_OPTIONS.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="student-income"
              className="block text-xs font-bold text-indigo-950 mb-1.5"
            >
              Approximate Annual Family Income
            </label>
            <select
              id="student-income"
              value={form.annualIncome}
              onChange={(e) => setForm({ ...form, annualIncome: e.target.value })}
              className="w-full rounded-xl border border-indigo-200 px-3.5 py-2.5 text-sm text-indigo-950 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select income range...</option>
              {INCOME_OPTIONS.map((inc) => (
                <option key={inc.value} value={inc.value}>
                  {inc.value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="student-state"
              className="block text-xs font-bold text-indigo-950 mb-1.5"
            >
              Home State / UT
            </label>
            <select
              id="student-state"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full rounded-xl border border-indigo-200 px-3.5 py-2.5 text-sm text-indigo-950 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select state...</option>
              {STATE_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 cursor-pointer">
          <input
            type="checkbox"
            checked={form.firstGen}
            onChange={(e) => setForm({ ...form, firstGen: e.target.checked })}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-indigo-950">
            I am a first-generation college learner in my family
          </span>
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Stored locally in your browser only
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                resetProfile();
                setForm({
                  name: "Aarav",
                  course: "",
                  year: "",
                  institutionType: "",
                  annualIncome: "",
                  state: "",
                  category: "",
                  firstGen: true,
                });
                setNameError(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition focus:outline-none focus:ring-4 focus:ring-indigo-300"
            >
              <Save className="w-4 h-4" />
              Save Profile
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
