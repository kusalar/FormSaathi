"use client";

import React from "react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-white/95 backdrop-blur-md border border-indigo-100 shadow-lg shadow-indigo-950/10 p-3.5 text-sm transition-all"
        >
          {toast.type === "success" && (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          {toast.type === "info" && (
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          )}
          {toast.type === "warning" && (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-indigo-950">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-slate-600 mt-0.5">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            aria-label="Close notification"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
