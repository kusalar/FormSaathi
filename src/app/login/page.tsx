"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useApp } from "@/context/AppContext";

type AuthMode = "signin" | "signup" | "reset";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/profile";
  const callbackError = searchParams.get("error");
  const { lang, showToast } = useApp();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    callbackError ? "Authentication link expired or invalid. Please try again." : null
  );
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  const titles = {
    signin:
      lang === "hi"
        ? "FormSaathi में साइन इन करें"
        : lang === "bn"
        ? "FormSaathi-তে সাইন ইন করুন"
        : "Sign in to FormSaathi",
    signup:
      lang === "hi"
        ? "अपना छात्र खाता बनाएं"
        : lang === "bn"
        ? "আপনার শিক্ষার্থী অ্যাকাউন্ট তৈরি করুন"
        : "Create your student account",
    reset:
      lang === "hi"
        ? "पासवर्ड रीसेट करें"
        : lang === "bn"
        ? "পাসওয়ার্ড রিসেট করুন"
        : "Reset your password",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!configured) {
      setErrorMsg(
        "Supabase credentials are not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local."
      );
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setErrorMsg(error.message);
        } else {
          showToast("Signed in successfully", undefined, "success");
          router.push(nextPath);
          router.refresh();
        }
      } else if (mode === "signup") {
        if (!fullName.trim()) {
          setErrorMsg("Please enter your full name.");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile`,
          },
        });
        if (error) {
          setErrorMsg(error.message);
        } else {
          setInfoMsg(
            lang === "hi"
              ? "खाता बन गया! कृपया अपना ईमेल इनबॉक्स जांचें और सत्यापन लिंक पर क्लिक करें।"
              : lang === "bn"
              ? "অ্যাকাউন্ট তৈরি হয়েছে! অনুগ্রহ করে আপনার ইমেইল চেক করে ভেরিফিকেশন লিঙ্কে ক্লিক করুন।"
              : "Account created! Please check your email inbox and click the verification link to activate your account."
          );
          showToast("Verification email sent", "Check your inbox.", "success");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) {
          setErrorMsg(error.message);
        } else {
          setInfoMsg(
            "Password reset instructions have been sent to your email address."
          );
          showToast("Reset email sent", undefined, "info");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-4 sm:py-8 space-y-5">
      <div className="rounded-3xl bg-white border border-indigo-100 shadow-xl shadow-indigo-950/5 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center mx-auto shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-indigo-950">
            {titles[mode]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Save your scholarship preferences &amp; document checklist securely.
          </p>
        </div>

        {!configured && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Supabase Setup Pending</p>
              <p className="mt-0.5">
                Add your keys to <code>.env.local</code> to enable cloud sign-in. You
                can still continue using FormSaathi in local demo mode.
              </p>
            </div>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-indigo-50/80">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              mode === "signin"
                ? "bg-white text-indigo-950 shadow-xs"
                : "text-indigo-700 hover:text-indigo-950"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              mode === "signup"
                ? "bg-white text-indigo-950 shadow-xs"
                : "text-indigo-700 hover:text-indigo-950"
            }`}
          >
            Sign Up
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div
            role="status"
            className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-start gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label
                htmlFor="auth-fullname"
                className="block text-xs font-bold text-indigo-950 mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-indigo-200 text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-bold text-indigo-950 mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-indigo-200 text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {mode !== "reset" && (
            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-bold text-indigo-950 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-indigo-200 text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-500/20 inline-flex items-center justify-center gap-2 transition"
          >
            {loading
              ? "Please wait..."
              : mode === "signin"
              ? "Sign In"
              : mode === "signup"
              ? "Create Account"
              : "Send Reset Link"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
          {mode !== "reset" ? (
            <button
              type="button"
              onClick={() => {
                setMode("reset");
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Forgot password?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Back to Sign In
            </button>
          )}

          <Link href="/" className="text-slate-500 hover:text-indigo-900 font-medium">
            Continue as Guest →
          </Link>
        </div>
      </div>

      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p>
          Privacy Promise: We only store your non-sensitive education preferences and
          document checklist status—never Aadhaar or bank details.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-12 text-center text-sm text-indigo-700">
          Loading authentication...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
