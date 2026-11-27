"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/context/AppContext";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { showToast } = useApp();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setErrorMsg("Supabase is not configured.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setDone(true);
        showToast("Password updated", "You can now continue with your account.", "success");
        setTimeout(() => router.push("/profile"), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="rounded-3xl bg-white border border-indigo-100 shadow-xl p-6 sm:p-8 space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-indigo-950">Set New Password</h1>
          <p className="text-xs text-slate-500">
            Enter a new password for your FormSaathi account.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {done ? (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Password updated! Redirecting to your profile...</span>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label
                htmlFor="new-pw"
                className="block text-xs font-bold text-indigo-950 mb-1.5"
              >
                New Password
              </label>
              <input
                id="new-pw"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-pw"
                className="block text-xs font-bold text-indigo-950 mb-1.5"
              >
                Confirm New Password
              </label>
              <input
                id="confirm-pw"
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-md"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
