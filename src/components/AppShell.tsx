"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  GraduationCap,
  CheckSquare,
  FileText,
  Mic,
  BarChart3,
  HelpCircle,
  Globe,
  Bell,
  Menu,
  X,
  ShieldCheck,
  LogIn,
  LogOut,
  CloudUpload,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { LANGUAGE_META, t, UI_TEXT } from "@/lib/i18n";
import { Language } from "@/types";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    lang,
    setLang,
    profile,
    overallProgress,
    activities,
    user,
    pendingLocalMigration,
    migrateLocalToSupabase,
    dismissLocalMigration,
    signOut,
  } = useApp();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems = [
    { href: "/", icon: Home, label: t(UI_TEXT.nav.home, lang) },
    { href: "/profile", icon: User, label: t(UI_TEXT.nav.profile, lang) },
    { href: "/scholarships", icon: GraduationCap, label: t(UI_TEXT.nav.scholarships, lang) },
    { href: "/eligibility", icon: CheckSquare, label: t(UI_TEXT.nav.eligibility, lang) },
    { href: "/documents", icon: FileText, label: t(UI_TEXT.nav.documents, lang) },
    { href: "/assistant", icon: Mic, label: t(UI_TEXT.nav.assistant, lang) },
    { href: "/progress", icon: BarChart3, label: t(UI_TEXT.nav.progress, lang) },
    { href: "/help", icon: HelpCircle, label: t(UI_TEXT.nav.help, lang) },
  ];

  const SidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#1e1b4b] via-[#2e1065] to-[#1e1b4b] text-white select-none">
      {/* Brand Header */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <span className="font-extrabold text-lg tracking-tight block leading-none">
            FormSaathi
          </span>
          <span className="text-[11px] text-indigo-200 block mt-1 truncate">
            {t(UI_TEXT.brandTagline, lang)}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Primary Navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileNavOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-violet-400 ${
                active
                  ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-950/40"
                  : "text-indigo-100/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Patriotic EdTech Motif */}
      <div className="px-5 py-4 border-t border-white/10 bg-indigo-950/50">
        <p className="text-center text-xs font-semibold italic text-indigo-200">
          Padhega India
        </p>
        <p className="text-center text-xs font-semibold italic text-violet-200">
          Badhega India
        </p>
        <div className="mt-2 h-1.5 w-full rounded-full overflow-hidden flex opacity-90">
          <span className="flex-1 bg-orange-400" />
          <span className="flex-1 bg-white" />
          <span className="flex-1 bg-emerald-500" />
        </div>
        <p className="mt-2 text-[10px] text-center text-indigo-300/80 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Privacy-First • Demo MVP
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen shadow-xl z-30">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-indigo-950/60 backdrop-blur-xs"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation menu"
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-indigo-100/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-xl bg-indigo-50 text-indigo-900 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-indigo-900/80 bg-indigo-50/80 border border-indigo-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Progress: {overallProgress}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 bg-white border border-indigo-200 rounded-full px-2.5 py-1 shadow-xs">
              <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
              <label htmlFor="lang-select" className="sr-only">
                Select Language
              </label>
              <select
                id="lang-select"
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-indigo-950 focus:outline-none cursor-pointer pr-1"
              >
                {(Object.keys(LANGUAGE_META) as Language[]).map((code) => (
                  <option key={code} value={code}>
                    {LANGUAGE_META[code].nativeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Recent activity notifications"
                className="relative p-2 rounded-full bg-white border border-indigo-100 text-indigo-800 hover:bg-indigo-50 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-600" />
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-indigo-100 shadow-xl p-3 z-40">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-indigo-950">Recent Activity</span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Close
                    </button>
                  </div>
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {activities.slice(0, 5).map((act) => (
                      <li key={act.id} className="text-xs">
                        <Link
                          href={act.href}
                          onClick={() => setNotifOpen(false)}
                          className="block p-2 rounded-xl hover:bg-indigo-50 text-slate-700"
                        >
                          <p className="font-medium text-indigo-950">{t(act.label, lang)}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{act.timestamp}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Profile & Auth Controls */}
            <Link
              href="/profile"
              className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-bold flex items-center justify-center">
                {(profile.name?.[0] || "G").toUpperCase()}
              </span>
              <span className="hidden sm:inline text-xs font-semibold text-indigo-950 max-w-[90px] truncate">
                {profile.name || "GUEST"}
              </span>
            </Link>

            {user ? (
              <button
                type="button"
                onClick={() => void signOut()}
                title={`Signed in as ${user.email || "student"}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-indigo-200 hover:bg-rose-50 hover:border-rose-200 text-xs font-semibold text-indigo-950 hover:text-rose-700 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-xs hover:from-indigo-700 hover:to-violet-700 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </header>

        {/* Explicit One-Time LocalStorage -> Supabase Migration Banner */}
        {pendingLocalMigration && user && (
          <div className="bg-indigo-50 border-b border-indigo-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs text-indigo-950">
              <CloudUpload className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p>
                We found saved profile &amp; checklist details on this device. Would you
                like to import them into your account (<strong>{user.email}</strong>)?
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void migrateLocalToSupabase()}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Import to Account
              </button>
              <button
                type="button"
                onClick={dismissLocalMigration}
                className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
}
